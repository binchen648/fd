# Arthur SC3 scoped Candidate — independent review

- Date: 2026-10-23
- Reviewer: independent GPT-6 Sol Candidate Reviewer
- Candidate commit: `96d3951b5b2d5bf8a3e0da35a32006e6bf50125e`
- Exact base: `31c389e607e9bd192d02169486f0b5fd2672d394`
- Verdict: **MIGRATION_ACCEPTED (SC3 scoped subset only)**

The previous provenance blocker is resolved. The Candidate JSON records `candidateReviewerCommit=null`, `candidateReviewerStatus=PENDING_INDEPENDENT_CANDIDATE_REVIEW`, and `noCandidateOrPr=false`. Its report identifies `362357c0a754c8719f285393171f212926758bd4` as the formal decision reviewer only, and explicitly awaits an independent Candidate review. The separate formal decision `642d73609efb1884fc2781b7268f02fe78872b6d` accepts only the scoped prior-contract subset.

The Candidate preserves precisely P3-R12/B18 (optional post-result controller VP +1), P3-R13/B19 (independent cost >=4 sibling VP +1), P3-R29/FB2-10 (active-source, same-battlefield engaged-opponent Magic attack currentPower set to zero for this round), and P3-R30/FM03 (exact ten-member boundary). The Arthur archive contains exactly one card, SC3, with the three corresponding contract labels. The focused FM03 test lists ten members including Arthur; its execution fixtures do not establish Arthur-specific runtime behavior.

Candidate canonical/legacy IDs, name, exact printed text, source locators, full-text SHA-256, and three clause SHA-256 values match the frozen inventory and archive. Recomputed text hashes match the Candidate. The archive SHA-256 is `AEA296C33671ECC73F37FC1343CE7E72EB44CE2ED5EAA9528D8DFF1489BC171C`; the focused test SHA-256 is `C54FE72AC32FD954E236986243EAC7C26066A79A21118ED76870BC8A0E7BFB00`.

The five cited historical commit objects (F1, R12/B18, R13/B19, R29/FB2-10, R30) all fail local `git cat-file` resolution. The Candidate accurately treats them as provenance references corroborated by checked-in archive, test, and reports, without claiming raw-object verification.

The frozen inventory still marks SC3 `BLOCKED`, `SOURCE_EVIDENCE_REQUIRED`, `SEMANTIC_SOURCE_REQUIRED`, `EXPLICIT_BLOCK`, `currentRoute=none`, empty inherited/partial acceptance contracts, and `reference.hasAuthoringCard=false`. SC1 and SC2 retain their blocks. Owner credit remains zero and owner unlock false. No current route, playable status, restore readiness, or runtime inference is accepted.

The diff from exact base to Candidate changes only the two Candidate docs files. `git diff --check` passes. No runtime, inventory, archive, test, pack, generated, or roster file is changed. This acceptance applies solely to the Arthur SC3 scoped Candidate record; it does not authorize implementation or owner-level promotion.
