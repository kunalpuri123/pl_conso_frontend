# Security Audit 4 Report

**Target Frontend:** `https://pl-conso-frontend.vercel.app/`  
**Target Backend:** `https://pl-conso-backend.onrender.com/`  
**Target Supabase:** `https://kqszoxpiyxmohqobmfog.supabase.co`  
**Test Date:** February 17, 2026  
**Method:** External black-box retest

## Executive Summary

Most remediation controls are now effective:
- Unauthenticated backend execution is blocked.
- API docs/openapi are not publicly exposed.
- Anonymous Supabase access is denied across tested tables.
- JWT tampering is rejected.
- Authenticated rate limiting is active.
- Stored XSS payloads are now persisted in escaped form.

One critical issue remains:
- **BOLA/IDOR on run logs is still exploitable** for authenticated non-owners.

## Key Results

### 1) Authentication enforcement on backend operational endpoints
All tested unauthenticated requests returned `401`:
- `/run/{id}`
- `/input-run/{id}`
- `/pdp-run/{id}`
- `/run/{id}/rerun`
- `/input-run/{id}/rerun`
- `/pdp-run/{id}/rerun`
- `/runs/{id}/cancel`
- `/runs/{id}/delete`
- `/run/{id}/logs`
- `/run/{id}/ai-report-pdf`

Result: **PASS**

### 2) API docs exposure
- `GET /openapi.json` -> `404`
- `GET /docs` -> `404`

Result: **PASS**

### 3) CORS
- Cross-origin preflight from `https://evil.example` -> `400 Disallowed CORS origin`

Result: **PASS**

### 4) Supabase anonymous access controls
Anon read attempts:
- `runs`, `projects`, `profiles`, `user_roles`, `run_logs`, `run_files`, `feedback` -> all `401 permission denied`

Anon write attempts:
- `user_roles` insert -> `401 permission denied`
- `feedback` insert -> `401 permission denied`

Result: **PASS**

### 5) JWT manipulation checks
- Tampered bearer token -> `401 Invalid or expired token`
- Missing token -> `401 Missing Authorization header`

Result: **PASS**

### 6) Rate limiting
Authenticated burst on logs endpoint:
- `68 x 200`
- `12 x 429`

Result: **PASS** (throttling active)

### 7) Stored XSS persistence
Profile update payload:
- Input: `<svg/onload=alert(414)>`
- Stored value returned: `&lt;svg/onload=alert(414)&gt;`

Result: **PASS** (escaped persistence)

## Critical Finding

### F-01: BOLA/IDOR still present on run logs

**Severity:** Critical  
**Endpoint:** `GET /run/{run_id}/logs`

**Proof**
- Authenticated user: `e4cc8f9a-4cc4-4477-87f6-78b3f530ad98`
- Foreign run: `0e2e45b7-a5f7-4809-89ad-d15cf9a1231c`
- Foreign owner: `228aec52-da2d-46bd-b4cd-9fefd14fe206`
- Request with first user’s JWT to foreign run logs returned:
  - `200` with actual log data

**Expected**
- `403` (or `404`) for non-owner/non-admin access.

**Likely Cause**
- Deployed backend authorization logic is not enforcing owner/admin correctly for this path (or stale build is running).

**Fix**
1. Ensure deployed backend has strict owner/admin check for run-scoped endpoints.
2. Verify `is_admin()` does not rely on weak truthiness of RPC payload shapes.
3. Add explicit integration test:
   - user A token + user B run ID -> must be `403/404`.

## Risk Status

- Previous critical unauth abuse: **resolved**
- Supabase anon exposure: **resolved**
- XSS escaping control: **resolved**
- **BOLA/IDOR:** **unresolved (critical)**

## Security Score (Audit 4)

**88 / 100**

Blocked from 90+ solely by unresolved critical authorization bypass.

## Immediate Next Step

Deploy the backend with the strict admin/ownership fix, then rerun one focused verification:
- `GET /run/{foreign_run_id}/logs` with non-owner JWT must return `403/404`.
