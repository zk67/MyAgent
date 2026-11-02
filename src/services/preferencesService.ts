import { query } from '@/lib/server/database';
import type { Locale } from '@/lib/i18n';

export type UserPreferences = {
  timezone: string;
  defaultReminder: number | null;
  locale: Locale;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: 'America/Montreal',
  defaultReminder: 30,
  locale: 'fr',
};

/** Returns the user_id linked to a session, or null if the session is invalid. */
export async function getUserIdFromSession(sessionId: string): Promise<string | null> {
  const result = await query<{ user_id: string }>(
    'SELECT user_id FROM app_sessions WHERE id = $1 AND expires_at > NOW()',
    [sessionId],
  );
  return result.rows[0]?.user_id ?? null;
}

/** Load preferences, falling back to defaults when no row exists yet. */
export async function getPreferences(userId: string): Promise<UserPreferences> {
  const result = await query<{ timezone: string; default_reminder: number | null; locale: string }>(
    'SELECT timezone, default_reminder, locale FROM user_preferences WHERE user_id = $1',
    [userId],
  );

  const row = result.rows[0];
  if (!row) return DEFAULT_PREFERENCES;

  return {
    timezone: row.timezone,
    defaultReminder: row.default_reminder,
    locale: (row.locale === 'en' ? 'en' : 'fr') as Locale,
  };
}

/** Create or update preferences for a user. */
export async function savePreferences(
  userId: string,
  prefs: Partial<UserPreferences>,
) {
  const timezone = prefs.timezone ?? DEFAULT_PREFERENCES.timezone;
  const defaultReminder = prefs.defaultReminder ?? DEFAULT_PREFERENCES.defaultReminder;
  const locale = prefs.locale ?? DEFAULT_PREFERENCES.locale;

  await query(
    `INSERT INTO user_preferences (user_id, timezone, default_reminder, locale)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       timezone = EXCLUDED.timezone,
       default_reminder = EXCLUDED.default_reminder,
       locale = EXCLUDED.locale,
       updated_at = NOW()`,
    [userId, timezone, defaultReminder, locale],
  );
}
