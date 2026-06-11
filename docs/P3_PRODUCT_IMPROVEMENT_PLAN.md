# Contenly Priority Fix + Improvement Plan (P0-P3)

## Current baseline

Production status:

- `https://contenly.app` returns HTTP 200.
- `https://contenly.app/health` returns HTTP 200.
- Database health reports `connected`.
- Dokploy Raw deploy works using GitHub build context.

Completed already:

- Backend build blocker fixed.
- Backend build passes.
- `/tmp` protected file access validates real Better Auth session.
- CORS exact origin hardening completed.
- Upload hardening completed.
- Frontend lint reduced to `0 errors` and `0 warnings`.
- Frontend build passes.
- Docs stack sync and repo artefact cleanup completed.
- Dokploy Raw deploy conflicts fixed:
  - removed `container_name`
  - removed host `ports`
  - kept Traefik network routing
- Runtime `AuthGuard` DI crash fixed with optional dependency.

## P0 — Must fix immediately

### 1. Backend build failed

Status: **DONE**

Problem:

- Missing package: `@aws-sdk/client-s3`.
- Fresh deploy could fail.

Expected fix:

```bash
cd backend
npm install @aws-sdk/client-s3
npm run build
```

Current result:

- Dependency/build issue fixed.
- Backend build passes.
- Production deploy completed successfully.

### 2. Weak `/tmp` auth validation

Status: **DONE**

File:

- `backend/src/main.ts`

Problem:

```ts
cookies.includes('better-auth.session_token')
```

This only checked cookie name, not session validity.

Impact:

- `/tmp` file access could be opened with fake cookie name.

Fix completed:

- Added real Better Auth session validation through `auth.api.getSession()`.
- Added middleware:
  - `backend/src/config/tmp-auth.middleware.ts`
- Added middleware test:
  - `backend/src/config/tmp-auth.middleware.spec.ts`

### 3. CORS used `startsWith`

Status: **DONE**

File:

- `backend/src/main.ts`

Problem:

```ts
origin.startsWith(allowedOrigin)
```

Impact:

- Similar-looking origin could pass.

Fix completed:

- Switched to exact origin whitelist matching.

### 4. Frontend lint had real bugs

Status: **DONE**

Important files:

- `frontend/src/app/(dashboard)/settings/page.tsx`
- `frontend/src/components/ui/confirm-dialog.tsx`
- `frontend/src/app/(dashboard)/content-lab/components/sections/RSSFeedSection.tsx`

Problems:

- Function used before declaration.
- Direct state mutation.
- `Date.now()` during render.

Impact:

- UI bugs and strange rerenders.

Fix completed:

- Real lint/runtime bug patterns cleaned before cosmetic lint cleanup.
- Final frontend lint result: `0 errors`, `0 warnings`.

## P1 — Important for production stability

### 5. Clean up `any` in API layer

Status: **DONE / P1 baseline**

Files/areas:

- `frontend/src/lib/api.ts`
- `frontend/src/types/api.ts`
- `frontend/src/hooks/*.ts`
- backend guards/interceptors

Impact:

- Wrong payloads may not fail at compile time.

Target fix:

- Add typed API client baseline and shared frontend API response types.

Current progress:

- Several risky `any` usages removed during lint cleanup.
- Backend guard/request typing improved.
- `frontend/src/lib/api.ts` now uses typed error payload parsing and `unknown` request body instead of loose `any`.
- `frontend/src/types/api.ts` added baseline shared frontend API response types.
- Full generated OpenAPI/Zod contract remains P2 API contract work, not P1 blocker.

### 6. Public uploads hardening

Status: **DONE / baseline hardened**

File:

- `backend/src/main.ts`

Problem:

```ts
app.use('/uploads', expressStatic.static(...))
```

Target fix:

- Allowlist MIME.
- Allowlist extension.
- Random filename.
- Max size.
- Block HTML/SVG if not required.
- Validate image content.

Current progress:

