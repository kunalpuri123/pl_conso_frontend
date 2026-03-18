# Product Roadmap

## Horizon View

### Now (0-1 month)
- Stabilize current run flows across all automations.
- Fix schema/type drift and edge function deployability.
- Finalize documentation baseline and ownership.

### Next (1-3 months)
- Add backend API schema documentation and versioning.
- Add richer analytics slices (by project/site/automation/owner).
- Improve run diagnostics and error surface in UI.

### Later (3-6 months)
- Workflow templates and saved run configurations.
- Notifications for run completion/failure.
- Governance dashboards (security and compliance posture).

## Milestone Diagram
```mermaid
gantt
    title Automation Hub Roadmap
    dateFormat  YYYY-MM-DD
    section Stabilization
    Docs Suite Finalization        :done, 2026-02-20, 7d
    Schema/Type Alignment          :active, 2026-02-26, 14d
    Edge Function Hardening        :2026-03-05, 14d
    section Enhancements
    API Spec Governance            :2026-03-20, 21d
    Advanced Analytics             :2026-04-05, 30d
    section Future
    Notifications                  :2026-05-20, 21d
    Run Templates                  :2026-06-05, 21d
```

## Dependencies
- Backend team publishing stable endpoint contract.
- Supabase migration discipline and schema ownership.
- Security review sign-off on policy updates.
