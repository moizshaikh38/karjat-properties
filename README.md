# Karjat Properties AI

AI-powered real estate lead management and WhatsApp automation for Karjat Properties: a Node.js/TypeScript API with a React admin frontend.

## Repository layout

- `backend/`: Express + TypeScript API (PostgreSQL via `pg`, Supabase JS, JWT auth, Zod validation, Pino logging, image uploads with Multer and Sharp).
- `frontend/`: React + Vite + TypeScript admin UI (React Router, Axios, date-fns, lucide-react).
- `database/`: `complete_setup.sql`, plus `migrations/` and `seed/`.
- `docs/`: API and feature notes (auth, properties, WhatsApp, Fast2SMS, AI conversation brain, AI sales agent, lead management and scoring, follow-up engine, campaigns, analytics, database).
- `render.yaml`: Render web service definition for the backend (`rootDir: backend`).

Architecture of the backend: routes and controllers, services for business logic, repositories for database access, middleware, config and Zod schemas.

## Prerequisites

- Node.js 18 or newer and npm
- PostgreSQL (see `database/complete_setup.sql`) and a Supabase project
- Optional: WhatsApp Business API credentials and an AI provider key for those features

## Backend

```bash
cd backend
npm install
cp .env.example .env     # fill in your own values
npm run dev              # tsx watch server.ts
```

Other scripts: `npm run build` (tsc), `npm start` (`node dist/server.js`), `npm run lint`, `npm test` (vitest). Health check: `GET /api/health`. The port comes from `PORT` in `.env`.

## Frontend

```bash
cd frontend
npm install
cp .env.example .env     # sets VITE_API_BASE_URL
npm run dev
```

Other scripts: `npm run build`, `npm run lint` (oxlint), `npm test` (vitest), `npm run preview`.

## Environment variables

Names only, see `backend/.env.example` and `frontend/.env.example`:

- Core: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `FRONTEND_URL`
- WhatsApp: `WHATSAPP_API_VERSION`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`
- AI: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_TEMPERATURE`, `AI_MAX_TOKENS`, `AI_CONTEXT_MESSAGES`, `AI_MAX_CONSECUTIVE_FAILURES`
- Follow-ups: `FOLLOWUP_ENABLED`, `FOLLOWUP_POLL_INTERVAL_SECONDS`, `FOLLOWUP_BATCH_SIZE`, `FOLLOWUP_MAX_PER_LEAD`, `FOLLOWUP_MIN_GAP_HOURS`, `FOLLOWUP_BUSINESS_START_HOUR`, `FOLLOWUP_BUSINESS_END_HOUR`, `FOLLOWUP_TIMEZONE`
- Frontend: `VITE_API_BASE_URL`

Never commit real values. `SUPABASE_SERVICE_ROLE_KEY` and other secrets are server-side only.

## License

No license has been granted for this repository. Contact the repository owner for permission to use the code.
