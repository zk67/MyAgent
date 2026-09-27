import {
  getEvents,
  newEvent,
  updateEvent,
  deleteEvent,
} from '@/services/calendarService';

export async function executeTool(functionCall: any, sessionId: string) {
  const args = functionCall.args ?? {};

  switch (functionCall.name) {
    case 'get_events':
      return getEvents(
        sessionId, 
        args.timeMin, 
        args.timeMax
      );

    case 'create_event':
      return newEvent(
        sessionId,
        args.title,
        args.startTime,
        args.startDate,
        args.description,
        args.endTime,
        args.reminder,
        args.location,
      );

    case 'update_event':
      return updateEvent(
        sessionId,
        args.event, 
        args.update
      );

    case 'delete_event':
      return deleteEvent(
        sessionId, 
        args.eventIds
      );

    default:
      throw new Error(`Unknown tool: ${functionCall.name}`);
  }
}
