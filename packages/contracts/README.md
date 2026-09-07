# FD Contracts Package

This package holds protocol-level TypeScript contracts for the card-ingestion pipeline.

Current scope:

- Vision Agent request/response types
- Structuring Agent request/response types
- Guardrail Agent request/response types
- provider runtime config types
- batch job types

Source planning docs:

- `D:\fd\docs\plans\2026-04-08-fd-content-pipeline-schema-plan.md`
- `D:\fd\docs\plans\2026-04-08-fd-agent-spec-detailed.md`
- `D:\fd\docs\plans\2026-04-08-fd-siliconflow-integration.md`

Implementation note:

These types define transport contracts only. They do not yet include adapter code, validators, or file I/O.
