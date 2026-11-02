import { cookies } from 'next/headers';
import {
  getPreferences,
  getUserIdFromSession,
  savePreferences,
} from '@/services/preferencesService';

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function GET() {
  const sessionId = (await cookies()).get('session_id')?.value;
  if (!sessionId) return errorResponse('Not authenticated.', 401);

  const userId = await getUserIdFromSession(sessionId);
  if (!userId) return errorResponse('Session expired.', 401);

  const prefs = await getPreferences(userId);
  return Response.json(prefs);
}

export async function PUT(request: Request) {
  const sessionId = (await cookies()).get('session_id')?.value;
  if (!sessionId) return errorResponse('Not authenticated.', 401);

  const userId = await getUserIdFromSession(sessionId);
  if (!userId) return errorResponse('Session expired.', 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON.', 400);
  }

  if (typeof body !== 'object' || body === null) {
    return errorResponse('Invalid body.', 400);
  }

  const { timezone, defaultReminder, locale } = body as Record<string, unknown>;

  if (timezone !== undefined && typeof timezone !== 'string') {
    return errorResponse('timezone must be a string.', 400);
  }
  if (defaultReminder !== undefined && defaultReminder !== null && typeof defaultReminder !== 'number') {
    return errorResponse('defaultReminder must be a number or null.', 400);
  }
  if (locale !== undefined && locale !== 'fr' && locale !== 'en') {
    return errorResponse('locale must be "fr" or "en".', 400);
  }

  await savePreferences(userId, {
    timezone: timezone as string | undefined,
    defaultReminder: defaultReminder as number | null | undefined,
    locale: locale as 'fr' | 'en' | undefined,
  });

  const updated = await getPreferences(userId);
  return Response.json(updated);
}
