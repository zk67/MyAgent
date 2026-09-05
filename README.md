# MyAgent

MyAgent is a Next.js-based assistant dashboard that combines a chat experience, Google Calendar integration, and connection-aware UI in one web app.

## What it does

- Shows a dashboard that switches between a connection screen and the main workspace
- Checks authentication state through backend API routes
- Displays a calendar panel, overview metrics, and a chat panel when connected
- Supports sign-in/out flows for a Google-backed account
- Refreshes the UI after authentication or event creation

## Tech stack

- Next.js 16
- React 19
- TypeScript
- App Router
- CSS Modules / global CSS styling
- Google APIs
- Firebase Admin

## Project structure

```text
src/
├── app/              # Routes, pages, and API handlers
├── components/       # UI building blocks
├── styles/           # Global and page styling
├── lib/              # Shared utilities
├── services/         # External service integrations
├── agent/            # Agent-specific logic
└── types/            # Shared TypeScript types
```

## Key features

### Connection-aware home screen
The main page checks whether the user is connected and renders either:
- a connect widget when disconnected, or
- the full workspace when authenticated.

### Workspace layout
The authenticated view is organized into:
- a calendar panel,
- an overview panel with activity metrics, and
- a chat panel for creating events and interacting with the assistant.

### Authentication flow
The app listens for auth success messages, rechecks connection state, and refreshes the UI after login/logout actions.

### Google Calendar integration
The repository includes calendar and chat flows designed to work with Google APIs and server-side route handlers.

## Getting started

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Build for production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Environment setup

This project expects server-side integrations to be configured before the full experience works correctly. In particular, Google and Firebase credentials should be provided through environment variables or deployment secrets.

## Notes

- The app currently relies on backend routes for auth and status checks.
- If you add new integrations, document the required environment variables here.
- Consider replacing the placeholder dashboard values with live data as the project evolves.

## License

No license has been specified yet.
