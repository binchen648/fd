# P3-A Ryougi S3 Recovery Feasibility

Date: 2026-09-18
Role: Codex A
Status: `FEASIBILITY_CLOSED`
Base: exact post-R48 acceptance synchronization `e8c312986d9d01c9e28e3e70309c925f6f6a5f4b`
Target: exactly `master.shiki-ryougi.skill.s3`

## Source grounding

F1 `59f145434695d29bdd17e4cb3adc887e84182377` is semantic/provenance authority. It gives exact identity `master.shiki-ryougi.skill.s3`, owner `master.shiki-ryougi`, name `死・紧握`, and printed text:

- `此牌需追加打出。` (sha256 `b8948b29606c56ee673f234c17afe98448ae3986ee1a6155b5b827e23096a239`)
- `行动阶段：查看一名与你位于同一战场的玩家的手牌，你可将其中一张牌洗回其所有者的牌库。` (sha256 `c3554f0f6f966f69aa14816bcba99bb291db64c13b4ca8f345a74fd4619c95c4`)

Combined source text sha256 is `49bfaa05b153321ecdc5a317f257a228d8f9f16c5afcf337b69ea526bad90110`.

Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` is used only for stable static metadata/source locator: legacy id `s3`, type label `魔术`, cost `1`, base Power `0`, legacy requirement `1`, source locator `master.shiki-ryougi/两仪式`. Reference runtime/handler syntax is not inherited.

## Accepted semantics available

Current accepted recovery lineage already contains all required generic behavior:

- required-additional/append-only play: P3-R42 / FB2-16;
- outside-game initial placement: P3-R43 / FB2-18;
- master support-only registration: P3-R44 / FB2-19;
- exact same-battlefield private hand inspection / optional return-one-to-owner-deck interaction: P3-R48-R2 / FB2-23.

The F1 phrase is “一名与你位于同一战场的玩家”, not “对手”; the implementation must not add an opponent-only restriction.

## Fresh feasibility probe

A fresh uncommitted probe on exact Base modeled one support-only archive/card using only the accepted generic contracts above. No production rules source or MatchSession change was made. Probe result:

- `npm ci --offline`: PASS, 239 packages / 0 vulnerabilities;
- typecheck: PASS;
- content validate/compile: `7 masters / 7 servants / 20 events / 0 blockers`;
- generated determinism: PASS;
- FB2-23 interaction regression passes;
- executable compiler only failed the expected aggregate assertion `72 -> 73`; after a probe-only aggregate `73`, focused interaction + compiler was `2 files / 60 tests PASS`.

The probe therefore found no additional runtime/compiler prerequisite.

Probe product/material:

- content library hash: `cfb99f7fb7d98c0f7a0492796363884221b1f5d654e27feee1a1748d1c97d0f1`;
- fixture hash unchanged: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence hash unchanged: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- material `101 archives / 136 cards / 237 abilities`;
- compiled `73 cards / 14 characters / 0 blockers`;
- buckets `22/3/131/0/81/130`;
- automation audit `131/3/81/20`;
- frozen denominator `944`; canonical authoring overlap `113/944`; duplicate canonical IDs `0`; exact target included.

All probe edits and generated reporting artifacts were restored; the feasibility worktree returned clean before dispatch docs were written.

## Decision

No further generic infrastructure task is required. Dispatch one exact frozen migration: `P3-FB2-24-RECOVERY` for only `master.shiki-ryougi.skill.s3`. Candidate material may be `113/944`, but accepted recovery overlap stays `112/944` until fresh independent R49 and post-review A acceptance synchronization.
