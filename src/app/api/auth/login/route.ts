import { NextResponse } from 'next/server';
import { createOAuth2client } from '@/services/authService';
import { cookies } from 'next/headers';
import { createSession, SESSION_DURATION_SECONDS } from '@/services/sessionService';

export async function GET() {
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
