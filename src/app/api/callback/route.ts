import { NextResponse } from 'next/server';
import { getGoogleProfile, getGoogleTokens } from '@/services/authService';
import { cookies } from 'next/headers';
import { saveGoogleConnection } from '@/services/sessionService';
import { CalendarTokens } from '@/types/types';

function redirectTo(request: Request, path: string) {
  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  return NextResponse.redirect(new URL(path, appUrl));
}

function redirectToAuthError(request: Request, reason: string) {
  return redirectTo(request, `/authError?reason=${reason}`);
}

// Google sends the user back here after sign-in.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const cookieStore = await cookies();

  const code = params.get('code');
  const state = params.get('state');
  const googleError = params.get('error');
  const savedState = cookieStore.get('oauth_state')?.value;
  const sessionId = cookieStore.get('session_id')?.value;

  if (googleError) {
    return redirectToAuthError(request, googleError === 'access_denied' ? 'access_denied' : 'connection_failed');
  }
  if (!state || !savedState || !code || !sessionId) {
    return redirectToAuthError(request, 'missing_data');
  }
  if (state !== savedState) {
    return redirectToAuthError(request, 'invalid_state');
  }

  try {
    const googleTokens = await getGoogleTokens(code);
    // Without a refresh token we could not stay connected later.
    if (!googleTokens.access_token || !googleTokens.refresh_token) {
      return redirectToAuthError(request, 'connection_failed');
    }

    const tokens: CalendarTokens = {
      accessToken: googleTokens.access_token,
      refreshToken: googleTokens.refresh_token,
      expiresAt: googleTokens.expiry_date ?? undefined,
    };

    const profile = await getGoogleProfile(tokens);
    await saveGoogleConnection(sessionId, profile, tokens);

    return redirectTo(request, '/authSuccess');
  } catch (error) {
    console.error('Google OAuth callback failed:', error);
    return redirectToAuthError(request, 'connection_failed');
  }
}
