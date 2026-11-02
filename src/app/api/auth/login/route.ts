import { NextResponse } from 'next/server';
import { createOAuth2client } from '@/services/authService';
import { cookies, headers } from 'next/headers';
import { allowLoginRequest, createSession, SESSION_DURATION_SECONDS } from '@/services/sessionService';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
} as const;

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
];

// Limits login attempts per IP address.
async function isLoginAllowed() {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  try {
    return await allowLoginRequest(ip);
  } catch {
    // If the rate limit table doesn't exist yet, let the request through.
    return true;
  }
}

// Starts the Google sign-in: creates a session and sends the user to Google.
export async function GET() {
  if (!(await isLoginAllowed())) {
    return NextResponse.json({ error: 'Too many login attempts. Please wait a minute.' }, { status: 429 });
  }

  const sessionId = crypto.randomUUID();
  const state = crypto.randomUUID(); // Checked again in the callback to make sure the request is ours.
  await createSession(sessionId);

  const cookieStore = await cookies();
  cookieStore.set('session_id', sessionId, { ...COOKIE_OPTIONS, maxAge: SESSION_DURATION_SECONDS });
  cookieStore.set('oauth_state', state, COOKIE_OPTIONS);

  const authUrl = createOAuth2client().generateAuthUrl({
    access_type: 'offline', // Needed to get a refresh token.
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
    state,
  });

  return NextResponse.redirect(authUrl);
}