- Upload/public risk hardened enough for P1 baseline.
- Future audit can add deeper content scanning if needed.

### 7. Secrets/env validation not strong enough

Status: **DONE**

Problem:

- App can start with empty/wrong env until runtime error.

Target fix:

- Zod/Joi schema validation on startup.
- Required env examples:
  - `DATABASE_URL`
  - `REDIS_HOST`
  - `BETTER_AUTH_SECRET`
  - `OPENAI_API_KEY`
  - `FRONTEND_URL`

Current implementation:

- `backend/src/config/validate-env.ts` validates startup env and is imported by `backend/src/main.ts`.
- `backend/src/config/validate-env.spec.ts` covers required local env, missing values, and production Redis/AI key requirements.
- Verified with `npm run build` and targeted env validation test.

### 8. Backend integration tests not enough

Status: **DONE / P1 baseline**

Previous state:

- 35 tests passed.

Current state:

- Backend tests expanded and passed:
  - 13 suites
  - 68 tests
- Coverage now includes:
  - auth guard/session behavior
  - `/tmp` auth middleware
  - upload security baseline
  - env validation
  - billing service baseline
  - articles service baseline
  - WordPress service publish/connection baseline
  - encryption service
  - admin permission guard coverage
  - HTTP-level admin 403 checks
  - backend smoke flow with mocked AI

Moved to later hardening, not P1 blocker:

- deeper billing token debit/refund integration tests
- RSS polling integration tests
- AI failure handling integration tests

### 9. Frontend lint to 0 errors

Status: **DONE**

Previous state:

```txt
112 errors, 128 warnings
```

Fix areas:

- No direct state mutation.
- Hook deps.
- No impure render.
- No unescaped entities.
- No unused imports.
- Reduced `any`.

Final result:

```txt
0 errors
0 warnings
```

## P2 — Quality + maintainability

### 10. Stack documentation not synced

Status: **DONE**

Problem:

- `README.md` vs `docs/architecture.md` mismatch:
  - Next 16 vs Next 15+
  - Bull vs BullMQ
  - OpenAI vs OpenRouter

Fix completed:

- Docs aligned with `package.json` and actual code.

Touched docs include:

- `docs/architecture.md`
- `docs/deployment.md`
- `docs/video-studio-update.md`
- `camedia-ai.md`
- `DEPLOY_DOKPLOY.md`
- `DOKPLOY_DEPLOYMENT.md`

### 11. Repo artefacts

Status: **DONE**

Examples:

- `build_output*.txt`
- `push_result_utf8.txt`
- `git_status_rebase.txt`
- `backend/src/test-file.ts`

Fix completed:

- Debug files removed.
- `.gitignore` updated.
- Build output/cache patterns covered.

### 12. API contract not clear

Status: **DONE / baseline**

Target fix:

- Complete Swagger DTOs.
- Typed API client for frontend.
- Standard error response shape:

```ts
{ message, code, details }
```

Current implementation:

- Frontend typed API baseline exists in `frontend/src/types/api.ts` and `frontend/src/lib/api.ts`.
- Backend global error filter returns standard shape with `message`, `code`, optional `details`, `requestId`, `timestamp`, and `path`.
- Swagger docs remain enabled at `/api/v1/docs`.
- Full generated client from OpenAPI can be later automation, not P2 blocker.

### 13. Observability lacking

Status: **DONE / baseline**

Target fix:

- Structured logging.
- Request ID.
- Error tracking: Sentry/Logtail.
- Bull/Redis job metrics.
- Alerts for failed publish/render/AI.

Current implementation:

- `requestIdMiddleware` adds/propagates `x-request-id`.
- Request logging is structured JSON with method, URL, status, duration, and request ID.
- Global error filter logs 5xx errors with request ID.
- CORS exposes `x-request-id` for frontend/support correlation.

Moved to later ops hardening:

- Sentry/Logtail provider wiring.
- External alert rules.

### 14. Rate limit still simple/global

