# P3-B Araya Origin Stillness printed-cost readiness result

## Scope
Bounded zero-credit generic capability discovered during formal Araya materialization.

## Frozen requirement
After authoritative battle end, select exactly one controller-owned/controller-controlled active face-up basic attack, shuffle that exact physical card into the controller deck, then gain mana equal to twice that card definition's printed mana cost. Existing paid-cost refund authority is not equivalent.

## Implementation
- exact forced after_battle_ended whole-ability gateway;
- exact card_instance target in attack_area, one selection;
- privileged effect recycle_active_basic_for_printed_cost_mana with printedCostMultiplier=2;
- candidates re-prove owner/controller, active face-up physical state and basic_attack definition;
- resolution revalidates selected physical, moves it to deck, shuffles, and uses shared grantMana with printed cardFace.cost x2;
- generic pending-decision restore validation re-computes exact candidate provenance;
- no Araya/card-name/printed-text production routing.

## Verification
- focused 6/6 PASS
- Araya readiness focused 21/21 PASS
- shared 132/132 PASS
- aggregate 153/153 PASS
- FD_TOOLCHAIN_OK
- typecheck PASS
- content validate: 11 masters / 19 servants / 20 events / 0 blocking issues
- generated determinism PASS
- data/authoring delta EMPTY
- production identity audit CLEAN
- git diff --check PASS

## Accounting
Zero migration credit. Strict accounting remains 194/944, remaining 750.
