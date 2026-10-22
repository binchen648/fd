# Altera FORMAL/A S3 contract reconciliation — independent review

- Date: 2026-10-22
- Reviewer: independent GPT-6 Sol
- Target repository: `https://github.com/binchen648/fd`
- Exact lineage base: `e1f995bba356433519b6c823cbeffe53d48cffb0`
- Preflight/proposal commit: `aa719f7`
- Decision commit reviewed: `f312db011c5dab4d603c35ce99d92bef42ff53f1`
- Verdict: **`CONTRACT_ACCEPTED_FOR_SCOPED_SUBSET`**

## Scope and findings

The FORMAL/A decision is accepted only as a record of the three already accepted, identity-free S3 structural contracts. It does not change frozen accounting, grant an owner-complete result, or authorize an Altera playable pack entry, Candidate, A-sync, or S1/S2 implementation.

`f312db0` adds only `docs/reports/2026-10-22-p3-b-altera-formal-contract-decision.md` relative to `aa719f7`. The exact base is its merge base. Relative to that base, the branch adds only the preflight, proposal, and decision reports. There is no frozen inventory, archive, runtime, pack, generated content, or test diff.

The checked-in frozen inventory SHA-256 is `FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`. Its S3 row identifies `servant.altera.skill.sc-altera-3`, legacy ID `sc_altera_3`, printed name `对魔力（saber class）`, and the exact three-line text reproduced in the decision. Its source locators are `src/content/generated/legacy-content.json#servants[16].skills[2].text#line=1..3`, `FD全卡图鉴V2.0.chm#从者/剑士/英文版/阿蒂拉.htm`, and `Fate_Domination-开发版#servant.altera/阿蒂拉`. The legacy-content file and original CHM/image are not present here; this review validates the frozen records and checked-in archive, without claiming fresh inspection of those original media.

Independent UTF-8 SHA-256 calculation from the parsed frozen text and clauses yields:

| Material | Verified SHA-256 |
| --- | --- |
| Entire S3 printed text | `8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc` |
| Noble Bloom base, line 1 | `1cef15482dd584d9d18b4e9016476b7bffb31cb0331efd38b4025a26611c84c2` |
| Extra VP, line 2 | `f0631437ce658c07be75426fc0394d6f32c6fafc10805bcb359ff17d4de97f85` |
| Magic Resistance, line 3 | `bd7530459d6ccd00217d1192b06509e322d48bafd44f037c383470ecbba55229` |

The archive `data/authoring/servants/servant.altera.json` has SHA-256 `207074DEAD8DF81C6FE7AFBA82F5A59C56E0FB391CF4242A9D40B103DDCEAF76`. It contains exactly one card, S3. Its printed text and each ability's printed clause match the frozen strings exactly. It retains the frozen clause locators and hashes, F1 evidence commit `59f145434695d29bdd17e4cb3adc887e84182377`, and static/reference metadata commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`. Its contract labels map the three abilities to P3-R12/B18, P3-R13/B19, and P3-R29/FB2-10 respectively.

The checked-in R12, R13, R29, and FM03 R30 review reports accept the narrow structural shapes and the ten-member FM03 authoring migration, including Altera S3. The historical candidate commit objects named in the decision are not available in this checkout; this review corroborates them through those checked-in reports, the archive, the current tests, and the current code. The decision does not depend on promoting a historical handler name or an unrelated repository pointer.

The archive conforms to the scoped contracts:

1. `sc-altera-3.noble-bloom`: combat optional post-result response; exactly one highest-cost Noble Phantasm condition and one typed controller VP `+1` effect.
2. `sc-altera-3.noble-bloom-extra-vp`: independent sibling response with the same condition plus cost threshold `value=4`, and one typed controller VP `+1` effect.
3. `sc-altera-3.magic-resistance`: active-source combat phase action in the controller combat-action window; exactly one `combat_power_modifier` setting `attack.currentPower` to `0` for same-battlefield engaged opponent attack cards with attribute `魔术`, lasting `this_round`.

The focused FM03 test SHA-256 is `C54FE72AC32FD954E236986243EAC7C26066A79A21118ED76870BC8A0E7BFB00`. It loads the Altera archive through the authoring loader, checks all three exact classifiers, verifies the Magic Resistance own/non-Magic/remote exclusions, and settles two independent typed `+1` VP responses at Noble Phantasm cost 4. The B18/B19/FB2-10 regression tests cover the related narrow classifier, replay, decline, expiry, and malformed-shape boundaries. A fresh run of these four files passed: **21/21 tests**.

## Retained blocks and non-effects

All three Altera frozen rows still say `semanticNormalization.status=BLOCKED`, `classificationRoute=SOURCE_EVIDENCE_REQUIRED`, `mappingStatus=EXPLICIT_BLOCK`, `currentRoute=none`, and `SEMANTIC_SOURCE_REQUIRED`; inherited and partial acceptance lists are empty. The decision records prior S3 contract evidence for a future governing synchronization; it does not assert that frozen accounting already changed. S1 and S2 have no accepted contract or authority to inherit S3's Resource, Power, trigger, modifier, card-zone, event-deck, or lifecycle behavior. The owner therefore remains **blocked**.

The active pack, generated content library, and generated evidence report match the recorded hashes `A99F36106BEBC187826D3E5151E6B28D5C55A39A41BE213685E21405AAA60D7E`, `B5527D19AEB8AFFF6812ACE8AD19EDC29F7CF74FD7ECEEAEFDAF1A498B1919D4`, and `5AAE65CE42DCBB393E307F50586E2C7BF53137C82B0C758D4953610527CE898A`; none contains an Altera registration. No runtime or generated artifact changed in the decision commit.

**Final verdict: `CONTRACT_ACCEPTED_FOR_SCOPED_SUBSET`.** Only the exact S3 three-shape reconciliation is accepted. Any accounting update requires a separate governing action, and S1/S2 remain source- and semantics-blocked.
