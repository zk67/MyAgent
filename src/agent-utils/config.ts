import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-haiku-5-5';

export const SYSTEM_PROMPT = `
Tu es MyAgent, un assistant IA destiné aux étudiants.

Ton rôle est d'aider l'utilisateur à gérer son calendrier Google.

Règles :
- Utilise les outils disponibles pour consulter ou modifier le calendrier.
- Lorsqu'un PDF est joint, lis-le attentivement. S'il contient un horaire, un plan de cours ou des dates d'examens, extrais toutes les dates et heures pertinentes. Pour chaque événement trouvé, identifie :
  1. Le titre (nom du cours, type d'examen, activité)
  2. La date (YYYY-MM-DD)
  3. L'heure de début et de fin (HH:mm)
  4. La description (numéro de cours, salle, professeur si disponible)
  5. Le lieu (salle, campus si mentionné)
  6. La récurrence (hebdomadaire, etc.) si applicable
- Présente un résumé clair des événements trouvés avant de les créer, sauf si l'utilisateur demande explicitement de les créer directement.
- Pour les horaires de cours récurrents, utilise create_events avec le paramètre recurrence (RRULE) au lieu de créer chaque occurrence manuellement.
- Pour chaque date identifiable dans le PDF, vérifie le contexte (matière, type d'examen, date et heure) et demande uniquement les informations réellement absentes avant de créer les événements.
- N'invente jamais une date, une heure ou une information manquante.
- Ne dis jamais qu'une action a été effectuée tant que l'outil correspondant
  n'a pas confirmé son exécution.
- Dans une journée, tu peux créer un maximum de 20 événements. Si l'utilisateur tente d'en créer davantage, informe-le qu'il a atteint la limite quotidienne d'événements pour cette journée.
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

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_event',
    description: 'Create a Google Calendar event.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title.' },
        startTime: { type: 'string', description: 'Start time in HH:mm format.' },
        startDate: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
        description: { type: 'string', description: 'Optional event description.' },
        endTime: { type: 'string', description: 'Optional end time in HH:mm format.' },
        reminder: { type: 'number', description: 'Optional reminder in minutes.' },
        location: { type: 'string', description: 'Optional event location.' },
      },
      required: ['title', 'startTime', 'startDate'],
    },
  },
  {
    name: 'get_events',
    description: 'Get calendar events for a date range.',
    input_schema: {
      type: 'object',
      properties: {
        timeMin: { type: 'string', description: 'Range start in ISO 8601 format.' },
        timeMax: { type: 'string', description: 'Range end in ISO 8601 format.' },
      },
      required: ['timeMin', 'timeMax'],
    },
  },
  {
    name: 'update_event',
    description: 'Update an existing calendar event.',
    input_schema: {
      type: 'object',
      properties: {
        event: {
          type: 'object',
          description: 'The existing CalendarEvent object, including its event ID.',
          properties: {
            eventId: { type: 'string', description: 'Google Calendar event ID.' },
            id: { type: 'string', description: 'Google Calendar event ID.' },
            summary: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            start: { type: 'object' },
            end: { type: 'object' },
          },
          required: ['eventId'],
        },
        update: {
          type: 'object',
          description: 'Fields to update on the existing event.',
          minProperties: 1,
          properties: {
            summary: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            start: { type: 'object' },
            end: { type: 'object' },
          },
        },
      },
      required: ['event', 'update'],
    },
  },
  {
    name: 'delete_event',
    description: 'Delete calendar events by their IDs.',
    input_schema: {
      type: 'object',
      properties: {
        eventIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of the events to delete.',
        },
      },
      required: ['eventIds'],
    },
  },
  {
    name: 'create_events',
    description: 'Create multiple Google Calendar events at once. Supports optional RRULE recurrence.',
    input_schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          description: 'Array of events to create.',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Event title.' },
              startTime: { type: 'string', description: 'Start time in HH:mm format.' },
              startDate: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
              description: { type: 'string', description: 'Optional event description.' },
              endTime: { type: 'string', description: 'Optional end time in HH:mm format.' },
              reminder: { type: 'number', description: 'Optional reminder in minutes.' },
              location: { type: 'string', description: 'Optional event location.' },
              recurrence: { type: 'string', description: 'Optional RRULE string, e.g. RRULE:FREQ=WEEKLY;COUNT=13' },
            },
            required: ['title', 'startTime', 'startDate'],
          },
        },
      },
      required: ['events'],
    },
  },
];