Status: **DONE / baseline**

Current state:

- Global throttler: 100 req/min.
- AI controller has endpoint-level throttles.
- User-rate-limit guard provides per-user limits for expensive AI paths.
- Stripe webhook is explicitly `@SkipThrottle()` and auth-guard override.

Target fix:

- Stricter auth login limit.
- Stricter AI endpoint limit.
- Billing/webhook exempt or custom policy.
- Per-user + per-IP limits.

Current implementation:

- AI generation/chat/image routes have stricter controller throttles.
- Expensive AI routes include per-user guard support.
- Webhook path remains exempt so Stripe callbacks do not get blocked.

Moved to later hardening:

- Better Auth login-specific throttling if exposed through custom controller.

### 15. Background job resilience

Status: **DONE / baseline**

Area:

- RSS polling
- render jobs
- AI generation
- publish jobs

Required improvements:

- Retry policy.
- Dead-letter queue.
- Idempotency key.
- Job timeout.
- Cleanup stuck jobs.

Current implementation:

- `feed-polling` queue now has default retry policy:
  - `attempts: 3`
  - exponential backoff
  - `timeout: 120000`
  - bounded `removeOnComplete` / `removeOnFail`
- Recurring feed polling already uses stable job ID.
- Manual feed poll now uses minute-bucket job ID to reduce duplicate queue spam.
- Existing Redis-down fallback still performs direct poll.

Ops hardening update:

- True dead-letter queue storage added via shared `dead-letter` Bull queue.
- Failed jobs from `feed-polling`, `render`, and `video-clip` now write payloads to dead-letter storage with source queue, job id, attempts, failure reason, stacktrace, and original data.

Ops hardening update:

- Dedicated stuck-job cleanup command added via `backend npm run jobs:cleanup-stuck`.
- Defaults to dry-run; set `STUCK_JOB_CLEAN_DRY_RUN=false` to remove stale jobs.
- Configurable envs: `STUCK_JOB_MAX_AGE_MS`, `STUCK_JOB_CLEAN_LIMIT`, `STUCK_JOB_QUEUES`, `STUCK_JOB_STATUSES`.

## P3 — Product improvement

### 16. Dashboard loading/error states

Status: **DONE (baseline)**

Goal:

- Add consistent UX for loading, empty, error, and retry states.

Tasks:

- [x] Audit dashboard pages with raw loading/error UI.
- [x] Add shared skeleton components.
- [x] Add empty states with actionable CTA.
- [x] Add retry button for failed queries.
- [x] Standardize copy and layout.

Implementation notes:

- Shared page states live in `frontend/src/components/ui/page-state.tsx`.
- Dashboard overview has full-page error + trend fallback retry.
- Articles library has table skeleton, error retry, and empty CTA baseline.
- Remaining candidate pages can adopt same component incrementally.

Candidate areas:

- dashboard overview
- articles
- feeds
- content lab
- billing
- settings
- integrations
- analytics

### 17. Role/admin permission audit

Status: **DONE**

Goal:

- Ensure admin/super-admin access is enforced by backend guards, not frontend visibility only.

Tasks:

- [x] List all frontend admin/super-admin routes.
- [x] Map each route to backend API endpoints.
- [x] Verify endpoint guard coverage.
- [x] Add missing frontend UX guard on `/admin/api-keys`.
- [x] Add guard coverage tests for known admin endpoints.
- [x] Add HTTP-level integration tests for blocked non-admin access.

Current audit doc/tests:

- `docs/ROLE_ADMIN_PERMISSION_AUDIT.md`
- `backend/src/common/guards/admin-permission-coverage.spec.ts`
- `backend/src/common/guards/admin-permission-http.spec.ts`

Checkpoints:

- Frontend guard is not enough.
- Backend must reject unauthorized access directly.
- Super-admin endpoints must use super-admin guard.

### 18. WordPress integration robustness

Status: **DONE (baseline)**

Goal:

- Make WordPress publishing predictable and recoverable.

