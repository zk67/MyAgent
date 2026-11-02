import { cookies } from 'next/headers';
import { createOAuth2client } from '@/services/authService';
import { getSessionTokens, deleteSession } from '@/services/sessionService';
import { getUserIdFromSession } from '@/services/preferencesService';
import { query } from '@/lib/server/database';

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

/**
 * DELETE /api/account
 * Revokes Google access, deletes all user data, and ends the session.
 */
export async function DELETE() {
  const sessionId = (await cookies()).get('session_id')?.value;
  if (!sessionId) return errorResponse('Not authenticated.', 401);

  const userId = await getUserIdFromSession(sessionId);
  if (!userId) return errorResponse('Session expired.', 401);

  // Try to revoke the Google token before deleting anything.
  try {
    const tokens = await getSessionTokens(sessionId);
    if (tokens) {
      const oauth = createOAuth2client();
      oauth.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
      await oauth.revokeCredentials();
    }
  } catch (error) {
    // If revocation fails (expired token, network issue), continue with deletion.
    console.error('Google token revocation failed:', error instanceof Error ? error.message : error);
  }

  // Delete all user data. CASCADE handles related tables
  // (google_connections, user_preferences, documents, conversations, action_log, etc.).
  await query('DELETE FROM users WHERE id = $1', [userId]);

  // Clean up the session.
  await deleteSession(sessionId);

  const cookieStore = await cookies();
  cookieStore.delete('session_id');

  return Response.json({ success: true });
}
