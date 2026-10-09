# PR445 Negative Gate Review

Verdict: FAILED, exact candidate negative gate. Early blocking disposition,
not exhaustive clearance of all 22 changed paths or formal contract escalation.
Producer: Codex Automation Review Owner. Main credit: NO.

Candidate: `658849d1602bd4b705a924f6aa649e973d9d65ca`.
Base: `5c8e21c853ac95a1b0ee42e28108ae40692491cf`.
Source: `aa04a12e1647560374e09f7e2b6e62a5dccd0954` (#422).
Main inspected: `9a1689d2ec5b56b67d1483d2593b4ab809d6c15c`.

## Blocking Finding

P2: opponent-close-to-one.ts:23 converts non-record visibility into an empty
object before validation. Authoring visibility string, array, boolean and number
all pass raw gateway, produce zero loader issues, classify as compiled accepted,
and activate through dispatchAbilityCommand. Empty-object positive control passes.
Exact envelope must reject malformed supplied fields before normalization.

The source and candidate classifier use identical blob
`5cee2ff7c9fbb898d386489c8eb5903c76e161a1`. The replay adds it relative to its
base; it inherits rather than originally invents this defect. No current-main
runtime verification or external-client exploit is claimed.

## Independent Verification

- typecheck PASS; focused 4 files / 89 tests PASS.
- full official CI with maxWorkers=2: 132 files / 924 tests PASS.
- server suite: 1 file / 5 tests PASS.
- content validation: 7 masters / 7 servants / 20 events / 0 blockers.
- generated determinism PASS; candidate checkout remains clean.
- probe review-445-visibility.mjs: exact SHA guard, valid control PASS,
  four malformed cases FAILED, expected exit1.

Run probe from exact candidate cwd after npm ci and npm run typecheck:

```powershell
node --import tsx <review-root>/docs/reviews/probes/review-445-visibility.mjs
```

The previous in-progress artifact remains historical evidence of work performed
before this finding; this review and batch02 supersede its pending technical
disposition. Old CONTRACT_CONFLICT is not automatically confirmed or cleared.
Optional participant/power restore reconstruction still needs contract disposition
and targeted recertification for any revised candidate. No source fix or remote
review comment was submitted. A new SHA requires a new independent review.
