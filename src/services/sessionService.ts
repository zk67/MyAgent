import { randomUUID } from 'node:crypto';
import { decryptToken, encryptToken } from '@/lib/server/tokenEncryption';
import { query, withTransaction } from '@/lib/server/database';
import type { CalendarTokens } from '@/types/types';

export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

export type GoogleProfile = {
  id: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

type StoredConnection = {
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  token_expires_at: Date | null;
};

export async function createSession(sessionId: string) {
  await query(
    `INSERT INTO app_sessions (id, expires_at)
     VALUES ($1, NOW() + ($2 * INTERVAL '1 second'))`,
    [sessionId, SESSION_DURATION_SECONDS]
  );
}

export async function saveGoogleConnection(
  sessionId: string,
  profile: GoogleProfile,
  tokens: CalendarTokens
) {
  await withTransaction(async (client) => {
    const userResult = await client.query<{ id: string }>(
      `INSERT INTO users (id, google_subject, email, display_name, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (google_subject) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url,
         updated_at = NOW()
       RETURNING id`,
      [randomUUID(), profile.id, profile.email ?? null, profile.name ?? null, profile.picture ?? null]
    );
    const userId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO google_connections (
         user_id, encrypted_access_token, encrypted_refresh_token, token_expires_at
       ) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         encrypted_access_token = EXCLUDED.encrypted_access_token,
         encrypted_refresh_token = COALESCE(EXCLUDED.encrypted_refresh_token, google_connections.encrypted_refresh_token),
         token_expires_at = EXCLUDED.token_expires_at,
         updated_at = NOW()`,
      [
        userId,
        encryptToken(tokens.accessToken),
        tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
        tokens.expiresAt ? new Date(tokens.expiresAt) : null,
      ]
    );

    const sessionResult = await client.query(
      `UPDATE app_sessions
       SET user_id = $1, expires_at = NOW() + ($3 * INTERVAL '1 second')
       WHERE id = $2 AND expires_at > NOW()`,
      [userId, sessionId, SESSION_DURATION_SECONDS]
    );

    if (sessionResult.rowCount !== 1) {
      throw new Error('OAuth session is missing or expired.');
    }
  });
}

export async function getSessionTokens(sessionId: string): Promise<CalendarTokens | undefined> {
  const result = await query<StoredConnection>(
    `SELECT gc.encrypted_access_token, gc.encrypted_refresh_token, gc.token_expires_at
     FROM app_sessions s
     JOIN google_connections gc ON gc.user_id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId]
  );
  const connection = result.rows[0];
  if (!connection) return undefined;

  return {
    accessToken: decryptToken(connection.encrypted_access_token),
    refreshToken: connection.encrypted_refresh_token
      ? decryptToken(connection.encrypted_refresh_token)
      : undefined,
    expiresAt: connection.token_expires_at?.getTime(),
  };
}

export async function updateSessionTokens(sessionId: string, tokens: CalendarTokens) {
  const result = await query(
    `UPDATE google_connections gc SET
       encrypted_access_token = $2,
       encrypted_refresh_token = COALESCE($3, gc.encrypted_refresh_token),
       token_expires_at = $4,
       updated_at = NOW()
     FROM app_sessions s
     WHERE s.id = $1 AND s.user_id = gc.user_id AND s.expires_at > NOW()`,
    [
      sessionId,
      encryptToken(tokens.accessToken),
      tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
      tokens.expiresAt ? new Date(tokens.expiresAt) : null,
    ]
  );

  if (result.rowCount !== 1) {
    throw new Error('No active Google connection found for this session.');
  }
}

export async function deleteSession(sessionId: string) {
  await query('DELETE FROM app_sessions WHERE id = $1', [sessionId]);
}
