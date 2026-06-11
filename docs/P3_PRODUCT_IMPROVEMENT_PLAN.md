# P3 Product Improvement Plan

## Current baseline

Production status:

- `https://contenly.app` returns HTTP 200.
- `https://contenly.app/health` returns HTTP 200.
- Database health reports `connected`.
- Dokploy Raw deploy works using GitHub build context.

Completed before this P3 plan:

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

## Queue robustness area

Area:

- RSS polling
- render jobs
- AI generation
- publish jobs

Required improvements:

- [ ] Retry policy
- [ ] Dead-letter queue
- [ ] Idempotency key
- [ ] Job timeout
- [ ] Cleanup stuck jobs

Implementation notes:

- Use explicit job IDs or idempotency keys per user/action/resource.
- Add attempt/backoff policy per queue.
- Add timeout per job type based on expected runtime.
- Persist failed job reason for support/debug.
- Add stuck job cleanup command or scheduled task.

## P3 — Product improvement

### 16. Dashboard loading/error states

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

Goal:

- Ensure admin/super-admin access is enforced by backend guards, not frontend visibility only.

Tasks:

- [ ] List all frontend admin/super-admin routes.
- [ ] Map each route to backend API endpoints.
- [ ] Verify endpoint guard coverage.
- [ ] Add missing backend guards.
- [ ] Add tests for blocked non-admin access.

Checkpoints:

- Frontend guard is not enough.
- Backend must reject unauthorized access directly.
- Super-admin endpoints must use super-admin guard.

### 18. WordPress integration robustness

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

Already completed:

- [x] fix `@aws-sdk/client-s3`
- [x] backend build pass
- [x] exact CORS
- [x] `/tmp` session validation

### Day 2

Already completed or superseded by lint cleanup:

- [x] fix real frontend lint bugs
- [x] settings issues cleaned
- [x] confirm-dialog issue cleaned
- [x] RSS-related lint cleanup included in frontend lint pass

### Day 3

Mostly completed:

- [x] uploads validation/hardening
- [ ] env validation audit and stricter startup validation

### Day 4

Completed:

- [x] lint errors reduced below 30
- [x] frontend lint reached `0 errors`, `0 warnings`

### Day 5

Partially completed:

- [x] backend unit tests pass before deploy
- [x] auth guard/middleware tests added
- [ ] billing integration tests
- [ ] article integration tests

### Day 6

Completed:

- [x] docs sync
- [x] cleanup debug artefact
- [x] `.gitignore` update

### Day 7

Partially completed:

- [x] deploy flow fixed for Dokploy Raw
- [x] live health endpoint OK
- [ ] observability basic
- [ ] E2E smoke test

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
- [ ] observability basic added
- [ ] E2E smoke test added

## Next recommended order

1. Role/admin permission audit.
2. E2E smoke test with mocked AI.
3. AI cost control guardrails.
4. WordPress robustness.
5. Queue retry/dead-letter/idempotency/stuck cleanup.
6. Dashboard loading/error UX pass.

Reason:

- Permission audit protects security boundary.
- E2E smoke test protects deploy confidence.
- AI cost control protects spend.
- WordPress/queue improvements improve reliability.
- Dashboard polish can follow after core safety.
