import { NextResponse } from 'next/server';
import { createOAuth2client } from '@/lib/google/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const oauth2client = createOAuth2client();
  const state = crypto.randomUUID();
  const sessionId = crypto.randomUUID();

  const cookieStore = await cookies();

  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  const authUrl = oauth2client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: state,
  });

  return NextResponse.redirect(authUrl); 
}
