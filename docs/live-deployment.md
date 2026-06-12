# Live Deployment Source of Truth

Last verified: 2026-06-12

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
3. Trigger Dokploy redeploy for `Contenly Compose`.
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

docker compose -f docker-compose.yml build backend frontend
docker compose -f docker-compose.yml up -d --force-recreate backend frontend
```

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
