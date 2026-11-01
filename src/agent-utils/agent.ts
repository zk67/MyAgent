import { askAgent } from '@/services/model';
import { executeTool } from '@/agent-utils/tools';
import { ChatMessage } from '@/types/types';
import { Content } from '@google/genai';
import { createPendingDeletion } from '@/services/sessionService';
import { getEventsById } from '@/services/calendarService';

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

    for (let iteration = 0; iteration <= 10; iteration++) {

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
        const functionResponseParts = [];
        for (const functionCall of functionCalls) {
            if (functionCall.name === 'delete_event') {
                const ids = functionCall.args?.eventIds;
                const eventIds = Array.isArray(ids)
                    ? ids.filter((id): id is string => typeof id === 'string')
                    : [];
                const events = await getEventsById(sessionId, eventIds);
                const pendingDeletion = await createPendingDeletion(sessionId, events);
                messages.push({
                    role: 'assistant',
                    content: 'Please review the events below and confirm before I delete them.',
                });
                return { messages, calendarModified, pendingDeletion };
            }
            const toolResult = await executeTool(functionCall, sessionId);
            if (functionCall.name === 'create_event' || functionCall.name === 'update_event') {
                calendarModified = true;
            }

        // Résultat du tool donné à Gemini
            functionResponseParts.push({
                    functionResponse: {
                        id: functionCall.id,
                        name: functionCall.name,
                        response: {
                            output: toolResult
                        }
                    }
            });
        }

        contents.push({ role: 'user', parts: functionResponseParts });

        // Nouvel appel Gemini
        response = await askAgent(contents);
    }

    throw new Error('Maximum agent iterations reached.');
}
