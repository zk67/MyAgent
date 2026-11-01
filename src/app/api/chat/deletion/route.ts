import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { deleteEvent } from '@/services/calendarService';
import {
  cancelPendingDeletion,
  consumePendingDeletion,
} from '@/services/sessionService';

export async function POST(request: Request) {
  const sessionId = (await cookies()).get('session_id')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Please reconnect your calendar.' }, { status: 401 });

  const body = await request.json();
  if (typeof body.requestId !== 'string' || typeof body.confirm !== 'boolean') {
    return NextResponse.json({ error: 'Invalid confirmation request.' }, { status: 400 });
  }

  if (!body.confirm) {
    await cancelPendingDeletion(sessionId, body.requestId);
    return NextResponse.json({ cancelled: true });
  }

  const eventIds = await consumePendingDeletion(sessionId, body.requestId);
  if (!eventIds) return NextResponse.json({ error: 'This confirmation has expired.' }, { status: 410 });

  await deleteEvent(sessionId, eventIds);
  return NextResponse.json({ deleted: true });
}
