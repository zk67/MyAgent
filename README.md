# LIL-IA

Squelette d'une application web monopage avec Next.js, React et TypeScript.

## Stack

- Next.js 16.3.3
- React 19.2
- TypeScript
- App Router
- API Routes via Route Handlers

## Structure

```text
src/
├── app/                         # Pages et routage App Router
│   ├── page.tsx                 # Page principale : chat + calendrier
│   ├── calendar/page.tsx        # Exemple de route supplémentaire
│   └── api/                     # Backend HTTP intégré à Next.js
│       ├── chat/route.ts
│       └── health/route.ts
│
├── components/                  # Composants UI
├── agent/                       # Logique de l'agent et ses tools
├── services/                    # LLM et Google Calendar
├── styles/                      # Styles globaux
├── types/                       # Types TypeScript partagés
└── lib/                         # Utilitaires
```

## Installation

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Important

Ce squelette ne contient volontairement aucune clé API. Les intégrations LLM et Google Calendar sont des placeholders à compléter côté serveur.
