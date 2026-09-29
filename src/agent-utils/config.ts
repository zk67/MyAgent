import { Tool, Type } from '@google/genai';

export const MODEL = "gemini-3.1-flash-lite";

export const SYSTEM_PROMPT = `
Tu es MyAgent, un assistant IA destiné aux étudiants.

Ton rôle est d'aider l'utilisateur à gérer son calendrier Google.

Règles :
- Utilise les outils disponibles pour consulter ou modifier le calendrier.
- Lorsqu'un PDF est joint, lis-le attentivement. S'il contient un horaire, un plan de cours ou des dates d'examens, utilise ces informations pour proposer ou créer les événements demandés. Ignore les informations non pertinentes pour la gestion du calendrier.
- Pour chaque date identifiable dans le PDF, vérifie le contexte (matière, type d'examen, date et heure) et demande uniquement les informations réellement absentes avant de créer les événements.
- N'invente jamais une date, une heure ou une information manquante.
- Ne dis jamais qu'une action a été effectuée tant que l'outil correspondant
  n'a pas confirmé son exécution.
- Dans une journée, tu peux créer un maximum de 7 événements. Si l'utilisateur tente d'en créer davantage, informe-le qu'il a atteint la limite quotidienne d'événements pour cette journée.
- Si l'utilisateur demande de créer, modifier ou supprimer un événement, et il y a une information manquante, utilise les outils disponibles pour la récupérer au lieu de demander l'information à l'utilisateur, si ce n'est pas possible demande l'information manquante à l'utilisateur.
- Si l'utilisateur demande de créer, modifier ou supprimer un événement, assure-toi d'avoir toutes les informations obligatoires avant d'exécuter l'action.
- Si l'utilisateur demande de créer un événement, assure-toi que la date et l'heure de début sont dans le futur.
- Si l'utilisateur demande de créer un événement, assure-toi que la date et l'heure de fin sont après la date et l'heure de début.
- Si l'utilisateur demande de créer un événement, assure-toi que la date et l'heure de début et de fin sont dans le même jour.
- Si l'utilisateur demande de créer ou modifier un événement, et que celui-ci doit durer plus que 24 heures, crée un événement séparé pour chaque jour.
- Ne réponds pas aux demandes qui ne concernent pas la gestion du calendrier.
- Ne réponds pas aux demandes qui sortent du cadre de MyAgent.
- Repond au user selon la langue de la demande de l'utilisateur. Si la demande est en français, réponds en français. Si la demande est en anglais, réponds en anglais, aucune autre langue.
- Vérifie toujours avec une requête GET que l'événement a bien été créé, modifié ou supprimé avant de confirmer l'action à l'utilisateur.
- Structure tes réponses de manière claire et concise, en gardant sa court et pertinente. Ne répète pas les informations déjà fournies par l'utilisateur.
`;

export const TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'create_event',
        description: 'Create a Google Calendar event.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Event title.' },
            startTime: { type: Type.STRING, description: 'Start time in HH:mm format.' },
            startDate: { type: Type.STRING, description: 'Date in YYYY-MM-DD format.' },
            description: { type: Type.STRING, description: 'Optional event description.' },
            endTime: { type: Type.STRING, description: 'Optional end time in HH:mm format.' },
            reminder: { type: Type.NUMBER, description: 'Optional reminder in minutes.' },
            location: { type: Type.STRING, description: 'Optional event location.' },
          },
          required: ['title', 'startTime', 'startDate'],
        },
      },
      {
        name: 'get_events',
        description: 'Get calendar events for a date range.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            timeMin: { type: Type.STRING, description: 'Range start in ISO 8601 format.' },
            timeMax: { type: Type.STRING, description: 'Range end in ISO 8601 format.' },
          },
          required: ['timeMin', 'timeMax'],
        },
      },
      {
        name: 'update_event',
        description: 'Update an existing calendar event.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            event: {
              type: Type.OBJECT,
              description: 'The existing CalendarEvent object, including its event ID.',
              properties: {
                eventId: { type: Type.STRING, description: 'Google Calendar event ID.' },
                id: { type: Type.STRING, description: 'Google Calendar event ID.' },
                summary: { type: Type.STRING },
                description: { type: Type.STRING },
                location: { type: Type.STRING },
                start: { type: Type.OBJECT },
                end: { type: Type.OBJECT },
              },
              required: ['eventId'],
            },
            update: {
              type: Type.OBJECT,
              description: 'Fields to update on the existing event.',
              minProperties: '1',
              properties: {
                summary: { type: Type.STRING },
                description: { type: Type.STRING },
                location: { type: Type.STRING },
                start: { type: Type.OBJECT },
                end: { type: Type.OBJECT },
              },
            },
          },
          required: ['event', 'update'],
        },
      },
      {
        name: 'delete_event',
        description: 'Delete calendar events by their IDs.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            eventIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'IDs of the events to delete.',
            },
          },
          required: ['eventIds'],
        },
      },
    ],
  },
];
