# Cyber Incident Response Simulator

An interactive cyber incident-response simulation platform where analysts investigate
dynamically generated security incidents, make containment decisions, and receive
objective and AI-assisted evaluation. Entirely fictional/simulated — no real systems
are ever attacked.

## Status: Milestone 1 — Repository & Development Environment

This milestone sets up the project skeleton only:

- Docker Compose with `frontend`, `backend`, `postgres`
- Express + TypeScript backend with a Prisma-backed health check
- React + Vite + TypeScript + Tailwind frontend shell
- Full initial Prisma schema (data model), no business logic yet

Authentication, users, and roles are implemented in Milestone 2.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** PostgreSQL
- **Infra:** Docker Compose

Redis and Nginx are intentionally deferred until a concrete requirement exists for them.

## Prerequisites

- Docker and Docker Compose installed
- (Optional, for running things outside Docker) Node.js 20+

## Setup & Run

1. Copy the backend environment file:

   ```bash
   cp server/.env.example server/.env
   ```

   The defaults in `.env.example` work as-is for local Docker Compose use.

2. Start everything:

   ```bash
   docker compose up --build
   ```

   This builds and starts three containers:
   - `postgres` — PostgreSQL 16, with a persisted volume
   - `backend` — Express API on `http://localhost:4000`
   - `frontend` — Vite dev server on `http://localhost:5173`

3. Apply the initial database schema (in a second terminal, once `postgres` is healthy):

   ```bash
   docker compose exec backend npx prisma migrate dev --name init
   ```

   This creates the tables defined in `server/prisma/schema.prisma` inside the
   `postgres` container's database.

## Verifying it works

- Backend health check: open `http://localhost:4000/api/health` — expect:

  ```json
  { "status": "ok", "database": "connected" }
  ```

  `database: "connected"` confirms Prisma successfully queried Postgres, not just
  that Express is running.

- Frontend: open `http://localhost:5173` — you should see the app shell, and a
  "Backend status" indicator that shows **Connected** once it successfully calls
  the health endpoint above. If it shows **Unreachable**, the backend container
  isn't up yet or hasn't finished migrating.

- Inspect the database directly (optional):

  ```bash
  docker compose exec postgres psql -U postgres -d cyber_incident_sim -c '\dt'
  ```

  You should see all tables from the Prisma schema (User, Scenario, Incident,
  SecurityEvent, System, Evidence, Investigation, InvestigationAction, Finding,
  Hint, Score, Report, AIInteraction, AuditLog).

## Common issues

- **`backend` exits immediately / can't reach database:** Postgres usually takes a
  few seconds longer to become ready than the backend takes to start. Re-run
  `docker compose up` — Compose will restart `backend` — or add a short wait before
  retrying the migrate command.
- **Port already in use (4000 or 5173):** something else on your machine is bound to
  that port. Stop it, or change the host-side port mapping in `docker-compose.yml`.
- **Prisma Client type errors after editing `schema.prisma`:** run
  `docker compose exec backend npx prisma generate` to regenerate the client.

## Project structure

```
cyber-incident-sim/
├── docker-compose.yml
├── server/                  # Express + TypeScript backend
│   ├── src/
│   │   ├── config/          # env validation
│   │   ├── middleware/      # error handling
│   │   ├── modules/health/  # health check endpoint
│   │   ├── app.ts
│   │   └── server.ts
│   └── prisma/
│       └── schema.prisma
└── client/                  # React + Vite + TS frontend
    └── src/
        ├── App.tsx
        └── main.tsx
```

Business modules (`auth`, `incidents`, `investigations`, etc.) get added under
`server/src/modules/` starting Milestone 2, following this same pattern.
