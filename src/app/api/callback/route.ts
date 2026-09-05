import { NextResponse } from 'next/server';
import { getGoogleTokens } from '@/lib/google/auth';
import { cookies } from 'next/headers';
import { saveTokens } from '@/services/calendarService';
import { CalendarTokens } from '@/types/types';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const savedState = (await cookies()).get('oauth_state')?.value;

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const sessionId = (await cookies()).get('session_id')?.value;

  if (error) {
    return new Response('Google OAuth error', { status: 400 });
  }

  if (!state || !savedState || !code || !sessionId) {
    return new Response('Missing OAuth data', {
      status: 400,
    });
  }

  if (state !== savedState) {
    return new Response('Invalid OAuth state', { status: 400});
  }
  const tokens = await getGoogleTokens(code);
  saveTokens(sessionId, {accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: tokens.expiry_date } as CalendarTokens);
  return NextResponse.redirect(new URL('/authSuccess', request.url));
}