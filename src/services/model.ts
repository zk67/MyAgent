import { GoogleGenAI, Content} from '@google/genai';
import { SYSTEM_PROMPT, TOOLS, MODEL } from '@/agent-utils/config';

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askAgent(messages: Content[], file?: File) {
    const contents = [...messages];

    if (file) {
        const bytes = await file.arrayBuffer();
        contents.push({
            role: 'user',
            parts: [{
                inlineData: {
                    mimeType: file.type,
                    data: Buffer.from(bytes).toString('base64'),
                },
            }],
        });
    }

    return ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: TOOLS,
        }
    });
}
