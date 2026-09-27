# P3-B Sitonai Source Skill Attack Join Capability Result

Role: Codex B
Status: `IMPLEMENTATION_REVISION_READY_FOR_FRESH_R`
Date: 2026-09-27
Base: `e92cb3a08392619b0e8f47504f8e1c751b7b504d`
Classification: bounded zero-credit capability/readiness prerequisite for current owner `servant.sitonai`

## Why this capability is required

While resuming `P3-S-OWNER-SITONAI-COMPLETE-MIGRATION`, locked Reference recertification exposed one remaining generic runtime gap for `sc-sitonai-1`.

Locked Reference `joinOwnedCardToAttack` distinguishes **joining an attack** from **playing a card**. It:

- requires an owned source card in the permitted source zone;
- charges an explicit ability mana cost;
- moves the physical source card to attack and makes it face-up/active;
- records zero ordinary paid play cost;
- does not emit ordinary card-play triggers.

Current-main `move_source_card` only moves zone and does not activate the joined card. Current-main `play_source_card` is hand-only and emits ordinary `on_use_declared` / `on_card_played` events. Either composition would therefore change the locked source semantics.

## Implemented generic seam

New primitive: `join_source_skill_card_to_attack`.

The loader/runtime whole-ability gateway accepts only a generic data-driven shell:

- `phase_action` in `action` / `controller_action_window`;
- exactly one accepted `controller_active_attacks_exact_distinct_attribute_pair` condition;
- exactly one positive fixed controller mana cost;
- exactly one `join_source_skill_card_to_attack` effect;
- no targets/creates/rule modifiers/lifecycle/limit/visibility widening;
- automatic execution with no host operations and the standard decline response contract.

The privileged primitive is recursively detected through nested wrappers. A malformed or widened occurrence fails closed in the loader, and the runtime rechecks the whole-ability semantic against compiled-pack corruption.

At execution, the server requires an owned/controlled, inactive, face-up skill-zone physical source. The result is a public active attack-area card with `paidManaOnPlay=0`. It does not increment card-play counters or emit ordinary play events.

## R1 revision closure

Fresh independent Reviewer retry on predecessor Candidate `a79cff1d2e91515d5a638a2e063415cb340f3d08` returned `IMPLEMENTATION_NEEDS_REVISION` with one blocking shared-runtime finding (`https://github.com/binchen648/fd/pull/464#issuecomment-5853233206`).

The predecessor join implementation stamped `playedRound=current` even though locked Reference explicitly distinguishes joining from card play. That could make the joined servant-skill attack satisfy existing `played_this_round` consumers, including the already-migrated Sigurd refund selector.

The revision closes that finding without changing the bounded capability surface:

- joining no longer writes current `playedRound`;
- an existing genuine prior `playedRound` value is preserved exactly;
- if runtime state for the skill-zone source is absent, the join creates a valid non-current `playedRound` state rather than forging current play provenance;
- `paidManaOnPlay=0`, public/face-up/active attack state, authored ability mana payment, zero ordinary play count/counters, and absence of ordinary play events remain unchanged;
- focused regression starts the skill-zone source with non-current provenance and asserts it remains non-current after join;
- the existing Sigurd-style `played_this_round` regression now includes a joined-but-not-played servant-skill attack and proves it is excluded from refund candidates while a genuinely played same-battle attack remains eligible.

## Scope boundary

- `data/authoring/**` remains unchanged; zero Sitonai consumer migration occurs in this task.
- No character/card-name/printed-text/Chinese-text identity routing was added to production runtime.
- No SkillLib fallback or runtime source-text parsing was added.
- This task is permanently zero-credit; strict formal accounting remains `132/944`, remaining `812`.
- ACCEPTED must be synchronized and execution must return to the same `servant.sitonai` owner for `sc-sitonai-1 + sc-sitonai-2`.

## Verification

- focused source-skill attack-join capability: `5/5 PASS`;
- adjacent capability/legacy play chain: `4 files / 22 tests PASS`;
- R1 exact closure set (join capability + Sitonai readiness + Sigurd revealed-source): `3 files / 19 tests PASS`;
- affected serial chain (`authoring-interpreter`, `executable-card-pack`, `match-session`, `resolution-dataflow`, Sitonai readiness, join capability, Sigurd revealed-source): `7 files / 155 tests PASS`;
- typecheck: PASS;
- content validate: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- content compile: PASS — same summary;
- generated-content determinism: PASS;
  - content `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- Base-to-worktree `git diff --check`: PASS;
- `data/authoring/**` delta: EMPTY;
- production diff identity-routing audit for `servant.sitonai`, `sc-sitonai`, `志度内`, `连携打击`, `冻结吧`, `SkillLib`: CLEAN / zero hits.
