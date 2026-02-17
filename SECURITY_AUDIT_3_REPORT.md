# Security Audit 3 Report

**Target Frontend:** `https://pl-conso-frontend.vercel.app/`  
**Target Backend:** `https://pl-conso-backend.onrender.com/`  
**Target Supabase:** `https://kqszoxpiyxmohqobmfog.supabase.co`  
**Execution Date:** February 17, 2026  
**Method:** External black-box retest after remediation deployment

## Executive Summary

Audit 3 confirms multiple high-risk issues from prior audits are fixed (unauthenticated backend execution blocked, docs hidden, anon table exposure reduced, JWT tamper rejected, rate limiting now active).  

However, one **critical access control issue remains**:

- Authenticated user was able to read logs for a run owned by another user (BOLA/IDOR).

Security posture is improved, but **not yet production-safe** due to the remaining critical authorization gap.

## Test Evidence (Key Results)

### 1) Authentication on backend operational endpoints
- `POST /run/{id}` -> `401 Missing Authorization header`
- `POST /input-run/{id}` -> `401`
- `POST /pdp-run/{id}` -> `401`
- `POST /runs/{id}/cancel` -> `401`
- `POST /runs/{id}/delete` -> `401`
- `GET /run/{id}/logs` -> `401` (without token)

Status: **PASS** (unauth abuse blocked).

### 2) Backend reconnaissance exposure
- `GET /openapi.json` -> `404`
- `GET /docs` -> `404`

Status: **PASS** (docs exposure removed).

### 3) CORS behavior
- Preflight from `Origin: https://evil.example` returned `400 Disallowed CORS origin`.

Status: **PASS** (expected deny behavior).

### 4) Supabase anonymous access
- `runs` -> `401 permission denied`
- `projects` -> `401 permission denied`
- `user_roles` -> `401 permission denied`
- `run_files` -> `401 permission denied`
- `profiles` -> `200 []`
- `run_logs` -> `200 []`
- `feedback` -> `200 []`
- Anon writes:
  - `POST user_roles` -> `401 permission denied`
  - `POST feedback` -> `401 RLS violation`

Status: **Mostly PASS** (sensitive table exposure fixed; empty-list access on some tables remains low-risk but should be explicitly denied if not needed).

### 5) JWT manipulation checks
- Tampered token -> `401 Invalid or expired token`
- Missing token -> `401 Missing Authorization header`

Status: **PASS**.

### 6) Rate limiting
- Authenticated burst on `/run/{own_run}/logs`:
  - `64 x 200`
  - `11 x 429`

Status: **PASS** (throttling now active).

### 7) SQLi quick probes
- No time-delay behavior observed.
- Requests returned `401/403/401/401` for tested unauth path/query payloads.

Status: **No exploitable signal in quick probe** (deep fuzz still optional).

### 8) Stored XSS persistence test (authenticated)
- `PATCH profiles.full_name="<svg/onload=alert(991)>"` -> `200` (payload persisted)
- Restored to safe value after test.

Status: **FAIL (data-layer persistence remains)**.  
Note: exploitability depends on frontend rendering/escaping path.

### 9) Critical BOLA/IDOR finding (still exploitable)

Authenticated user: `e4cc8f9a-4cc4-4477-87f6-78b3f530ad98`  
Foreign run selected via service query:  
`run_id=0e2e45b7-a5f7-4809-89ad-d15cf9a1231c`, owner `228aec52-da2d-46bd-b4cd-9fefd14fe206`  

Request:
- `GET /run/0e2e45b7-a5f7-4809-89ad-d15cf9a1231c/logs` with first user’s JWT

Observed:
- `200` with full log payload

Status: **FAIL (Critical)**.

## Vulnerability List (Audit 3 Final)

1. **F-01: BOLA/IDOR on run logs endpoint**  
Severity: **Critical**  
Risk: Cross-tenant data access and confidentiality breach.

2. **F-02: Stored XSS payload persistence in profile field**  
Severity: **High**  
Risk: Session-context script execution if any renderer is unsafe.

3. **F-03: Residual anonymous readability of some tables returning empty sets**  
Severity: **Low**  
Risk: Metadata/enumeration behavior disclosure; tighten for strict posture.

## CVSS-Style Risk Classification

- F-01 BOLA/IDOR: **9.1 (Critical)**
- F-02 Stored XSS persistence: **8.0 (High)**
- F-03 Residual anon readable empty tables: **3.7 (Low)**

## Recommended Remediation

1. **Fix BOLA immediately**
- In backend handlers, verify `run.user_id == authenticated_user_id` or admin before returning logs/reports.
- Add explicit negative tests for foreign-run IDs in CI.
- Re-validate deployed code matches source (possible partial deploy/drift).

2. **Complete XSS defense-in-depth**
- Keep storing raw text if needed, but enforce strict escaping on all render paths.
- Disallow dangerous HTML in profile/feedback inputs if HTML is not required.
- Add regression tests for payload render paths in authenticated browser sessions.

3. **Tighten anon privileges fully**
- Explicitly revoke anon `SELECT` on tables that should never be queried anonymously, even if they currently return empty sets.

## Security Score (Audit 3)

**78 / 100**

Rationale:
- Major improvements landed and validated.
- One critical authorization bypass still prevents a “secure” verdict.

## Compliance Note

For SOC2/ISO27001/GDPR-aligned controls, unresolved cross-user data exposure (BOLA) is a material access control deficiency and should be treated as a **P1 incident** until fixed and retested.
