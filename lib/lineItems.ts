// Only items in a category billed by weight ('per_kg' pricing mode, i.e. the
// Kilograms category) carry a meaningful weight — everything else is billed
// flat per item (unitPrice * quantity) and has no weight to show.
export function formatLineItemQty(weightKg: number | null | undefined, quantity: number): string {
  return weightKg != null ? `${weightKg} kg (${quantity})` : `(${quantity})`;
}
