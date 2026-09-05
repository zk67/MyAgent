export type CalendarTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type CalendarEvent = {
  eventId?: string;
  id?: string;
  summary?: string;
  description?: string;

  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };

  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };

  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: 'email' | 'popup';
      minutes: number;
    }[];
  };
}