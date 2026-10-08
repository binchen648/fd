# P3-E08-CI-01 Evidence Dispatch

- Owner: Codex A
- Control Epoch: `FD-P3-2026-09-23-08`
- Main base: `7072da3f5ad5b6ae77c5fb4b7eb40634c29039b0`
- Frozen implementation: `b5a76f8d2c8a742c2b4d8910c6c77ed00d7461e6`
- Worktree: `C:/Users/chenshang/.config/superpowers/worktrees/fd/a-p3-e08-ci-01-current-main-replay`
- State: `AUTHORIZED_TO_GENERATE_EVIDENCE`

Continue in the existing clean worktree. Verify the implementation is its HEAD
and its direct parent is the exact main base. Confirm current origin/main before
proceeding; report any new drift instead of silently changing the base.

Add only:

- `artifacts/phase3-e08-ci-01.json`
- `docs/reports/2026-10-08-p3-e08-ci-01-current-main-ci-stability.md`

Bind task, epoch, baseSha, implementationSha and historical source evidence
13b8096b66a430c8327d4e36ac07e735a21a10b2. Preserve the distinction between old
184-files/1411-tests results and this current-main 183-files/1409-tests run.
Record commands, actual results and measured timings; classify the load-related
timeout as a supported diagnosis, not proof that runtime performance was audited.
Record the single local 5000ms-to-15000ms timeout change and unchanged assertions.

Artifact status must be READY_FOR_REVIEW. Record zero credit and Gate C
NOT_VERIFIED. GitHub required checks, promotion and long-term stability remain
NOT_VERIFIED unless new evidence establishes them. Do not claim reviewer PASS.

Use the actual implementation verification already performed. Verify evidence
bindings, report artifact digest and git diff --check. Additional full-suite runs
are needed only for changed code or unresolved failures; do not invent repetitions.

Commit the artifact/report, then report the resulting evidenceCarrierSha in the
handoff. Do not embed that commit's own SHA in files contained in the commit.
Return branch, base, implementation SHA, carrier SHA, artifact digest, changed
paths, commands/results and clean status. Push the task branch for independent
review; do not create a role-stage PR or a Promotion PR.

Reviewer A then verifies the exact carrier, scoped diff, hashes, ancestry,
timeout justification, assertions and fresh focused/full-suite results. A review
PASS does not substitute for GitHub required checks at promotion time.
