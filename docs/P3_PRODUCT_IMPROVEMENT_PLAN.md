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

Status: **PARTIAL**

Files/areas:

- `frontend/src/lib/api.ts`
- `frontend/src/hooks/*.ts`
- backend guards/interceptors

Impact:

- Wrong payloads may not fail at compile time.

Target fix:

- Add shared types/Zod schema for request/response.

Current progress:

- Several risky `any` usages removed during lint cleanup.
- Backend guard/request typing improved.
- Full shared API contract/Zod layer is still pending.

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

Status: **PARTIAL**

Previous state:

- 35 tests passed.

Current state before final deploy cycle:

- Backend tests were expanded and passed:
  - 10 suites
  - 57 tests

Still needed:

- Auth/session integration tests.
- Billing token debit/refund integration tests.
- Article publish integration tests.
- WordPress credential encryption integration tests.
- RSS polling integration tests.
- AI failure handling integration tests.

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

Status: **PENDING**

Target fix:

- Complete Swagger DTOs.
- Typed API client for frontend.
- Standard error response shape:

```ts
{ message, code, details }
```

### 13. Observability lacking

Status: **PENDING**

Target fix:

- Structured logging.
- Request ID.
- Error tracking: Sentry/Logtail.
- Bull/Redis job metrics.
- Alerts for failed publish/render/AI.

### 14. Rate limit still simple/global

Status: **PENDING**

Current state:

- Global simple rate limit around 100 req/min.

Target fix:

- Stricter auth login limit.
- Stricter AI endpoint limit.
- Billing/webhook exempt or custom policy.
- Per-user + per-IP limits.

### 15. Background job resilience

Status: **PENDING**

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

Implementation notes:

- Use explicit job IDs or idempotency keys per user/action/resource.
- Add attempt/backoff policy per queue.
- Add timeout per job type based on expected runtime.
- Persist failed job reason for support/debug.
- Add stuck job cleanup command or scheduled task.

## P3 — Product improvement

### 16. Dashboard loading/error states

Status: **PENDING**

Goal:

- Add consistent UX for loading, empty, error, and retry states.

Tasks:

- [ ] Audit dashboard pages with raw loading/error UI.
- [ ] Add shared skeleton components.
- [ ] Add empty states with actionable CTA.
- [ ] Add retry button for failed queries.
- [ ] Standardize copy and layout.

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

Status: **PARTIAL**

Goal:

- Ensure admin/super-admin access is enforced by backend guards, not frontend visibility only.

Tasks:

- [x] List all frontend admin/super-admin routes.
- [x] Map each route to backend API endpoints.
- [x] Verify endpoint guard coverage.
- [x] Add missing frontend UX guard on `/admin/api-keys`.
- [x] Add guard coverage tests for known admin endpoints.
- [ ] Add HTTP-level integration tests for blocked non-admin access.

Current audit doc/tests:

- `docs/ROLE_ADMIN_PERMISSION_AUDIT.md`
- `backend/src/common/guards/admin-permission-coverage.spec.ts`

Checkpoints:

- Frontend guard is not enough.
- Backend must reject unauthorized access directly.
- Super-admin endpoints must use super-admin guard.

### 18. WordPress integration robustness

Status: **PENDING**

Goal:

- Make WordPress publishing predictable and recoverable.

Tasks:

- [ ] Add periodic connection test.
- [ ] Add category sync retry.
- [ ] Add publish rollback/status reconciliation.
- [ ] Improve error reason shown to user.
- [ ] Store last WP connectivity status.
- [ ] Store last sync/publish error code and message.

Failure modes to handle:

- invalid credentials
- expired/revoked app password
- site unreachable
- WP REST API disabled
- category missing or deleted
- publish succeeds remotely but local status update fails
- local publish marked success but remote post missing

### 19. AI cost control

Status: **PENDING**

Goal:

- Reduce runaway AI cost and improve user-level budget safety.

Tasks:

- [ ] Add max prompt length per feature.
- [ ] Add model fallback configuration.
- [ ] Add per-feature token estimate.
- [ ] Add spending cap per user.
- [ ] Log AI usage by feature/user/model.
- [ ] Return clear error when cap reached.

Candidate caps:

- prompt generator
- article generation
- RSS article generation
- video script generation
- image generation
- Instagram studio generation

### 20. E2E smoke test

Status: **PENDING**

Goal:

- Add minimal Playwright smoke test for critical flows.

Required smoke flow:

- [ ] login
- [ ] create article
- [ ] generate content mock
- [ ] save draft
- [ ] billing page load
- [ ] settings load

Implementation notes:

- Prefer mocked AI response for deterministic CI.
- Use seeded test user.
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
- [ ] fresh clone deploy verified without cache end-to-end
- [ ] backend Jest fresh install issue fixed
- [x] env validation added
- [ ] complete API contract added
- [ ] observability basic added
- [ ] rate limit refined
- [ ] background job resilience added
- [ ] E2E smoke test added

## Remaining work summary

P0:

- All items done.

P1:

- Done:
  - uploads hardening
  - frontend lint to 0
- Partial/pending:
  - API layer `any` cleanup/shared schema
  - deeper backend integration tests

P2:

- Done:
  - docs sync
  - repo artefact cleanup
- Pending:
  - API contract
  - observability
  - refined rate limit
  - background job resilience

P3:

- Partial:
  - role/admin permission audit
- Pending:
  - dashboard loading/error states
  - WordPress robustness
  - AI cost control
  - E2E smoke test

## Next recommended order

1. Role/admin permission audit integration tests.
2. E2E smoke test with mocked AI.
3. API contract + typed frontend client.
4. AI cost control guardrails.
5. WordPress robustness.
6. Queue retry/dead-letter/idempotency/stuck cleanup.
7. Observability + rate limit refinement.
8. Dashboard loading/error UX pass.

Reason:

- Permission audit tests protect security boundary.
- E2E smoke test protects deploy confidence.
- API contract reduces long-term regressions.
- AI cost control protects spend.
- WordPress/queue improvements improve reliability.
- Observability/rate limit support production operation.
- Dashboard polish can follow after core safety.
