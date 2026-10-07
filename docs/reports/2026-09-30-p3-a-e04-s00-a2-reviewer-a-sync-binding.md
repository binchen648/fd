# P3-E04-S00-A2 Reviewer A Sync Binding

- Document Role: `REVIEW_BINDING`
- Owner: Codex A
- Control Epoch: `FD-P3-2026-09-23-04`
- Task: `P3-E04-S00-A2`
- Status: `REVIEWER_ACCEPTED_CANDIDATE`
- Reviewed sync SHA: `00add371a1d32d09ed9c09ca3856490a1fa6ad6a`
- Reviewed sync artifact: `artifacts/phase3-e04-s00-a2-current-candidate-sync.json`
- Reviewed sync artifact SHA-256: `EBC56094F744CE7DE5FA1D6700DF57B92EFE66B0AF9A7A8B411FDFA11080F157`
- Reviewer A binding artifact: `artifacts/phase3-e04-s00-a2-reviewer-a-sync-binding.json`
- Reviewer A binding artifact SHA-256: `4E92FEF7AB33C025AB13170DB1F5A24B7AEADDBC9A6A5C1EEEB81AE3ED7A0A31`

## Reviewer A binding

- Reviewer identity: `Codex Reviewer A`
- Verdict: `PASS`
- Reviewed SHA: `00add371a1d32d09ed9c09ca3856490a1fa6ad6a`
- Exact sync artifact hash: verified against the reviewed sync
- Review commit/artifact: not supplied in this handoff

This binds Reviewer A's PASS to the exact A sync commit and its artifact hash. It does not mutate the reviewed artifact, so the supplied SHA remains stable.

## Scope boundary

The accepted scope remains the three setup consumers:

- `military.has-support-shot`
- `astronomical-science.has-chaldeas`
- `useless-person.setup`

Gate A/B remain `REVIEWER_EVIDENCE_BOUND_CANDIDATE`; Gate C remains `NOT_VERIFIED`. Legacy fallback remains `CLOSED_EXACT_ARTIFACT_BOUND` for the exact contract.

## Accounting and governance

- Main coverage credit delta: `0`
- Main denominator delta: `0`
- Migration credit delta: `0`
- `promotedOnMain=false`
- GitHub-bound Governance Owner attestation: `PENDING`

This binding is ready for Governance Owner input. It does not itself create promotion authorization, mainline acceptance, Gate promotion, or Release Gate completion.
