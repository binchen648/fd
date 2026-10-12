# B11 Writer Reservation

Planner formally grants session-authority/server-transport exclusive write
ownership to P3-E09-B11-TRANSPORT-SECURITY-REPAIR / Codex B.
This is a new prospective reservation, not proof of past ownership or a
statement that all other conversations have acknowledged it.

Authoritative record:
docs/agents/manifests/reservations/P3-E09-B11-TRANSPORT-SECURITY-REPAIR.json.
Read it from the published exact Planner commit/ref reported in the handoff,
not from an older main checkout. No operating Control CLI or atomic machine
lock registry was identified in the inspected main/Planner files; do not wait
for a nonexistent path or treat this document as an enforced filesystem mutex.
This record is the Planner-issued reservation requested by the worker.

Other Planner-controlled tasks are not authorized to start overlapping writes.
Reviewers stay read-only for source; A/G can continue non-overlapping evidence
and governance work. Unknown external writers are not claimed to be controlled.
Preserve and report any actual conflict; never reset an existing worktree.

## B Activation

1. Fetch the published Planner ref and verify the exact reservation record.
2. Create a clean independent branch/worktree from
   463facb109cc4d19c4fda7af936fb4546fb86091.
3. Return task ID, reservation ID, actual branch, absolute worktree, exact base,
   clean status and acknowledgement that this is the sole designated B writer.
   No prescribed branch name or directory is claimed to already exist.
4. If no actual conflicting ownership/modification is known, this grant plus
   the owner's binding authorizes implementation under the existing repair
   contract. No additional round of all-worker confirmations is required for
   this source reservation. Do not claim that such confirmations were received.
5. Report a concrete conflict if found; do not revert another worker or enlarge
   scope. Keep the reservation until Planner explicitly releases/transfers it.

B may acknowledge in its working conversation and then proceed; include that
same binding in the final repair artifact. A separate commit, PR or A sync is
not required merely to acknowledge the lock. Heavy-test coordination remains
separate and is not granted by this source reservation.

This record does not grant acceptance, promotion, credit or main Epoch change.
