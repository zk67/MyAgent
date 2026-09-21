import { deleteTokens } from '@/services/calendarService';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    const sessionId = (await cookies()).get('session_id')?.value;

    if (!sessionId) {
        return NextResponse.json(
            { success: false, message: 'Missing session_id' },
            { status: 400 }
        );
    }

    deleteTokens(sessionId);
    return NextResponse.json({ success: true });
}
