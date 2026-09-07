import type { PhaseName } from "../schema/game";

const phaseOrder: PhaseName[] = [
  "round_start",
  "preparation",
  "advance",
  "action",
  "battle",
  "cleanup",
  "round_end",
];

export interface PhaseContext {
  activePlayerSeats: number[];
  eliminatedPlayerSeats: number[];
}

export interface PhaseTransition {
  from: PhaseName;
  to: PhaseName;
  opensWindow: boolean;
}

export function getInitialPhase(): PhaseName {
  return phaseOrder[0]!;
}

export function getNextPhase(current: PhaseName): PhaseName {
  const currentIndex = phaseOrder.indexOf(current);

  if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
    return phaseOrder[0]!;
  }

  return phaseOrder[currentIndex + 1]!;
}

export function buildTransition(current: PhaseName): PhaseTransition {
  const next = getNextPhase(current);

  return {
    from: current,
    to: next,
    opensWindow: next !== "round_start",
  };
}

export function getEligibleActionSeats(context: PhaseContext): number[] {
  return context.activePlayerSeats.filter(
    (seat) => !context.eliminatedPlayerSeats.includes(seat),
  );
}
