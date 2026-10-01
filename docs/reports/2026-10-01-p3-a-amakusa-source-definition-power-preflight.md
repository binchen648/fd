# P3-A Amakusa formal-preflight source-definition correction

Date: 2026-10-01
Base: `670366deb02bf265d4daf867ace4120bc0d84ec4`
Formal task: `P3-S-OWNER-AMAKUSA-COMPLETE-MIGRATION`

Formal preflight mechanically resolved the frozen ascension clause `【开演之时已至，此处应有雷鸣般的喝彩】激活时，你的基础牌获得威力+4。` to locked Reference definition `servant.shakespeare.skill.sc-shakespeare-3`, not to an event card.

Locked Reference static evidence for that definition is: servant skill, `魔术/宝具`, cost 6, requirement 8, base Power 1. Current canonical Shakespeare authoring contains only `sc-shakespeare-1`, so this transaction must not materialize Shakespeare sc3 or award cross-owner credit.

The accepted #515 event-placement path remains valid as a generic capability but is not the frozen source consumer for this Amakusa clause. Formal materialization therefore stops before any `data/authoring/**` write rather than inventing an event ID.

Existing trusted `on_card_played` events carry the physical played `sourceCardId` and server-owned `playedCards` facts; the executable pack can recover its exact definition. The required follow-up is a bounded source-definition play watcher that grants +4 basic-attack Power only while that exact played physical source remains live.

No migration credit. Accounting remains `189/944`, remaining `755`. No formal Candidate has been created.