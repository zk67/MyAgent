import { GoogleGenAI, Content} from '@google/genai';
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

export async function askAgent(messages: Content[], file?: File) {
    const contents = [...messages];

    if (file) {
        const bytes = await file.arrayBuffer();
        const attachment = {
            inlineData: {
                mimeType: file.type || 'application/pdf',
                data: Buffer.from(bytes).toString('base64'),
            },
        };

        // Keep the PDF in the same user turn as the request so the model
        // clearly associates the attachment with the user's question.
        const lastUserMessage = [...contents].reverse().find((content) => content.role === 'user');
        if (lastUserMessage) {
            lastUserMessage.parts = [...(lastUserMessage.parts || []), attachment];
        } else {
            contents.push({ role: 'user', parts: [attachment] });
        }
    }

    return ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
            systemInstruction: `${SYSTEM_PROMPT}\n\nDate d'aujourd'hui : ${getTodayInMontreal()} (fuseau horaire : America/Montreal).`,
            tools: TOOLS,
        }
    });
}
