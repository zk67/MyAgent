import { askAgent } from '@/services/model';
import { executeTool } from '@/agent-utils/tools';
import { ChatMessage } from '@/types/types';
import { Content } from '@google/genai';

export async function runAgent(messages: ChatMessage[],sessionId: string,file?: File) {
    // Historique interne utilisé par Gemini
    const contents: Content[] = messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [
            {
                text: message.content
            }
        ]
    }));

    let calendarModified = false;
    let response = await askAgent(contents, file);

    for (let iteration = 0; iteration < 5; iteration++) {

        const functionCalls = response.functionCalls;

        // Aucun tool → réponse finale
        if (!functionCalls?.length) {

            const modelMessage: ChatMessage = {
                role: 'assistant',
                content: response.text ?? ''
            };

            messages.push(modelMessage);
            return {messages, calendarModified};
        }

        // Réponse Gemini contenant le functionCall
        const modelResponseContent =
            response.candidates?.[0]?.content;

        if (modelResponseContent) {
            contents.push(modelResponseContent);
        }

        // Tool demandé
        const functionCall = functionCalls[0];

        const toolResult = await executeTool(functionCall, sessionId);
        calendarModified = true;

        // Résultat du tool donné à Gemini
        contents.push({
            role: 'user',
            parts: [
                {
                    functionResponse: {
                        id: functionCall.id,
                        name: functionCall.name,
                        response: {
                            output: toolResult
                        }
                    }
                }
            ]
        });

        // Nouvel appel Gemini
        response = await askAgent(contents);
    }

    throw new Error('Maximum agent iterations reached.');
}