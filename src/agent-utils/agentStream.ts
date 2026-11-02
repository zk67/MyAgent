import { askAgent, askAgentStream } from '@/services/model';
import { executeTool } from '@/agent-utils/tools';
import { ChatMessage } from '@/types/types';
import { Content, FunctionCall, Part } from '@google/genai';
import { createPendingDeletion } from '@/services/sessionService';
import { getEventsById, isSessionError } from '@/services/calendarService';

const MAX_TOOL_ROUNDS = 10;

type StreamEvent =
  | { type: 'token'; text: string }
  | { type: 'tool_start'; name: string }
  | { type: 'tool_done'; name: string }
  | { type: 'done'; messages: ChatMessage[]; calendarModified: boolean }
  | { type: 'pending_deletion'; messages: ChatMessage[]; calendarModified: boolean; pendingDeletion: PendingDeletionResult }
  | { type: 'error'; error: string; code?: number };

type ToolError = { error: string };

function isToolError(output: unknown): output is ToolError {
  return typeof output === 'object' && output !== null && 'error' in output;
}

async function runTool(call: FunctionCall, sessionId: string) {
  try {
    return await executeTool(call, sessionId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The tool failed.';
    if (isSessionError(message)) throw error;
    return { error: message } satisfies ToolError;
  }
}

type PendingDeletionResult = { id: string; events: { id: string; title: string }[] };

async function prepareDeletion(call: FunctionCall, sessionId: string): Promise<{ pendingDeletion: PendingDeletionResult } | ToolError> {
  const ids = call.args?.eventIds;
  const eventIds = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  try {
    const events = await getEventsById(sessionId, eventIds);
    const result: PendingDeletionResult = await createPendingDeletion(sessionId, events);
    return { pendingDeletion: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to find these events.';
    if (isSessionError(message)) throw error;
    return { error: message } satisfies ToolError;
  }
}

export async function runAgentStream(
  messages: ChatMessage[],
  sessionId: string,
  file: File | undefined,
  emit: (event: StreamEvent) => void,
) {
  const contents: Content[] = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  let calendarModified = false;

  // First call: try streaming for a direct text answer.
  const streamResponse = await askAgentStream(contents, file);

  // Collect chunks to detect if there are function calls.
  let fullText = '';
  const allCandidates: Content[] = [];
  let functionCalls: FunctionCall[] | undefined;

  for await (const chunk of streamResponse) {
    const text = chunk.text;
    if (text) {
      fullText += text;
      emit({ type: 'token', text });
    }

    // Collect function calls from candidates.
    if (chunk.candidates?.[0]?.content) {
      allCandidates.push(chunk.candidates[0].content);
    }
    if (chunk.functionCalls?.length) {
      functionCalls = chunk.functionCalls;
    }
  }

  // If no function calls: done.
  if (!functionCalls?.length) {
    messages.push({ role: 'assistant', content: fullText });
    emit({ type: 'done', messages, calendarModified });
    return;
  }

  // There are tool calls; switch to non-streaming loop for tool execution.
  // Use the collected model content.
  const modelContent: Content = {
    role: 'model',
    parts: allCandidates.flatMap((c) => c.parts || []),
  };
  contents.push(modelContent);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const calls = functionCalls!;
    const results: Part[] = [];

    for (const call of calls) {
      emit({ type: 'tool_start', name: call.name ?? 'unknown' });

      let output;
      if (call.name === 'delete_event') {
        const deletion = await prepareDeletion(call, sessionId);
        if ('pendingDeletion' in deletion) {
          messages.push({
            role: 'assistant',
            content: 'Please review the events below and confirm before I delete them.',
          });
          emit({ type: 'pending_deletion', messages, calendarModified, pendingDeletion: deletion.pendingDeletion });
          return;
        }
        output = deletion;
      } else {
        output = await runTool(call, sessionId);
        const changesCalendar = call.name === 'create_event' || call.name === 'create_events' || call.name === 'update_event';
        if (changesCalendar && !isToolError(output)) calendarModified = true;
      }

      emit({ type: 'tool_done', name: call.name ?? 'unknown' });
      results.push({ functionResponse: { id: call.id, name: call.name, response: { output } } });
    }

    contents.push({ role: 'user', parts: results });

    // Get next response (non-streaming for tool follow-ups).
    const response = await askAgent(contents);
    functionCalls = response.functionCalls;

    if (!functionCalls?.length) {
      const text = response.text ?? '';
      messages.push({ role: 'assistant', content: text });
      emit({ type: 'done', messages, calendarModified });
      return;
    }

    const nextModelContent = response.candidates?.[0]?.content;
    if (nextModelContent) contents.push(nextModelContent);
  }

  throw new Error('Maximum agent iterations reached.');
}
