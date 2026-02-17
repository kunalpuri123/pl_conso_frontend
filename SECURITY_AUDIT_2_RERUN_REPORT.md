# Security Audit 2 Rerun Report

**Target Frontend:** `https://pl-conso-frontend.vercel.app/`  
**Target Backend:** `https://pl-conso-backend.onrender.com/`  
**Target Supabase:** `https://kqszoxpiyxmohqobmfog.supabase.co`  
**Assessment Date:** February 17, 2026  
**Assessment Type:** External black-box re-audit (post-deployment)

## 1) Executive Summary

This rerun confirms that frontend header hardening is deployed, but critical backend and data-layer risks remain exploitable:

- Unauthenticated backend run-trigger endpoints are still callable.
- Supabase anonymous read access still exposes sensitive operational data.
- Stored XSS payloads are accepted and persisted in user-controlled fields.
- `user_roles` RLS policy currently throws recursion errors (authorization instability).
- No effective rate limiting observed on tested backend polling endpoint.

Current risk posture: **High/Critical**.

## 2) Scope and Approach

Re-tested the previously identified high-impact paths with live requests:

- Frontend edge/header behavior
- Backend route authentication behavior
- OpenAPI exposure and auth declaration check
- Supabase anon read/write controls (RLS effectiveness)
- Authenticated payload insertion for stored XSS validation
- Quick SQLi timing probe
- Rate-limit probe
- CORS preflight behavior

## 3) Commands Executed (Representative)

```bash
# Backend baseline
curl -I https://pl-conso-backend.onrender.com
curl -i https://pl-conso-backend.onrender.com/

# Supabase anon read probes
curl "$VITE_SUPABASE_URL/rest/v1/runs?select=*&limit=1" \
  -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY"

# Supabase anon write probes
curl -X POST "$VITE_SUPABASE_URL/rest/v1/user_roles" ...
curl -X POST "$VITE_SUPABASE_URL/rest/v1/feedback" ...

# Unauthenticated backend execution probes
curl -X POST "https://pl-conso-backend.onrender.com/run/<uuid>"
curl -X POST "https://pl-conso-backend.onrender.com/input-run/<uuid>"
curl -X POST "https://pl-conso-backend.onrender.com/pdp-run/<uuid>"

# OpenAPI/auth declaration check
curl https://pl-conso-backend.onrender.com/openapi.json

# Rate-limit probe
for i in $(seq 1 60); do
  curl -o /dev/null -w "%{http_code}\n" \
    "https://pl-conso-backend.onrender.com/run/<uuid>/logs"
done | sort | uniq -c

# SQLi timing quick check
curl -o /dev/null -w "time=%{time_total}\n" -X POST \
  "https://pl-conso-backend.onrender.com/run/%27%20AND%20SLEEP(5)--"

# Authenticated stored XSS insert
curl -X POST "$VITE_SUPABASE_URL/rest/v1/feedback" \
  -H "Authorization: Bearer <user_jwt>" \
  --data '{"subject":"XSS Auth Probe","message":"<img src=x onerror=alert(42)>", ... }'
```

## 4) Findings

### F-01: Unauthenticated backend run-trigger endpoints
- **Severity:** Critical
- **Affected endpoints:** `/run/{run_id}`, `/input-run/{run_id}`, `/pdp-run/{run_id}`
- **Observed behavior:** Unauthenticated `POST` returns `200` with `{"status":"started"}`
- **Attack scenario:** External attacker can mass-trigger workloads, cause cost/resource abuse, and manipulate job state without valid identity.
- **Proof of concept:**
  - `POST /run/11111111-1111-1111-1111-111111111111` -> `200 {"status":"started"}`
- **Remediation:**
  - Enforce JWT auth on all operational endpoints.
  - Validate ownership/role per `run_id`.
  - Add server-side authorization middleware before handler execution.

### F-02: Supabase anonymous data exposure
- **Severity:** High
- **Affected tables (observed):** `runs`, `projects`, `run_files`
- **Observed behavior:** Anonymous bearer (`publishable key`) returns `200` with real records.
- **Attack scenario:** Attacker enumerates runs, file metadata, and business project data without authentication.
- **Proof of concept:**
  - `GET /rest/v1/runs?select=*&limit=1` -> `200` with populated record.
- **Remediation:**
  - Tighten RLS policies to deny anon by default.
  - Restrict `SELECT` to `authenticated` and owner/admin checks.
  - Verify PostgREST role mapping and policy coverage table-by-table.

