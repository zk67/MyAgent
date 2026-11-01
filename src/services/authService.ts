import { google } from 'googleapis';
import type { CalendarTokens } from '@/types/types';

export function createOAuth2client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
} 

export async function getGoogleTokens(code: string) {
    const oauth2client = createOAuth2client(); 
    const { tokens } = await oauth2client.getToken(code);
    return tokens;
}

export async function getGoogleProfile(tokens: CalendarTokens) {
    const oauth2client = createOAuth2client();
    oauth2client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiry_date: tokens.expiresAt,
    });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2client });
    const { data } = await oauth2.userinfo.get();

    if (!data.id) {
        throw new Error('Google did not return a user identifier.');
    }

    return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
    };
}
