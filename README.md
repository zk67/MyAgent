# MyAgent

MyAgent is a Next.js web app that combines a connection-aware dashboard, Google Calendar integration, and an AI-powered assistant in one experience. The app starts by checking whether the user is connected, prompts for Google authentication when needed, and then loads a full workspace with calendar data and AI chat features.

## Overview

This project is built to help users:

- connect their Google account
- view upcoming calendar events
- review a quick overview of activity and daily events
- use an AI assistant to interact with calendar-related workflows
- create events from the interface or chat experience

It is structured as a modern Next.js App Router application using TypeScript and server routes for auth and calendar access.

## Features

### Connection-aware landing experience
The app checks the current auth/session status on load and renders one of two states:

- a connect screen when the user is not authenticated
- the main workspace when the user is connected

### Google OAuth authentication
User sign-in is handled through Google OAuth. The app:

- starts the OAuth flow via `/api/auth/login`
- processes the callback via `/api/callback`
- stores session state using secure cookies
- validates connection status through `/api/status`

### Calendar dashboard
Once authenticated, the app loads event data from Google Calendar and displays it in a workspace that includes:

- a calendar panel
- an overview panel with daily and weekly totals
- a list of events for the current date

### AI assistant chat
The assistant is connected to a Gemini model and supports interactions related to scheduling and event management. The UI includes a chat panel for direct communication with the assistant.

### Event creation and refresh flow
Users can create events through the app UI, and the dashboard refreshes afterward so the latest calendar data is immediately visible.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- App Router
- Google APIs
- Google GenAI / Gemini
- Firebase Admin
- CSS Modules / global CSS

## Project structure

```text
src/
├── agent-utils/        # Assistant model/tool configuration
├── app/                # App Router pages and route handlers
│   ├── api/            # Auth, calendar, status, and chat API routes
│   ├── authSuccess/    # Auth success page flow
│   ├── layout.tsx      # Global app layout
│   └── page.tsx        # Main dashboard entry
├── components/         # Reusable UI components
│   ├── Calendar.tsx
│   ├── CalendarDay.tsx
│   ├── CalendarModal.tsx
│   ├── Chat.tsx
│   ├── ConnectWidget.tsx
│   ├── EventForm.tsx
│   ├── Navbar.tsx
│   └── Overview.tsx
├── lib/                # Shared logic and utilities
├── services/           # External integrations and model access
│   ├── authService.ts
│   ├── calendarService.ts
│   └── model.ts
├── styles/             # Global styling and page-specific CSS
├── types/              # Shared TypeScript types
└── ...
```

## API flow

The application relies on backend routes to coordinate user auth and calendar access.

Key routes include:

- `/api/auth/login` — starts the Google OAuth login flow
- `/api/callback` — exchanges the OAuth code for tokens
- `/api/status` — checks whether the user is connected
- `/api/auth/logout` — signs the user out
- `/api/calendar` — fetches calendar events
- `/api/chat` — handles assistant chat requests

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env.local` file in the project root with the required variables:

```bash
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/callback
NODE_ENV=development
```

If you use additional Firebase or deployment-specific services, add those required environment values as needed.

### Run locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Production build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Notes

- The app depends on backend routes for auth state and calendar access.
- Google Calendar access is the main external integration behind the dashboard experience.
- The assistant flow is designed for scheduling and event-related tasks.
- The project is ready to expand with additional workflows and integrations.

## License

No license has been specified yet.
