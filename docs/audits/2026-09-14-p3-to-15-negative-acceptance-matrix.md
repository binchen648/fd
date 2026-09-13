# P3-TO-15 Modifier / Power Negative Acceptance Matrix

| # | Invalid / adversarial case | Required result |
|---:|---|---|
| 1 | missing source card instance | reject, no mutation |
| 2 | missing source ability | reject, no mutation |
| 3 | source controller/provenance stale | reject, no mutation |
| 4 | source-bound modifier lacks accepted source-validity policy | reject admission |
| 5 | persistent modifier lacks accepted Lifecycle duration/reset policy | reject admission |
| 6 | unknown modifier axis | reject admission |
| 7 | unsupported operation | reject admission/runtime |
| 8 | unsupported operation + rule pair | reject |
| 9 | numeric value is NaN/Infinity | reject |
| 10 | undeclared formula variable supplied by client | reject |
| 11 | runtime parses translated text to obtain rule/scope/value | reject design |
| 12 | card/ability ID decides generic modifier eligibility | reject design |
| 13 | unowned `modeState` key is final modifier authority | reject design |
| 14 | priority missing where `set/add/multiply` order matters | keep runtime slice blocked |
| 15 | object/map iteration order chooses semantic priority | reject design |
| 16 | lexical card/ability ID ordering chooses semantic priority | reject design |
| 17 | stale replay installs same modifier twice | reject/idempotent, one install only |
| 18 | reconnect reinstalls modifier | reject/idempotent |
| 19 | source close removes modifier twice | reject/idempotent |
| 20 | transform silently transfers modifier by same definition/name | reject without reviewed transfer contract |
| 21 | failed install leaves lifecycle state but no modifier | atomic rollback |
| 22 | failed mandatory source-close teardown leaves source moved but modifier alive | atomic rollback |
| 23 | later command failure rolls back earlier committed modifier | forbidden cross-command rollback |
| 24 | rule-legality modifier is injected into numeric Power Trace despite no power effect | reject classification |
| 25 | power-facing modifier omits canonical layer | reject admission/runtime |
| 26 | complex calculation records only final number | insufficient Gate evidence |
| 27 | trace line lacks stable source identity | reject trace |
| 28 | trace output cannot be reconstructed from input/operation/operand | reject trace |
| 29 | terrain multiplier mutates total power without terrain-layer provenance | reject design |
| 30 | situation/event reversal uses string label rather than typed source class | reject design |
| 31 | hidden source identity appears in unauthorized projection | reject projection |
| 32 | private source is redacted server-side so authoritative trace loses provenance | reject architecture; redact projection only |
| 33 | final power differs while trace claims unchanged inputs | reject invariant |
| 34 | duplicate trace line from replay double-applies value | reject/idempotent |
| 35 | Battle Result recomputes power with a different modifier owner | reject owner split |
| 36 | Battle Result accepts power with no authoritative trace when complex modifiers apply | reject Gate evidence |
| 37 | current runtime store order is treated as canonical rules priority without reviewed policy | reject specification/runtime claim |
| 38 | old `24 modifier` denominator used after current semantic-axis proves 25 | reject evidence |
| 39 | old `18 power` risk set is mislabeled as current generated semantic-axis | reject evidence |
| 40 | Artoria/Tomoe implementer evidence is promoted to family-wide runtime acceptance | reject Gate claim |

Failing single-command mutations preserve modifier/lifecycle/card/resource/terrain/battle/pending/log/revision state unless a separately committed earlier command is explicitly part of the reviewed transaction boundary.

## r1 Addendum — Typed Canonical Payloads And Projection Separation

The reviewer must additionally reject:

- any canonical scope containing `unknown`/arbitrary constraint objects;
- any modifier value carried as an arbitrary object rather than finite literal or compiler-normalized numeric-expression reference;
- unrecognized subject/object/constraint/applicability policies reaching runtime storage;
- a Power Trace that redacts or deletes provenance in the authoritative server record;
- a projection policy that cannot represent authorized/controller-only source visibility separately from public/redacted viewers;
- reconnect that restores only a redacted projection as if it were authoritative trace state.

## r2 Addendum — RULE/EFFECT Axis Separation

The reviewer must additionally reject:

- any canonical schema that requires an ability-level `EFFECT_MODIFIER` to pretend its whole effect is one rule operation;
- an effect modifier without a typed reviewed `effectPolicyId`;
- an effect owner that absorbs movement, VP transfer, random discard, Card Zone, branching, status, or other non-modifier semantics merely because the ability also has modifier output;
- a modifier contribution that lacks its own operation/rule-or-layer/scope/value/priority validation;
- branch effects that lose original transaction ordering when only one branch emits a power contribution.
