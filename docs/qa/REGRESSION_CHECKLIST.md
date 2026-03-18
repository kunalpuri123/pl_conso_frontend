# Regression Checklist

## Pre-release Checklist

### Authentication and Access
- [ ] Login with allowed domain works.
- [ ] Unauthorized access redirects to `/login`.
- [ ] Admin-only routes block non-admin users.

### Workflow Runs
- [ ] `pl-conso` run create/start/logs/download works.
- [ ] `pl-input` run create/start/logs/download works.
- [ ] `pdp-conso` run create/start/logs/download works.
- [ ] `pp-conso` run create/start/logs/download works (fresh + revalidation).
- [ ] Run rerun works for each automation.
- [ ] Run cancel works for each automation.

### Downloads and Files
- [ ] Downloads page filters work.
- [ ] Bucket mapping by `automation_slug` resolves correct file.
- [ ] Admin file uploads and downloads work.

### Admin
- [ ] Role update works.
- [ ] Password reset works.
- [ ] Disable/enable user account works.
- [ ] Audit log and feedback admin pages load correctly.

### Security and Reliability
- [ ] No unexpected anonymous access paths.
- [ ] Feedback/profile text rendering safe from script injection.
- [ ] No severe console/network errors in happy path.
