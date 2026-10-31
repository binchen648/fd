# A-ASSET-01 result

Base: b27b98019bcd253f25c1d74af82a81e74bacf5aa. Reviewed source candidate: d22570e0358946fa423000902cd5fd4a8090ffef. Status: IMPLEMENTATION_COMPLETE_CANDIDATE; final-head CI and user merge approval pending.

## Root causes and changes

The old asset assertion treated all 127 source archives as the approved playable roster. The pack explicitly selects fourteen archive paths (seven masters and seven servants); full-catalog rule analysis and intentional split owner archives do not expand playable admission. The corrected test uses exact pack paths, verifies selected path/owner uniqueness and exact approved IDs, and cross-checks generated admission. Full source-path uniqueness and non-admission of unknown owners remain tested; the two sanctioned split paths are explicitly outside the pack.

Fourteen known inline master skills fell through to generic placeholders although printed on existing owner overview cards. Explicit mappings restore those reviewed images; approved raw overview IDs now use reviewed entity art before legacy portraits. Five inline skills have direct imageIndex0 metadata; nine legacy skills were visually checked on source overview cards, with all fourteen independently checked by reviewer. No generic skill-prefix admission, content or image binaries changed.

Missing files, placeholders for approved cards, duplicate selected paths/IDs, unapproved content, escaping paths and unknown-skill fallbacks remain checked. The original failed assertion was repaired rather than deleted/skipped. Client tests are now an additional step after unchanged full test:ci, so asset regressions become a CI gate.

## Evidence and limits

External evidence: D:/fd-validation/a-asset-01-evidence-20261031. Original baseline asset tests: 7 PASS / 1 FAIL. Added real-art regressions: 7 PASS / 3 FAIL. A subsequent initial oracle incorrectly included sanctioned split archives; its 56 PASS / 2 FAIL log is preserved. Corrected producer and independent full client suites: 8 files / 58 PASS, natural exit 0. Typecheck and client build PASS. Actual seven-player local browser: 1 PASS, 78 unique image URLs with HTTP/content-type/PNG checks, printed conversion-magic inspection, no page errors. This asset test does not rerun or recertify the prior complete eleven-round browser game. Independent verdict TECHNICAL_PASS, no blocking findings.

No Runtime, server, authoring, generated content, reviewed manifest or image assets were modified. No migration/coverage credit or all-roster capability acceptance. Full release acceptance is limited to the measured gates; exact final-head CI remains required. The old frozen worktrees are preserved; shared Runtime has no active writer, CB-C02 remains suspended.
