import { GoogleGenAI, Content } from '@google/genai';
import { SYSTEM_PROMPT, TOOLS, MODEL } from '@/agent-utils/config';

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export function getTodayInMontreal(date: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montreal',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function buildSystemInstruction() {
  return `${SYSTEM_PROMPT}\n\nDate d'aujourd'hui : ${getTodayInMontreal()} (fuseau horaire : America/Montreal).`;
}

function attachFile(contents: Content[], file: File, fileBytes: ArrayBuffer) {
  const attachment = {
    inlineData: {
      mimeType: file.type || 'application/pdf',
      data: Buffer.from(fileBytes).toString('base64'),
    },
  };

  const lastUserMessage = [...contents].reverse().find((c) => c.role === 'user');
  if (lastUserMessage) {
    lastUserMessage.parts = [...(lastUserMessage.parts || []), attachment];
  } else {
    contents.push({ role: 'user', parts: [attachment] });
  }
}

export async function askAgent(messages: Content[], file?: File) {
  const contents = [...messages];

  if (file) {
    attachFile(contents, file, await file.arrayBuffer());
  }

  return ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: buildSystemInstruction(),
      tools: TOOLS,
    },
  });
}
