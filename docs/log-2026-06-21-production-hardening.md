# 2026-06-21 — Contenly Production Hardening Log

## Summary
Contenly production was audited, tested, patched, deployed, and re-verified on `https://contenly.app`.

## Deployment/runtime verified
- Runtime: Dokploy Raw Compose.
- Compose path: `/etc/dokploy/compose/contenly/code/docker-compose.yml`.
- Production source: `creativealip-rgb/contenly.git#main`.
- Containers:
  - `contenly-frontend-1`
  - `contenly-backend-1`
  - `contenly-postgres-1`
  - `contenly-redis`
- Live health: `https://contenly.app/health` returns `healthy` and `database: connected`.

## Commits shipped
- `024fcbd chore: reduce audit findings and fix PWA cache`
- `9517f11 fix: align admin role and wildcard routes`
- `bc99e5b fix: disable schema push on startup by default`

## Build/test results
- `npm run install:all` completed successfully in fresh clone.
- `npm run build` passed after dependency audit fixes.
- Backend `tsc` passed.
- Frontend `next build --webpack` passed.
- Next.js generated 36 routes/pages successfully.

## Smoke tests
### Basic live checks
- `https://contenly.app/` -> 200
- `https://contenly.app/login` -> 200
- `https://contenly.app/register` -> 200
- `https://contenly.app/health` -> 200
- Protected routes redirect to login without session (307), expected behavior.

### Core content flow
Using admin account session:
- Health check passed.
- RSS feed fetch passed.
- Source scrape passed.
- AI article generation passed.
- Draft creation passed.
- WordPress publish passed.
- WordPress API verification passed.
- WordPress post page returned 200.
- WordPress blog page contained published title.
- Contenly article status verified as `PUBLISHED`.

Published smoke post:
- WP post ID: `428`
- WP media ID: `427`
- URL: `https://nggawe.web.id/in-the-weights-cara-baru-mengukur-seberapa-kuat-nama-anda-diingat-model-ai/`
- Categories: `[36, 33]`
- Contenly article ID: `71d10d26-6f74-4af9-bf4a-a16c342f655b`

### AI image flow
- AI image generation passed.
- Image asset URL generated under `/api/v1/ai/assets/...`.
- Fresh publish smoke verified `featured_media` is attached on WordPress.

## Fixes made
### 1. Dependency audit reduction
Ran non-breaking `npm audit fix` in backend and frontend.

Before:
- Backend: 44 vulnerabilities, 16 high.
- Frontend: 8 vulnerabilities, 2 high.

After:
- Backend: 35 vulnerabilities, 10 high.
- Frontend: 3 vulnerabilities, 0 high.

Remaining issues require dependency upgrade planning; do not run `npm audit fix --force` blindly because frontend suggests a breaking Next downgrade path.

### 2. PWA cache / stale Server Action fix
Problem:
- `frontend/public/sw.js` cached `/` and used cache-first for same-origin GET requests.
- This could serve stale HTML and cause Next Server Action mismatch errors after deploy.

Fix:
- Cache name bumped to `contenly-static-v2`.
- Removed `/` from precache list.
- Bypassed `/api/*` and `/_next/*`.
- Navigation requests now use network-first.
- Removed fallback to cached `/` for navigation.

Verified live:
- `https://contenly.app/sw.js` contains `contenly-static-v2`.
- Frontend logs showed no new Server Action errors after deploy.

### 3. Admin role enum alignment
Problem:
- Legacy helper script used uppercase `SUPER_ADMIN`.
- Current Postgres enum values are lowercase: `user`, `admin`, `super_admin`.

Fix:
- Updated `scripts/create-superadmin.js` to write `super_admin`.

### 4. Nest wildcard route warnings fixed
Problem:
- Nest startup emitted `LegacyRouteConverter` warnings for wildcard route syntax.

Fix:
- Changed Better Auth catch-all route from `@All('*')` to `@All('*path')`.
- Changed CSRF middleware route from `forRoutes('*')` to `forRoutes({ path: '*path', method: RequestMethod.ALL })`.

Verified after deploy:
- LegacyRouteConverter warnings gone.

### 5. Disabled automatic schema push on startup
Problem:
- `backend/start.sh` ran `npx drizzle-kit push --force` on every container start.
- This is unsafe for production and attempted destructive schema changes, including `DROP COLUMN` statements.
- It also produced enum error: `invalid input value for enum user_role: "SUPER_ADMIN"`.

Fix:
- `drizzle-kit push --force` no longer runs by default.
- It only runs when `RUN_DB_PUSH_ON_STARTUP=1` is explicitly set.

Verified after deploy:
- Startup log now shows schema push skipped.
- `SUPER_ADMIN` enum error gone.
- Backend starts cleanly.

## Current remaining items
- Configure `RESEND_API_KEY` for real password reset email delivery. Current warning: password reset emails are logged only.
- Plan dependency upgrades for remaining audit findings, especially backend Nest/Bull/socket.io-related chain.
- Avoid `npm audit fix --force` without review.

## Final verified state
- Production deploy: OK.
- Health: OK.
- Database: connected.
- Frontend: ready.
- Backend: ready.
- Core publish flow: OK.
- AI image + WordPress featured media: OK.
- Startup schema push disabled: OK.
- Stale Server Action mitigation live: OK.
