# P3-A FM09 contract correction / authoring handoff

Status: `CONTRACT_CORRECTION_REQUIRED`; this report supersedes the prior FM09 ten-source authoring candidate for planning purposes. It is not credit, acceptance, A-sync, or merge.

## Frozen F1 determination

The prior ten-ID list incorrectly treated every related skill as an identity-free `core.game-start-add-skill` source. Re-reading the frozen F1 clauses and locked Reference shows that only the following seven sources have the shared game-start provisioning shape:

| source | game-start target | F1 locator | decision |
| --- | --- | --- | --- |
| `master.bazett.skill.s1` | `master.bazett.skill.s2` | `masters[16].skills[0].text#line=1` | retain shared FM09 |
| `master.ciel.skill.s1a` | `master.ciel.skill.s2` | `masters[24].skills[1].text#line=1` | retain shared FM09 |
| `master.fujino.skill.s1` | `master.fujino.skill.s3` | `masters[65].skills[0].text#line=1` | retain shared FM09 |
| `master.shiki-ryougi.skill.s1` | `master.shiki-ryougi.skill.s2` | `masters[64].skills[0].text#line=1` | retain shared FM09 |
| `master.shiki-ryougi.skill.s1a` | `master.shiki-ryougi.skill.s3` | `masters[64].skills[1].text#line=1` | retain shared FM09; FB2-23 interaction remains a target dependency |
| `master.shiki-tohno.skill.s1` | `master.shiki-tohno.skill.s2` | `masters[27].skills[0].text#line=1` | retain shared FM09 |
| `master.shirou-emiya.skill.s2` | `card.derived.master.shirou-emiya.ganjiang-moye` | `masters[2].skills[1].text#line=1` | retain shared FM09; derived target excluded from frozen 944 |

The following prior members must not be authored as shared game-start provisioning:

- `master.caules.skill.s1`: F1 is the owner-specific `core.caules-forvedge-bioelectromancer` handler. It does not provision s2 and s3 together at game start. S3 is added by s2's combat-phase overcharge path and requires a later owner/runtime task.
- `master.fujino.skill.s2`: F1 s2 is the later active-space effect; s1 only adds s3. Remove s2 from FM09's game-start target set.
- `master.shiki-nanaya.skill.s1`: F1 says the controller possesses Mystic Eyes; it does not declare a game-start card addition. s2 requires separate owner/runtime semantics.
- `master.zouken.skill.s2`: F1 grants creator/obsession status; it does not provision s3 or s4. Those cards require separate static/owner semantics.

Thus the corrected shared FM09 denominator is six frozen targets, not eleven, plus one derived Shirou target outside the 944 denominator. The exact frozen IDs, static metadata, and source references must be rebuilt from F1/Reference before any new candidate.

## Required follow-up

1. A-owned correction must replace the prior ten-ID contract and target count.
2. Owner-specific Caules, Nanaya, and Zouken work must be dispatched separately; Fujino s2 belongs to the later Fujino s3 activation path.
3. Do not send the prior Candidate `e59d2d5ba1b67d9bd164afbbc113c29e6591e173` to Reviewer as FM09 acceptance evidence.
4. The attempted loader/metadata changes were reverted; no runtime, pack, generated, or Candidate content was changed by this correction turn.
