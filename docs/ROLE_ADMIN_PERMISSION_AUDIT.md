# Role/Admin Permission Audit

## Scope

Frontend admin surfaces checked:

- `frontend/src/app/(dashboard)/super-admin/users/page.tsx`
- `frontend/src/app/(dashboard)/super-admin/layout.tsx`
- `frontend/src/app/(dashboard)/admin/api-keys/page.tsx`

Backend admin endpoints checked:

- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/admin-settings/admin-settings.controller.ts`

## Findings

### Super Admin users page

Frontend route:

- `/super-admin/users`

Frontend guard:

- Uses `SuperAdminGuard` component in page.

Backend endpoints used:

- `GET /users/admin/list`
- `POST /users/admin/users`
- `PATCH /users/admin/:id/role`
- `PATCH /users/admin/:id/tokens`
- `PATCH /users/admin/:id/tier`
- `DELETE /users/admin/:id`

Backend guard status:

- Controller has class-level `@UseGuards(AuthGuard)`.
- Each admin endpoint above has method-level `@UseGuards(SuperAdminGuard)`.

Status:

- OK. Backend rejects non-super-admin directly.

### Admin API keys / provider model config page

Frontend route:

- `/admin/api-keys`

Frontend guard:

- Page now uses explicit `SuperAdminGuard` wrapper for UX consistency.

Backend endpoints used:

- `GET /admin/settings/providers/status`
- `GET /admin/settings/models/config`
- `POST /admin/settings/models/config`
- `GET /admin/settings/providers/:provider/models`
- `POST /admin/settings/providers/:provider/test`

Backend guard status:

- `AdminSettingsController` has class-level:

```ts
@UseGuards(SessionAuthGuard, SuperAdminGuard)
```

Status:

- Backend boundary OK.
- Frontend UX guard OK.

## Current audit result

- Backend guard coverage for known admin/super-admin endpoints: PASS.
- Frontend guard coverage for known admin/super-admin pages: PASS.
- Guard coverage tests added for known admin/super-admin endpoints: PASS.
- Full HTTP-level 403 integration tests: PENDING.

## Recommended follow-up

1. Add route-level admin layout guard if more `/admin/*` pages appear.
2. Add integration tests proving non-super-admin receives `403` on:
   - `/users/admin/list`
   - `/admin/settings/providers/status`
3. Add endpoint inventory script/check in CI later.
