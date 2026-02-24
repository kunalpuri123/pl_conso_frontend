# Security Recheck Report (Focused)

**Date:** February 17, 2026  
**Type:** Targeted external recheck after latest fixes  
**Targets:**  
- Frontend: `https://pl-conso-frontend.vercel.app/`  
- Backend: `https://pl-conso-backend.onrender.com/`  
- Supabase: `https://kqszoxpiyxmohqobmfog.supabase.co`

## Executive Summary

The latest recheck confirms that unauthenticated backend access and anonymous Supabase access are blocked.  
However, a **critical BOLA/IDOR issue remains**: an authenticated non-owner user can still read another user’s run logs.

## Scope

Focused validation of:
1. Unauthenticated backend access
2. Anonymous Supabase table access
3. Authenticated owner vs non-owner access to run logs

## Results

### 1) Unauthenticated backend access

- `POST /run/{id}` -> `401`
- `GET /run/{id}/logs` -> `401`

Status: **PASS**

### 2) Anonymous Supabase access

- `runs` -> `401 permission denied`
- `profiles` -> `401 permission denied`
- `run_logs` -> `401 permission denied`
- `feedback` -> `401 permission denied`

Status: **PASS**

### 3) Authenticated BOLA/IDOR check (run logs)

Authenticated user:
- `user_id = e4cc8f9a-4cc4-4477-87f6-78b3f530ad98`

Runs used:
- own run: `795fdbee-df7d-4501-ba2c-68de0c2aad20` -> `200` (expected)
- foreign run: `0e2e45b7-a5f7-4809-89ad-d15cf9a1231c`  
  foreign owner: `228aec52-da2d-46bd-b4cd-9fefd14fe206`

Observed:
- `GET /run/0e2e45b7-a5f7-4809-89ad-d15cf9a1231c/logs` with non-owner token -> `200` with log data

Expected:
- `403` or `404`

Status: **FAIL (Critical)**

## Risk Classification

- **BOLA/IDOR on run logs:** Critical
- **Business impact:** Cross-user data exposure (confidentiality breach)

## Conclusion

Security posture improved, but system remains **not fully secure** due to unresolved critical authorization bypass on run-log access.

## Required Next Action

1. Patch backend route authorization so non-owner/non-admin cannot access `/run/{id}/logs`.
2. Redeploy backend.
3. Re-run only this verification:
   - own run logs -> `200`
   - foreign run logs -> `403/404`
   - unauth -> `401`
