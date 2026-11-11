import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, TOOLS, MODEL } from '@/agent-utils/config';

// The SDK already retries twice on overload (429, 5xx) before giving up.
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function getTodayInMontreal(date: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montreal',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// The prompt never changes, so it is cached (together with the tools sent before it).
// The date changes every day, so it goes in a second block, after the cached part.
function buildSystem(): Anthropic.TextBlockParam[] {
  return [
    { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `Date d'aujourd'hui : ${getTodayInMontreal()} (fuseau horaire : America/Montreal).` },
  ];
}

// Turns an uploaded PDF into a block Claude can read.
export async function pdfToBlock(file: File): Promise<Anthropic.DocumentBlockParam> {
  const bytes = await file.arrayBuffer();

  return {
    type: 'document',
    source: {
      type: 'base64',
      media_type: 'application/pdf',
      data: Buffer.from(bytes).toString('base64'),
    },
  };
}

export function askAgent(messages: Anthropic.MessageParam[]) {
  return client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: buildSystem(),
    tools: TOOLS,
    messages,
    // Also caches the conversation so far (and the PDF) for the next tool round.
    cache_control: { type: 'ephemeral' },
  });
}
