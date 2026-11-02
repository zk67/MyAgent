// Simple i18n: all UI strings in one place, keyed by locale.
// The app defaults to French. English is available if the user changes their preference.

const translations = {
  fr: {
    // Navbar
    assistant: 'Assistant',
    newEvent: 'Nouvel événement',
    logOut: 'Déconnexion',
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',

    // Overview
    overview: 'Aperçu',
    today: "Aujourd'hui",
    thisWeek: 'Cette semaine',
    next2Weeks: '2 prochaines sem.',
    todaysEvents: "ÉVÉNEMENTS D'AUJOURD'HUI",
    noEventsToday: "Aucun événement aujourd'hui.",
    allDay: 'Journée entière',

    // Chat
    chatGreeting: 'Bonjour ! Comment puis-je vous aider avec votre calendrier ?',
    online: 'En ligne',
    thinking: 'Réflexion...',
    askSomething: 'Posez une question...',
    send: 'Envoyer',
    attachPdf: 'Joindre un PDF',
    onlyPdf: 'Seuls les fichiers PDF sont acceptés.',
    pdfTooLarge: 'Le PDF ne doit pas dépasser 10 Mo.',
    pdfAttached: 'PDF joint.',
    removePdf: 'Retirer le PDF',
    disclaimer: 'Les réponses IA peuvent être inexactes',
    confirmDeletion: 'Confirmer la suppression',
    cancelDeletion: 'Annuler',
    eventsToDelete: 'Événements à supprimer :',
    eventsDeleted: 'Les événements sélectionnés ont été supprimés.',
    deletionCancelled: 'Suppression annulée.',
    reviewEvents: "Veuillez vérifier les événements ci-dessous et confirmer avant que je les supprime.",

    // Quick actions
    scheduleMeeting: 'Planifier une réunion',
    whatThisWeek: "Qu'est-ce que j'ai cette semaine ?",
    summarizeDay: 'Résumer ma journée',

    // Event form
    createEvent: 'Créer un événement',
    title: 'Titre',
    titlePlaceholder: 'Ex. Réunion d\'équipe',
    date: 'Date',
    start: 'Début',
    end: 'Fin',
    description: 'Description',
    descriptionOptional: '(optionnel)',
    descriptionPlaceholder: 'Ajouter des détails',
    location: 'Lieu',
    locationOptional: '(optionnel)',
    locationPlaceholder: 'Ex. Bureau ou appel vidéo',
    reminder: 'Rappel',
    noReminder: 'Aucun rappel',
    minutes: 'minutes avant',
    hours: 'heures avant',
    eventCreated: 'Événement créé avec succès !',
    eventError: "Erreur lors de la création de l'événement.",

    // Connect
    connectTitle: 'Connectez votre calendrier',
    connectDescription: 'Connectez votre Google Calendar pour que MyAgent puisse consulter et gérer votre emploi du temps.',
    connectButton: 'Connecter Google Calendar',

    // Calendar
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    mon: 'Lun',
    tue: 'Mar',
    wed: 'Mer',
    thu: 'Jeu',
    fri: 'Ven',
    sat: 'Sam',
    sun: 'Dim',
    close: 'Fermer',
    deleteEvent: 'Supprimer',
    deletingEvent: 'Suppression...',
    deleteEventFull: 'Supprimer l\'événement',
    noDescription: 'Aucune description',
    calendarEvent: 'Événement',
    when: 'Quand',
    duration: 'Durée',
    reminders: 'Rappels',
    confirmDeleteEvent: 'Supprimer « {title} » de votre calendrier ? Cette action est irréversible.',
    minuteBefore: '{count} minute avant ({method})',
    minutesBefore: '{count} minutes avant ({method})',
    hr: 'h',
    min: 'min',

    // Settings / Account
    settings: 'Paramètres',
    preferences: 'Préférences',
    timezone: 'Fuseau horaire',
    defaultReminder: 'Rappel par défaut',
    language: 'Langue',
    french: 'Français',
    english: 'English',
    save: 'Enregistrer',
    saved: 'Enregistré !',
    deleteAccount: 'Supprimer mon compte',
    deleteAccountConfirm: 'Êtes-vous sûr ? Cette action est irréversible. Toutes vos données seront supprimées et votre accès Google Calendar sera révoqué.',
    revokeGoogle: 'Révoquer l\'accès Google',
    accountDeleted: 'Compte supprimé.',

    // Batch preview
    previewTitle: 'Événements extraits du PDF',
    previewCreate: 'Créer les événements sélectionnés',
    previewCancel: 'Annuler',
    previewSelectAll: 'Tout sélectionner',
    previewDeselectAll: 'Tout désélectionner',
    eventsCreated: '{count} événement(s) créé(s) avec succès.',

    // Errors
    somethingWentWrong: "Une erreur s'est produite. Veuillez réessayer.",
    connectionExpired: 'Connexion au calendrier expirée. Veuillez vous reconnecter.',
    tooManyRequests: 'Trop de demandes. Veuillez patienter une minute.',
  },
  en: {
    assistant: 'Assistant',
    newEvent: 'New event',
    logOut: 'Log out',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',

    overview: 'Overview',
    today: 'Today',
    thisWeek: 'This week',
    next2Weeks: 'Next 2 weeks',
    todaysEvents: "TODAY'S EVENTS",
    noEventsToday: 'No events today.',
    allDay: 'All day',

    chatGreeting: 'Hello! What would you like to do with your calendar?',
    online: 'Online',
    thinking: 'Thinking...',
    askSomething: 'Ask something...',
    send: 'Send',
    attachPdf: 'Attach a PDF',
    onlyPdf: 'Only PDF files are accepted.',
    pdfTooLarge: 'PDF files must be 10 MB or smaller.',
    pdfAttached: 'PDF attached.',
    removePdf: 'Remove PDF',
    disclaimer: 'AI responses may be inaccurate',
    confirmDeletion: 'Confirm deletion',
    cancelDeletion: 'Cancel',
    eventsToDelete: 'Events to delete:',
    eventsDeleted: 'The selected events were deleted.',
    deletionCancelled: 'Deletion cancelled.',
    reviewEvents: 'Please review the events below and confirm before I delete them.',

    scheduleMeeting: 'Schedule a meeting',
    whatThisWeek: 'What do I have this week?',
    summarizeDay: 'Summarize my day',

    createEvent: 'Create an event',
    title: 'Title',
    titlePlaceholder: 'e.g. Team meeting',
    date: 'Date',
    start: 'Start',
    end: 'End',
    description: 'Description',
    descriptionOptional: '(optional)',
    descriptionPlaceholder: 'Add a few details',
    location: 'Location',
    locationOptional: '(optional)',
    locationPlaceholder: 'e.g. Office or video call',
    reminder: 'Reminder',
    noReminder: 'No reminder',
    minutes: 'minutes before',
    hours: 'hours before',
    eventCreated: 'Event created successfully!',
    eventError: 'Error creating the event.',

    connectTitle: 'Connect your calendar',
    connectDescription: 'Connect your Google Calendar so MyAgent can view and manage your schedule.',
    connectButton: 'Connect Google Calendar',

    month: 'Month',
    week: 'Week',
    day: 'Day',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
    close: 'Close',
    deleteEvent: 'Delete',
    deletingEvent: 'Deleting...',
    deleteEventFull: 'Delete event',
    noDescription: 'No description',
    calendarEvent: 'Calendar event',
    when: 'When',
    duration: 'Duration',
    reminders: 'Reminders',
    confirmDeleteEvent: 'Delete "{title}" from your calendar? This cannot be undone.',
    minuteBefore: '{count} minute before ({method})',
    minutesBefore: '{count} minutes before ({method})',
    hr: 'hr',
    min: 'min',

    settings: 'Settings',
    preferences: 'Preferences',
    timezone: 'Timezone',
    defaultReminder: 'Default reminder',
    language: 'Language',
    french: 'Français',
    english: 'English',
    save: 'Save',
    saved: 'Saved!',
    deleteAccount: 'Delete my account',
    deleteAccountConfirm: 'Are you sure? This cannot be undone. All your data will be deleted and your Google Calendar access will be revoked.',
    revokeGoogle: 'Revoke Google access',
    accountDeleted: 'Account deleted.',

    previewTitle: 'Events extracted from PDF',
    previewCreate: 'Create selected events',
    previewCancel: 'Cancel',
    previewSelectAll: 'Select all',
    previewDeselectAll: 'Deselect all',
    eventsCreated: '{count} event(s) created successfully.',

    somethingWentWrong: 'Something went wrong. Please try again.',
    connectionExpired: 'Calendar connection expired. Please reconnect.',
    tooManyRequests: 'Too many requests. Please wait a minute.',
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations.fr;

export function t(key: TranslationKey, locale: Locale = 'fr', replacements?: Record<string, string | number>): string {
  let text: string = translations[locale]?.[key] ?? translations.fr[key] ?? key;
  if (replacements) {
    for (const [placeholder, value] of Object.entries(replacements)) {
      text = text.replace(`{${placeholder}}`, String(value));
    }
  }
  return text;
}

export function getTranslations(locale: Locale = 'fr') {
  return translations[locale] ?? translations.fr;
}
