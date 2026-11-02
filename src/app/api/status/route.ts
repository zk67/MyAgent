import { cookies } from 'next/headers';
import { getTokens } from '@/services/calendarService';
import { getUserIdFromSession, getPreferences } from '@/services/preferencesService';
import { NextResponse } from 'next/server';

export async function GET() {
    const sessionId = (await cookies()).get('session_id')?.value;
    if (!sessionId) {
        return NextResponse.json(
            { connected: false, error: 'No session ID found' },
            { status: 401 }
        );
    }

    const tokens = await getTokens(sessionId);
    if (!tokens || !tokens.refreshToken) {
        return NextResponse.json(
            { connected: false, error: 'No tokens found' },
            { status: 401 }
        );
    }

    // Load user preferences alongside connection status.
    let preferences: { timezone: string; defaultReminder: number | null; locale: string } = { timezone: 'America/Montreal', defaultReminder: 30, locale: 'fr' };
    try {
        const userId = await getUserIdFromSession(sessionId);
        if (userId) preferences = await getPreferences(userId);
    } catch {
        // Preferences table may not exist yet; use defaults.
    }

    return NextResponse.json({ connected: true, preferences });
}
