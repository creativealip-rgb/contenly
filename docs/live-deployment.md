# Live Deployment Source of Truth

Last verified: 2026-06-21

## Production domain

- App: `https://contenly.app`
- Frontend container port: `3000`
- Backend container port: `3001`
- Public API route: `https://contenly.app/api/*` and `https://contenly.app/health`

## Current live branch

Production builds from GitHub branch:

```txt
main
```

Do not assume `contenly-deploy` is live. It is not used by current Dokploy compose unless the compose context is changed manually.

## Dokploy project type

Dokploy uses a **Raw Compose** app, not a normal Git application entry.

Verified Dokploy DB values:

```txt
appName: contenly
sourceType: raw
autoDeploy: true
composePath: ./docker-compose.yml
```

Because source type is `raw`, the effective branch is defined inside the compose file, not in Dokploy Git settings.

## Compose file path on server

```bash
/etc/dokploy/compose/contenly/code/docker-compose.yml
```

Current live build contexts:

```yaml
backend:
  build:
    context: https://github.com/creativealip-rgb/contenly.git#main
    dockerfile: Dockerfile.backend

frontend:
  build:
    context: https://github.com/creativealip-rgb/contenly.git#main
    dockerfile: Dockerfile.frontend
```

Both backend and frontend must point to the same branch unless intentionally testing split versions.

## Normal deployment workflow

1. Merge or commit changes to `main`.
2. Push `main` to GitHub:
   ```bash
   git checkout main
   git pull --ff-only origin main
   git push origin main
   ```
3. Trigger Dokploy redeploy for `Contenly Compose`, or use manual command below.
4. Verify live routes:
   ```bash
   curl -I https://contenly.app
   curl -I https://contenly.app/admin/api-keys
   curl https://contenly.app/health
   ```

## Manual server deploy commands

Use only when Dokploy UI is unavailable or manual rebuild is required:

```bash
cd /etc/dokploy/compose/contenly/code
docker compose -p contenly up -d --build
```

Always include `-p contenly`. Without it, Compose may use the directory name (`code`) as the project name and collide with fixed container names such as `contenly-redis`.

If using `docker-compose.dokploy.yml` in repo, confirm server compose path first. Current live server path uses `docker-compose.yml` under Dokploy compose directory.

## How to verify live branch from server

```bash
sed -n '1,120p' /etc/dokploy/compose/contenly/code/docker-compose.yml | grep 'github.com/creativealip-rgb/contenly.git#'
```

Expected output:

```txt
context: https://github.com/creativealip-rgb/contenly.git#main
context: https://github.com/creativealip-rgb/contenly.git#main
```

## How to verify via Dokploy database

```bash
docker exec -i dokploy-postgres.1.v8dz0x25tdw16hjrsgosxaoam psql -U dokploy -d dokploy <<'SQL'
select "composeId", name, "appName", "sourceType", repository, branch, "customGitUrl", "customGitBranch", "composePath", "autoDeploy", "triggerType"
from compose
where "appName" = 'contenly';
SQL
```

Expected key values:

```txt
sourceType: raw
appName: contenly
composePath: ./docker-compose.yml
autoDeploy: true
```

## Branch policy

- `main`: production source for `contenly.app`.
- `contenly-deploy`: legacy/staging/deploy experiment branch. Not production unless compose file points to `#contenly-deploy`.
- `contently-rev2`: old branch. Not production.

## Changing production branch

Only change production branch deliberately.

Edit both backend and frontend contexts in:

```bash
/etc/dokploy/compose/contenly/code/docker-compose.yml
```

Example switch to `contenly-deploy`:

```diff
- context: https://github.com/creativealip-rgb/contenly.git#main
+ context: https://github.com/creativealip-rgb/contenly.git#contenly-deploy
```

Do this for both backend and frontend, then redeploy. Document reason in commit or ops note.

## Common mistake

Mistake: pushing to `contenly-deploy` and expecting `https://contenly.app` to change.

Why wrong: live compose builds from `#main`.

Correct: push production changes to `main`, or explicitly change compose context branch.

## 2026-06-21 production hardening verification

Latest verified production commit after hardening:

```txt
bc99e5b fix: disable schema push on startup by default
```

Recent shipped commits:

```txt
024fcbd chore: reduce audit findings and fix PWA cache
9517f11 fix: align admin role and wildcard routes
bc99e5b fix: disable schema push on startup by default
```

Post-deploy verification:

```txt
https://contenly.app/health -> healthy, database connected
contenly-frontend-1 -> Up
contenly-backend-1 -> Up
contenly-postgres-1 -> Up healthy
contenly-redis -> Up
```

Smoke test passed:

```txt
RSS fetch -> scrape -> AI generate -> AI image -> draft -> WordPress publish -> WP API verify -> Contenly article PUBLISHED
```

Smoke publish proof:

```txt
WP post ID: 428
WP media ID: 427
WP URL: https://nggawe.web.id/in-the-weights-cara-baru-mengukur-seberapa-kuat-nama-anda-diingat-model-ai/
Contenly article ID: 71d10d26-6f74-4af9-bf4a-a16c342f655b
```

Production startup policy:

- `backend/start.sh` does **not** run `drizzle-kit push --force` by default.
- Enable only deliberately with `RUN_DB_PUSH_ON_STARTUP=1`.
- Reason: automatic schema push attempted destructive changes and enum conversions on production.

Known remaining warning:

```txt
RESEND_API_KEY not set - password reset emails will only be logged
```

Full work log: [`log-2026-06-21-production-hardening.md`](log-2026-06-21-production-hardening.md).
