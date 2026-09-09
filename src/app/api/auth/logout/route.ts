import { deleteTokens } from '@/services/calendarService';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();
    const session_id = cookieStore.get('session_id')?.value;

    if (session_id) {
        deleteTokens(session_id);
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, message: 'Missing session_id' }, { status: 400 });
}
