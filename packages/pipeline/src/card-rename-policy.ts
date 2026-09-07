export function buildRenamedCardFileName(input: {
  card_name: string;
  cost: number | null;
  power: number | null;
  displayed_cost_power_confirmed: boolean;
}): string {
  const safeName = sanitizeFileName(input.card_name);
  const hasStableDisplayedPair = input.cost !== null && input.power !== null && input.displayed_cost_power_confirmed;

  return hasStableDisplayedPair ? `${safeName}(${input.cost}／${input.power}).png` : `${safeName}.png`;
}

function sanitizeFileName(value: string): string {
  const sanitized = value.replace(/[<>:"/\\|?*]/g, "_").trim();
  return sanitized.length > 0 ? sanitized : "unnamed-card";
}
