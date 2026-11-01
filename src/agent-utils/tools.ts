import {
  getEvents,
  newEvent,
  updateEvent,
  deleteEvent,
} from '@/services/calendarService';
import type { CalendarEvent } from '@/types/types';
import type { FunctionCall } from '@google/genai';

export async function executeTool(functionCall: FunctionCall, sessionId: string) {
  const args = functionCall.args ?? {};

  const stringArgument = (name: string) => {
    const value = args[name];
    return typeof value === 'string' ? value : undefined;
  };

  switch (functionCall.name) {
    case 'get_events':
      return getEvents(
        sessionId, 
        stringArgument('timeMin') ?? '',
        stringArgument('timeMax') ?? ''
      );

    case 'create_event':
      return newEvent(
        sessionId,
        stringArgument('title') ?? '',
        stringArgument('startTime') ?? '',
        stringArgument('startDate') ?? '',
        stringArgument('description'),
        stringArgument('endTime'),
        typeof args.reminder === 'number' ? args.reminder : undefined,
        stringArgument('location'),
      );

    case 'update_event':
      return updateEvent(
        sessionId,
        args.event as CalendarEvent,
        args.update as Partial<CalendarEvent>
      );

    case 'delete_event':
      return deleteEvent(
        sessionId, 
        Array.isArray(args.eventIds)
          ? args.eventIds.filter((id): id is string => typeof id === 'string')
          : []
      );

    default:
      throw new Error(`Unknown tool: ${functionCall.name}`);
  }
}
