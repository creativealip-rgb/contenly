# Repository Guidelines

## Project Structure & Module Organization
This repository is split into two apps plus shared docs:

- `frontend/`: Next.js 16 App Router UI. Main code lives in `frontend/src/app`, reusable UI in `frontend/src/components`, shared helpers in `frontend/src/lib`, and client stores in `frontend/src/stores`.
- `backend/`: NestJS API. Feature modules live in `backend/src/modules`, auth and guards in `backend/src/modules/auth` and `backend/src/common`, and database schema/migrations in `backend/src/db` and `backend/drizzle`.
- `docs/`: product, architecture, and deployment notes.
- `scripts/` and `backend/scripts/`: one-off utilities and local test scripts.

## Build, Test, and Development Commands
- `npm run dev`: starts frontend and backend together from the repo root.
- `npm run build`: builds both apps.
- `cd frontend; npm run dev`: runs the Next.js app on localhost for UI work.
- `cd frontend; npm run lint`: runs frontend ESLint.
- `cd backend; npm run start:dev`: runs the Nest API with watch mode.
- `cd backend; npm run build`: compiles TypeScript to `dist/`.
- `cd backend; npm run test`, `npm run test:e2e`, `npm run test:cov`: unit, end-to-end, and coverage runs.
- `cd backend; npm run db:generate|db:migrate|db:push`: Drizzle schema and migration workflow.

## Coding Style & Naming Conventions
Use TypeScript everywhere. Follow existing file naming: kebab-case for files (`view-boost.service.ts`), PascalCase for React components, and Nest conventions like `*.module.ts`, `*.service.ts`, `*.controller.ts`, `*.dto.ts`. Prefer 2-space indentation in frontend files and keep backend formatting aligned with Prettier. Run `backend` Prettier and ESLint before submitting; frontend uses ESLint with Next core-web-vitals rules.

## Testing Guidelines
Backend testing uses Jest. Keep unit tests as `*.spec.ts` beside the source or under `backend/test` for e2e coverage. Add or update tests when changing services, auth flows, billing, or API behavior. Frontend currently has linting but no formal test suite; at minimum, verify affected dashboard and auth routes locally.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit prefixes such as `feat:` and `fix:`. Keep commits focused and descriptive, for example `feat: add RSS category sync`. PRs should include a short summary, impacted areas (`frontend`, `backend`, `db`), setup or env changes, and screenshots for visible UI changes. Link the related issue or task when available.

## Security & Configuration Tips
Do not commit real secrets. Start from `.env.production.example`, keep local overrides out of git, and document new required variables in deployment docs when adding integrations such as OpenAI, Stripe, Supabase, or Redis.
