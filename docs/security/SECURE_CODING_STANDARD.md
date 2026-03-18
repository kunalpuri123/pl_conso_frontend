# Secure Coding Standard

## 1. Authentication and Authorization
- Never trust client role checks alone.
- Enforce authorization at DB policy and backend endpoint layers.
- Use least-privilege credentials for service operations.

## 2. Input Handling
- Sanitize user-controlled text before persistence and rendering.
- Validate required run fields by workflow.
- Restrict file upload types and size in UI and server where possible.

## 3. Data Access
- Prefer typed queries and explicit filters.
- Avoid broad table scans for privileged endpoints.
- Keep migration and generated type files in sync.

## 4. Secrets and Configuration
- Do not commit secrets in repo.
- Use environment variables for all keys and service credentials.
- Rotate service keys periodically.

## 5. Edge Function Standards
- Validate request body schema.
- Return structured error payloads.
- Add robust `try/catch` and explicit status codes.
- Include tests or smoke checks before deployment.

## 6. Security PR Checklist
- [ ] RLS impact reviewed
- [ ] Storage policy impact reviewed
- [ ] Sanitization/XSS reviewed
- [ ] AuthN/AuthZ checks reviewed
- [ ] Logging/audit implications documented
