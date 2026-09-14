# P3-TO-08 Resource Numeric Current-Lineage Independent Review

- Document Role: `INDEPENDENT_REVIEW`
- Reviewer: Codex R
- Task: `P3-TO-08` / `RESOURCE_NUMERIC_CORE_DIRECT_ACTION`
- TargetCommit: `b63376ca0ebc3fc005405a385e6f1b438b6295c1`
- A05 reviewer packet: `docs/reports/2026-09-12-p3-a05-resource-numeric-reviewer-packet.md`
- Historical reachable Gate C hardening: `b1a1dc8eb7c90616d4bf4ecd7d02fae04a78c43e`
- Review Branch: `codex/r-p3-to08-resource-current-review`
- Final Status: `IMPLEMENTATION_NEEDS_REVISION`

## Findings

### [P1] Current integrated Resource command path accepts a missing expected revision

The current integrated baseline does not descend from the reachable Resource Gate C hardening commit `b1a1dc8`. That historical hardening made mutating room commands require `expectedRevision` and added missing-revision server/E2E evidence. The current TO13/A03 lineage instead has an optional `MatchRoomHub.dispatchCommand(..., expectedRevision?: number)` and `assertExpectedRevision` returns without checking when the revision is absent unless the command happens to be a server-owned TO13 interaction.

This is a Resource Gate C integration regression because the command-spell Resource representative is an `activate_ability` command, not an Interaction `choose_target` command.

Fresh reviewer probe on the exact target used the production `MatchRoomHub -> MatchRoom -> MatchSession -> ability runtime` path and sent Gatou `command-spell.gain-mana` with no expected revision.

Observed result:

```text
before:
revision=2
mana=8
commandSpells=3
logs=30
replay=2
roomVersion=3

missing expectedRevision dispatch:
result.ok=true

 after:
revision=3
mana=12
commandSpells=2
logs=33
replay=3
roomVersion=4
```

The missing-revision command therefore performed the full authoritative mutation instead of failing closed.

The TypeScript wire type currently marks `client:dispatch_command.expectedRevision` as required, but that does not close the runtime boundary: `parseSocketMessage` parses arbitrary JSON with a type assertion, and `handleClientMessage` forwards a missing field to the Hub. The authoritative Hub must enforce the revision independently of client typing.

**Required repair:** every `client:dispatch_command` / corresponding authoritative Hub dispatch must reject a missing expected revision before room mutation. Add a current-lineage server or room-boundary negative test and extend the Resource browser/WS proof with a raw missing-revision command. Preserve TO13 interaction CAS behavior.

## Gate A / Gate B observations

No Gate A/B blocker was found in this review before the Gate C blocker stopped promotion.

Fresh current-lineage verification:

```text
npm.cmd run typecheck
PASS

Resource focused set:
resolution-dataflow.test.ts
resource-numeric-core-direct-action.test.ts
executable-card-pack.test.ts
3 files / 43 tests PASS

@fd/server
1 file / 2 tests PASS
```

The scoped Resource semantic route remains structural rather than routed by Gatou/Olga/Tomoe identity. The only static `command-spell.gain-mana` match found in the reviewed core files is the canonical default command-spell content definition in `defaultCommandSpellCard`; it is not an eligibility branch.

The existing three exact eligible consumers remain the A05 packet scope:

1. Gatou command spell gain mana / spend one command seal;
2. Olga-Marie command spell gain mana / spend one command seal;
3. Tomoe Independent Action VP adjustment.

No broader Resource Numeric family inheritance is judged here.

## Existing Gate C test result and coverage gap

The existing current-lineage Resource Playwright spec remains green:

```text
fd-command-spell-resource-core.spec.ts --repeat-each=5
5/5 PASS
```

It proves its authored positive path plus reconnect and stale-revision rejection, but it does not send a missing-revision resource mutation. Therefore the 5/5 result does not contradict the P1 finding; it demonstrates a test coverage gap.

The current spec still starts from a restored already-running action-phase fixture. The A05 packet already scopes this correctly and does not treat it as proof of browser-driven room creation/seat selection/match start/phase progression. The historical `b1a1dc8` branch contained a stronger full-browser setup, but that commit is not an ancestor of the current accepted runtime lineage and cannot be inherited as current Gate C evidence.

## Integration ancestry

Fresh ancestry check:

```text
b1a1dc8 -> b63376c : false
```

The current lineage does contain the earlier Resource runtime/Gate C work, but not the later missing-revision hardening. Independent review must judge the current integrated behavior, not a detached historical branch.

## Gate Judgment

- Gate A: **NOT PROMOTED** in this review; focused evidence is green but final promotion is held with the blocked batch.
- Gate B: **NOT PROMOTED** in this review; focused evidence is green but final promotion is held with the blocked batch.
- Gate C: **FAIL** — missing `expectedRevision` is accepted for the Resource representative and mutates authoritative state.

## Final Judgment

`IMPLEMENTATION_NEEDS_REVISION`

Do not synchronize TO08 as accepted and do not count its three consumers as newly reviewed/accepted from this review.

A repair should start from the current exact integrated baseline, close only the authoritative revision boundary and missing-revision evidence gap, preserve TO13 behavior, and then receive a new fresh independent review.
