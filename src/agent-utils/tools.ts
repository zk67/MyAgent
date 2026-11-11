import {
  getEvents,
  newEvent,
  newEventWithRecurrence,
  updateEvent,
  deleteEvent,
} from '@/services/calendarService';
import type { CalendarEvent } from '@/types/types';
import type Anthropic from '@anthropic-ai/sdk';

type BatchEventInput = {
  title?: string;
  startTime?: string;
  startDate?: string;
  description?: string;
  endTime?: string;
  reminder?: number;
  location?: string;
  recurrence?: string;
};

export async function executeTool(toolRequest: Anthropic.ToolUseBlock, sessionId: string) {
  const args = (toolRequest.input ?? {}) as Record<string, unknown>;

  const stringArgument = (name: string) => {
    const value = args[name];
    return typeof value === 'string' ? value : undefined;
  };

  switch (toolRequest.name) {
    case 'get_events': {
      const result = await getEvents(
        sessionId,
        stringArgument('timeMin') ?? '',
        stringArgument('timeMax') ?? ''
      );

      // Keep only what the model needs, to save tokens.
      return (result.items ?? []).map(({ id, summary, description, location, start, end }) => ({
        id, summary, description, location, start, end,
      }));
    }

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

    case 'create_events': {
      const items = Array.isArray(args.events) ? (args.events as BatchEventInput[]) : [];
      if (items.length === 0) throw new Error('At least one event is required.');
      if (items.length > 20) throw new Error('Maximum 20 events per batch.');

      const results: { title: string; status: string; error?: string }[] = [];
      for (const item of items) {
        try {
          await newEventWithRecurrence(
            sessionId,
            item.title ?? '',
            item.startTime ?? '',
            item.startDate ?? '',
            item.description,
            item.endTime,
            typeof item.reminder === 'number' ? item.reminder : undefined,
            item.location,
            item.recurrence,
          );
          results.push({ title: item.title ?? '', status: 'created' });
        } catch (error) {
          results.push({
            title: item.title ?? '',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      return results;
    }

    default:
      throw new Error(`Unknown tool: ${toolRequest.name}`);
  }
}
