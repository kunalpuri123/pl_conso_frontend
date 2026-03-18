# Architecture Decision Record (ADR) Log

## ADR-0001: Supabase as Unified Auth/Data/Storage Plane
- **Status**: Accepted
- **Context**: Need rapid development with strong built-in auth and RLS.
- **Decision**: Use Supabase Auth + Postgres + Storage + Edge Functions.
- **Consequences**: Faster delivery; requires strict migration and policy discipline.

## ADR-0002: External Backend for Heavy Automation Execution
- **Status**: Accepted
- **Context**: UI/Supabase should not execute long-running business pipelines.
- **Decision**: Frontend triggers external backend endpoints with JWT.
- **Consequences**: Clear separation; introduces cross-system contract dependency.

## ADR-0003: Run-Centric Orchestration Model
- **Status**: Accepted
- **Context**: Need auditable lifecycle for all workflows.
- **Decision**: `runs` as source of truth, with `run_logs` and `run_files` child records.
- **Consequences**: Enables analytics and troubleshooting; requires schema consistency.

## ADR-0004: Private Buckets + Allowlist Policies
- **Status**: Accepted
- **Context**: Sensitive automation inputs/outputs must remain private.
- **Decision**: Set all app buckets non-public and control access via RLS on `storage.objects`.
- **Consequences**: Strong security baseline; policy changes require careful regression testing.

## ADR Template
```md
## ADR-XXXX: <Title>
- Status: Proposed | Accepted | Superseded | Rejected
- Date:
- Context:
- Decision:
- Alternatives considered:
- Consequences:
- Follow-ups:
```
