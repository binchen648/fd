# P3-A Araya Owner Readiness Preflight

Base synchronization: `885118ab01e6d806ca68df07f81faaf59fa0051c`
Accounting: `194/944`, remaining `750`.
Frozen owner scope: `master.araya.skill.ascension`, `master.araya.skill.s1`, `master.araya.skill.s1a`.
Canonical authoring at preflight: `0/3`.

## Mechanical source result

- `s1` Triple Boundary is legacy `core.araya-triple-boundary`: per-location permanent +1 replacement terrain layers, max 5, active only while Araya is at that location; no new layer if both terrain slots were already occupied.
- `ascension` Paradox Spiral is legacy `core.araya-paradox-spiral`: at 5 bound terrain layers, controller alone gains effective Workshop identity; same-location opponents cannot exit and must include at least one face-down card in a standard attack; removing the source disables the rule.
- `s1a` Origin: Stillness is already SOURCE_GROUNDED through shared structured semantics (`origin-stillness-combat-end`) and needs no new identity-specific readiness seam.

## Readiness split

1. `P3-B-ARAYA-OWNER-READINESS-PERSISTENT-TERRAIN` — READY.
2. `P3-B-ARAYA-OWNER-READINESS-EFFECTIVE-WORKSHOP-RESTRICTIONS` — waits for terrain-core acceptance.

Both are permanently zero migration credit. Formal Araya consumer migration remains forbidden until all readiness subtasks are accepted and FORMAL completes a full-owner A-sync/rescan.