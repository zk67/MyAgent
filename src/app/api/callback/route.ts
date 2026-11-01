import { NextResponse } from 'next/server';
import { getGoogleProfile, getGoogleTokens } from '@/services/authService';
import { cookies } from 'next/headers';
import { saveGoogleConnection } from '@/services/sessionService';
import { CalendarTokens } from '@/types/types';

function redirectToAuthError(request: Request, reason: string) {
  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  return NextResponse.redirect(new URL(`/authError?reason=${reason}`, appUrl));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const savedState = (await cookies()).get('oauth_state')?.value;

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const sessionId = (await cookies()).get('session_id')?.value;

  if (error) {
    return redirectToAuthError(request, error === 'access_denied' ? 'access_denied' : 'connection_failed');
  }

  if (!state || !savedState || !code || !sessionId) {
    return redirectToAuthError(request, 'missing_data');
  }

  if (state !== savedState) {
    return redirectToAuthError(request, 'invalid_state');
  }

  try {
    const tokens = await getGoogleTokens(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      return redirectToAuthError(request, 'connection_failed');
    }

    const calendarTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ?? undefined,
    } satisfies CalendarTokens;

    const profile = await getGoogleProfile(calendarTokens);
    await saveGoogleConnection(sessionId, profile, calendarTokens);
    const appUrl = process.env.APP_URL || new URL(request.url).origin;
    return NextResponse.redirect(new URL('/authSuccess', appUrl));
  } catch (error) {
    console.error('Google OAuth callback failed:', error);
    return redirectToAuthError(request, 'connection_failed');
  }
}
