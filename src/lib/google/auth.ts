import { google } from 'googleapis';

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