Tasks:

- [x] Add periodic connection test baseline via `verifySiteConnection`/scheduled sync hooks.
- [x] Add category sync retry.
- [x] Add publish rollback/status reconciliation baseline.
- [x] Improve error reason shown to user.
- [x] Store last WP connectivity status.
- [x] Store last sync/publish error code and message.

Implementation notes:

- WordPress requests now use timeout + retry for transient failures.
- `verifySiteConnection` and publish success/failure update `status` and `lastHealthCheck`.
- Publish returns `syncWarning` when remote post exists but local article sync fails.
- Friendly errors cover auth, missing REST endpoint, rate limit, timeout, unreachable host, and server errors.
- Last error tracking uses `last_error_code`, `last_error_message`, `last_error_at`, and `last_error_operation` on `wp_site`.

Failure modes to handle:

- invalid credentials
- expired/revoked app password
- site unreachable
- WP REST API disabled
- category missing or deleted
- publish succeeds remotely but local status update fails
- local publish marked success but remote post missing

### 19. AI cost control

Status: **DONE (baseline)**

Goal:

- Reduce runaway AI cost and improve user-level budget safety.

Tasks:

- [x] Add max prompt length per feature.
- [x] Add model fallback configuration.
- [x] Add per-feature token estimate.
- [x] Add spending cap per user.
- [x] Log AI usage by feature/user/model.
- [x] Return clear error when cap reached.

Implementation notes:

- Baseline guardrails live in `backend/src/modules/ai/services/ai-cost-control.service.ts`.
- Protected features: article generation, SEO metadata generation, image generation, prompt generation.
- Default caps can be overridden by env keys like `AI_ARTICLE_GENERATION_MAX_PROMPT_CHARS`, `AI_ARTICLE_GENERATION_MAX_ESTIMATED_TOKENS`, and `AI_FALLBACK_MODEL`.
- User-level monthly currency cap uses `AI_MONTHLY_SPEND_CAP_USD` or feature-specific `AI_ARTICLE_GENERATION_MONTHLY_SPEND_CAP_USD` style env keys.
- Estimated AI spend is recorded in `transaction` metadata with `source: ai_cost_control`; price defaults to `AI_DEFAULT_PRICE_PER_MILLION_TOKENS_USD` or `$1/million` fallback.

Candidate caps:

- prompt generator
- article generation
- RSS article generation
- video script generation
- image generation
- Instagram studio generation

### 20. E2E smoke test

Status: **DONE**

Goal:

- Add minimal smoke coverage for critical flows.

Current backend HTTP smoke:

- [x] mocked authenticated user
- [x] create article
- [x] generate content mock
- [x] save draft
- [x] billing balance load
- [x] list articles

Current browser smoke:

- [x] Playwright mocked authenticated session
- [x] dashboard page load
- [x] browser-level create/generate/save API flow
- [x] articles page load
- [x] billing page load
- [x] settings route load

Implementation notes:

- Backend smoke exists at `backend/src/smoke/app-smoke.spec.ts`.
- Browser smoke exists at `frontend/e2e/smoke.spec.ts`.
- Prefer mocked AI response for deterministic CI.
- Use seeded or mocked test user.
- Avoid real external OpenAI/WordPress calls in smoke test.
- Run in CI or pre-deploy manually.

## 7-day work order

### Day 1

Completed:

- [x] fix `@aws-sdk/client-s3`
- [x] backend build pass
- [x] exact CORS
- [x] `/tmp` session validation

### Day 2

Completed:

- [x] fix 3 frontend bug lint nyata:
  - settings
  - confirm-dialog
  - RSSFeedSection

### Day 3

Completed:

- [x] env validation
- [x] uploads validation/hardening

### Day 4

Completed:

- [x] lint errors reduced `112 -> <30`
- [x] lint reached `0 errors`, `0 warnings`

### Day 5

Partial:

- [x] backend unit/auth guard tests added
- [ ] billing integration tests
- [ ] article integration tests

