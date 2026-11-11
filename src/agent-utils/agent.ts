import Anthropic from '@anthropic-ai/sdk';
import { askAgent, pdfToBlock } from '@/services/model';
import { executeTool } from '@/agent-utils/tools';
import { ChatMessage } from '@/types/types';
import { createPendingDeletion } from '@/services/sessionService';
import { getEventsById, isSessionError } from '@/services/calendarService';

const MAX_TOOL_ROUNDS = 10;
const TOOLS_THAT_CHANGE_CALENDAR = ['create_event', 'create_events', 'update_event'];
const CONFIRM_DELETION_TEXT = 'Please review the events below and confirm before I delete them.';

type ToolError = { error: string };

function isToolError(output: unknown): output is ToolError {
  return typeof output === 'object' && output !== null && 'error' in output;
}

// ---------- Conversation ----------

// Converts the chat into the format Claude expects.
// Claude wants the conversation to start with a user message, so the greeting is skipped.
async function buildHistory(messages: ChatMessage[], file?: File) {
  const history: Anthropic.MessageParam[] = [];

  for (const message of messages) {
    const isGreeting = history.length === 0 && message.role === 'assistant';
    if (isGreeting) continue;

    history.push({ role: message.role, content: message.content });
  }

  // The PDF is sent together with the last user message.
  if (file) {
    const lastMessage = messages[messages.length - 1];
    history[history.length - 1] = {
      role: 'user',
      content: [await pdfToBlock(file), { type: 'text', text: lastMessage.content }],
    };
  }

  return history;
}

// Claude's reply can contain text and tool requests. These two helpers separate them.
function getToolRequests(response: Anthropic.Message) {
  const toolRequests: Anthropic.ToolUseBlock[] = [];

  for (const block of response.content) {
    if (block.type === 'tool_use') toolRequests.push(block);
  }
  return toolRequests;
}

function getAnswerText(response: Anthropic.Message) {
  let text = '';

  for (const block of response.content) {
    if (block.type === 'text') text += block.text;
  }
  return text || "Sorry, I couldn't answer that. Please try again.";
}

// ---------- Tools ----------

// Runs a tool. If it fails, the error is sent back to Claude so it can fix it
// or explain the problem. An expired session stops everything so the user can reconnect.
async function runTool(toolRequest: Anthropic.ToolUseBlock, sessionId: string) {
  try {
    return await executeTool(toolRequest, sessionId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The tool failed.';
    if (isSessionError(message)) throw error;
    return { error: message };
  }
}

// Claude never deletes by itself: we save the request and the user confirms it.
async function prepareDeletion(toolRequest: Anthropic.ToolUseBlock, sessionId: string) {
  const input = toolRequest.input as { eventIds?: string[] };
  const eventIds = Array.isArray(input.eventIds) ? input.eventIds : [];

  try {
    const events = await getEventsById(sessionId, eventIds);
    return { pendingDeletion: await createPendingDeletion(sessionId, events) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to find these events.';
    if (isSessionError(message)) throw error;
    return { error: message };
  }
}

// Packs a tool's output in the format Claude expects.
function toToolResult(toolRequest: Anthropic.ToolUseBlock, output: unknown): Anthropic.ToolResultBlockParam {
  return {
    type: 'tool_result',
    tool_use_id: toolRequest.id,
    content: JSON.stringify(output),
    is_error: isToolError(output),
  };
}

// ---------- Agent loop ----------

// Asks Claude, runs the tools it requests, sends back the results,
// and repeats until Claude gives its final answer.
export async function runAgent(messages: ChatMessage[], sessionId: string, file?: File) {
  const history = await buildHistory(messages, file);
  let calendarModified = false;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await askAgent(history);
    const toolRequests = getToolRequests(response);

    // No tool requested: Claude is done, this is its answer.
    if (toolRequests.length === 0) {
      messages.push({ role: 'assistant', content: getAnswerText(response) });
      return { messages, calendarModified };
    }

    // Keep Claude's reply in the history, then run each tool it asked for.
    history.push({ role: 'assistant', content: response.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolRequest of toolRequests) {
      // A deletion pauses everything until the user confirms it.
      if (toolRequest.name === 'delete_event') {
        const deletion = await prepareDeletion(toolRequest, sessionId);

        if ('pendingDeletion' in deletion) {
          messages.push({ role: 'assistant', content: CONFIRM_DELETION_TEXT });
          return { messages, calendarModified, pendingDeletion: deletion.pendingDeletion };
        }

        toolResults.push(toToolResult(toolRequest, deletion));
        continue;
      }

      const output = await runTool(toolRequest, sessionId);

      if (TOOLS_THAT_CHANGE_CALENDAR.includes(toolRequest.name) && !isToolError(output)) {
        calendarModified = true;
      }
      toolResults.push(toToolResult(toolRequest, output));
    }

    // Send all the results back to Claude together, then loop again.
    history.push({ role: 'user', content: toolResults });
  }

  throw new Error('Maximum agent iterations reached.');
}
