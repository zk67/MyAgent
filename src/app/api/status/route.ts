import { cookies } from 'next/headers';
import { getTokens } from '@/services/calendarService';
import { NextResponse } from 'next/server';

export async function GET() {
    const sessionId = (await cookies()).get('session_id')?.value;
    if (!sessionId) {
        return NextResponse.json(
            { connected: false, error: 'No session ID found' },
            { status: 401 }
        );
    }
    const tokens = getTokens(sessionId);
    
    if (!tokens) {
        return NextResponse.json(
            { connected: false, error: 'No tokens found' },
            { status: 401 }
        );
    }
    return NextResponse.json({ connected: true });
}