### Day 6

Completed:

- [x] docs sync
- [x] cleanup debug artefact
- [x] `.gitignore` update

### Day 7

Partial:

- [x] deploy flow fixed for Dokploy Raw
- [x] live health endpoint OK
- [ ] observability basic
- [ ] smoke test deploy flow

## Target healthy checklist

Current status:

- [x] backend `npm run build` passes
- [x] backend tests passed before final deploy cycle
- [x] frontend `npm run build` passes
- [x] frontend `npm run lint` has `0 errors`
- [x] health endpoint live OK
- [x] auth protected file validates real session
- [x] no obvious public upload risk after hardening
- [x] Dokploy Raw deploy works
- [x] fresh clone build verified without cache from `origin/main` (`5a575f8`)
- [x] backend Jest uuid ESM issue fixed
- [x] env validation added
- [x] API contract/error response baseline added
- [x] observability basic added
- [x] rate limit baseline refined
- [x] background job resilience baseline added
- [x] E2E smoke test added

## Fresh clone verification

Latest verification:

- Fresh clone path: `/tmp/contenly-fresh-verify`.
- Commit verified: `5a575f8`.
- Commands passed:
  - `npm ci --prefix backend`
  - `npm ci --prefix frontend`
  - `npm run build`
- Live smoke checked:
  - `https://contenly.app` -> 200
  - `https://contenly.app/login` -> 200
  - `https://contenly.app/health` -> 200
  - `https://contenly.app/api/v1/docs` -> 200
- Note: `https://contenly.app/api/v1/health` returns 404 because health endpoint is mounted at `/health`.
- Dependency audit follow-up completed baseline:
  - backend audit reduced to 9 moderate, 0 high, 0 critical after safe fixes; remaining items require dependency migration or upstream fixes (`bull`/`uuid`, `drizzle-kit`/`esbuild`, `better-auth` dev dependency chain).
  - frontend audit reduced to 3 moderate, 0 high, 0 critical after safe fixes and Next.js 16.2.9 upgrade.

## Remaining work summary

P0:

- All items done.

P1:

- Done:
  - API layer typing baseline
  - uploads hardening
  - env validation
  - frontend lint to 0
  - backend Jest uuid ESM fix
  - backend test baseline expanded to 13 suites / 68 tests
- Partial/pending:
  - none for P1 baseline
- Moved to P2/P3:
  - generated API contract
  - deeper feature-specific integration tests

P2:

- Done:
  - docs sync
  - repo artefact cleanup
  - API contract/error response baseline
  - observability basic/request ID
  - rate limit baseline
  - background job resilience baseline
- Pending:
  - none for P2 baseline
- Moved to later ops hardening:
  - none for current ops baseline
- Ops hardening done:
  - generated OpenAPI client automation baseline (`backend npm run openapi:generate`, `frontend npm run api:generate`)
  - Sentry/Logtail-style observability provider wiring baseline (`OBSERVABILITY_WEBHOOK_URL`, `OBSERVABILITY_PROVIDER`)
  - true dead-letter queue storage baseline (`dead-letter` Bull queue)
  - stuck-job cleanup command (`backend npm run jobs:cleanup-stuck`)

P3:

- Done:
  - role/admin permission audit
  - E2E smoke test
  - dashboard loading/error states baseline
  - AI cost control baseline
  - WordPress robustness baseline
- Pending:
  - none for P3 baseline

## Next recommended order

1. AI cost control guardrails.
2. WordPress robustness.
3. Dashboard loading/error UX pass.
4. Ops hardening: generated OpenAPI client, Sentry/Logtail, dead-letter/stuck-job cleanup.

Reason:

- Permission audit tests protect security boundary.
- E2E smoke test protects deploy confidence.
- API contract reduces long-term regressions.
- AI cost control protects spend.
- WordPress/queue improvements improve reliability.
- Observability/rate limit support production operation.
- Dashboard polish can follow after core safety.
