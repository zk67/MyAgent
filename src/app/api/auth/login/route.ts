import { NextResponse } from 'next/server';
import { createOAuth2client } from '@/services/authService';
import { cookies, headers } from 'next/headers';
import { allowLoginRequest, createSession, SESSION_DURATION_SECONDS } from '@/services/sessionService';

export async function GET() {
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  try {
    if (!(await allowLoginRequest(ip))) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a minute.' },
        { status: 429 }
      );
    }
  } catch {
    // If the rate limit table doesn't exist yet, let the request through.
  }

  const oauthClient = createOAuth2client();
  const state = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  await createSession(sessionId);

  const cookieStore = await cookies();

  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });

  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  const authUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    state,
  });

  return NextResponse.redirect(authUrl);
}