### F-03: Stored XSS payload persistence
- **Severity:** High
- **Affected fields (validated):** `feedback.message`, `profiles.full_name`
- **Observed behavior:** Payloads persisted via authenticated API writes (`201`/`200`).
- **Attack scenario:** If any UI renders these fields unsafely, attacker executes script in victim browser session.
- **Proof of concept payloads:**
  - `<img src=x onerror=alert(42)>`
  - `<svg/onload=alert(777)>`
- **Remediation:**
  - Encode on output in every rendering path.
  - Sanitize rich/untrusted input server-side.
  - Add automated XSS regression tests for all display components.

### F-04: `user_roles` RLS recursion error
- **Severity:** High
- **Observed behavior:** Authenticated read fails with `500` and:
  - `"infinite recursion detected in policy for relation \"user_roles\""`
- **Attack scenario:** Role checks become unstable/unavailable; authz logic can fail open/closed unpredictably depending on integration.
- **Proof of concept:**
  - `GET /rest/v1/user_roles?user_id=eq.<uid>&select=role` -> `500`
- **Remediation:**
  - Replace self-referential policy checks with a `SECURITY DEFINER` helper function or separate trusted lookup path.
  - Re-test all role-based flows after migration.

### F-05: Missing effective rate limiting on tested endpoint
- **Severity:** Medium
- **Observed behavior:** 60/60 requests to `/run/{id}/logs` returned `200` (no throttle/backoff indicator).
- **Attack scenario:** Polling abuse can increase load/cost and degrade availability.
- **Proof of concept:**
  - Burst loop -> `60 200`
- **Remediation:**
  - Apply per-IP + per-user + per-token rate limiting.
  - Add specific throttles for logs/polling endpoints and return `429`.

### F-06: Public OpenAPI/docs exposure
- **Severity:** Medium
- **Observed behavior:** `/openapi.json` and `/docs` reachable publicly (`200`).
- **Attack scenario:** Simplifies endpoint reconnaissance and attack path discovery.
- **Remediation:**
  - Disable docs in production or guard behind admin auth/network policy.

## 5) Additional Validation Results

- CORS preflight from `https://evil.example` returned `400 Disallowed CORS origin` (positive control).
- Quick SQLi timing checks did not show obvious time-based injection behavior in tested parameters.
- Frontend security headers (from user-provided edge output) are present: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

## 6) Test Artifact Cleanup

Cleanup was executed after authenticated XSS persistence tests:

- Profile `full_name` reset back to `Kunal Puri`.
- Test feedback records for `subject = "XSS Auth Probe"` deleted.

## 7) Risk Classification (CVSS-style, approximate)

- F-01 Unauthenticated run triggers: **9.8 (Critical)**
- F-02 Anon data exposure: **8.2 (High)**
- F-03 Stored XSS persistence: **8.0 (High)**
- F-04 RLS recursion / authz instability: **7.5 (High)**
- F-05 No rate limiting on logs: **6.5 (Medium)**
- F-06 Public API docs: **5.3 (Medium)**

## 8) Priority Remediation Plan

1. Block unauth backend execution endpoints immediately (authn + authz middleware).
2. Lock down Supabase RLS for `runs`, `projects`, `run_files` and re-test anon reads.
3. Fix `user_roles` recursive policy bug and verify role resolution for user/admin.
4. Add output encoding + sanitizer strategy and XSS regression tests.
5. Enforce endpoint-specific rate limits and abuse detection alerts.
6. Disable/guard `/docs` and `/openapi.json` in production.

## 9) Coverage Matrix (Audit 2 Rerun)

- Authentication vulnerabilities: **Failed**
- Broken access control / API abuse: **Failed**
- SQL Injection: **No exploit observed in quick probe; deep fuzz pending**
- XSS (stored/reflected): **Stored payload persistence confirmed**
- CSRF: **Partially validated via CORS behavior; full browser CSRF workflow pending**
- Missing security headers: **Frontend passed**
- JWT manipulation: **Deprioritized until unauth endpoint exposure is fixed**
- Rate limiting: **Failed (tested endpoint)**
- Supabase misconfiguration: **Failed (anon read exposure)**

---

**Conclusion:** Deployment includes useful frontend hardening, but critical backend authorization and Supabase data exposure issues remain exploitable and must be remediated before considering the system secure.
