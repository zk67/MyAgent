import { askAgent } from '@/services/model';
import { executeTool } from '@/agent-utils/tools';
import { ChatMessage } from '@/types/types';
import { Content, FunctionCall, Part } from '@google/genai';
import { createPendingDeletion } from '@/services/sessionService';
import { getEventsById, isSessionError } from '@/services/calendarService';

const MAX_TOOL_ROUNDS = 10;
const CALENDAR_CHANGING_TOOLS = new Set(['create_event', 'create_events', 'update_event']);

type ToolError = { error: string };

function isToolError(output: unknown): output is ToolError {
  return typeof output === 'object' && output !== null && 'error' in output;
}

// Runs a tool. If it fails, the error goes back to the model so it can
// correct itself or explain the problem. Expired sessions are the exception:
// they stop the request so the user can reconnect.
async function runTool(call: FunctionCall, sessionId: string) {
  try {
    return await executeTool(call, sessionId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The tool failed.';
    if (isSessionError(message)) throw error;
    return { error: message } satisfies ToolError;
  }
}

// Deleting is never done by the model. We save the request and ask the user to confirm.
async function prepareDeletion(call: FunctionCall, sessionId: string) {
  const ids = call.args?.eventIds;
  const eventIds = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];

  try {
    const events = await getEventsById(sessionId, eventIds);
    return { pendingDeletion: await createPendingDeletion(sessionId, events) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to find these events.';
    if (isSessionError(message)) throw error;
    return { error: message } satisfies ToolError;
  }
}

// Convert the chat history to the format Gemini expects.
function toGeminiContents(messages: ChatMessage[]): Content[] {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

// Handles one tool request from the model. Returns a pending deletion
// when the user must confirm, otherwise the tool output.
async function handleToolCall(call: FunctionCall, sessionId: string) {
  if (call.name === 'delete_event') {
    const deletion = await prepareDeletion(call, sessionId);
    if ('pendingDeletion' in deletion) return { pendingDeletion: deletion.pendingDeletion };
    return { output: deletion };
  }

  const output = await runTool(call, sessionId);
  const changedCalendar = CALENDAR_CHANGING_TOOLS.has(call.name ?? '') && !isToolError(output);
  return { output, changedCalendar };
}

export async function runAgent(messages: ChatMessage[], sessionId: string, file?: File) {
  const contents = toGeminiContents(messages);
  let calendarModified = false;
  let response = await askAgent(contents, file);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const functionCalls = response.functionCalls;

    // No tool requested: this is the final answer.
    if (!functionCalls?.length) {
      messages.push({ role: 'assistant', content: response.text ?? '' });
      return { messages, calendarModified };
    }

    // Keep the model's tool request in the history.
    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    // Run each requested tool and collect the results.
    const results: Part[] = [];
    for (const call of functionCalls) {
      const result = await handleToolCall(call, sessionId);

      if ('pendingDeletion' in result) {
        messages.push({
          role: 'assistant',
          content: 'Please review the events below and confirm before I delete them.',
        });
        return { messages, calendarModified, pendingDeletion: result.pendingDeletion };
      }

      if (result.changedCalendar) calendarModified = true;
      results.push({ functionResponse: { id: call.id, name: call.name, response: { output: result.output } } });
    }

    // Give the results to the model and let it continue.
    contents.push({ role: 'user', parts: results });
    response = await askAgent(contents);
  }

  throw new Error('Maximum agent iterations reached.');
}
