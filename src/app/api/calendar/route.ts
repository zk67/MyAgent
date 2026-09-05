import { getEvents } from '@/services/calendarService';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 401 });
    }

    const url = new URL(request.url);
    const now = new Date();
    const year = Number(url.searchParams.get('year')) || now.getFullYear();
    const month = Number(url.searchParams.get('month')) || now.getMonth() + 1;
    const startOfMonth = new Date(year, month - 1, 1);
    const startOfNextMonth = new Date(year, month, 1);
    const timeMin = startOfMonth.toISOString();
    const timeMax = startOfNextMonth.toISOString();
    const eventsData = await getEvents(sessionId, timeMin, timeMax);

    return NextResponse.json({ events: eventsData.items || [] });
    
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur API /api/calendar :', message);

      if (message.includes('No tokens found')) {
            return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Erreur lors de la récupération des événements' },{ status: 500 }
    );
  }
}