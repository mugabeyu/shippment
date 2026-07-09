// Phone items are priced per unit, not per kilogram, so their weight is noise on
// screen — hide it wherever a line item's quantity/weight is displayed. The
// underlying price math (unitPrice * weightKg * quantity) is unaffected.
const NO_WEIGHT_ITEM_PATTERN = /t[ée]l[ée]phone/i;

export function itemHasVisibleWeight(itemName: string): boolean {
  return !NO_WEIGHT_ITEM_PATTERN.test(itemName || '');
}

export function formatLineItemQty(itemName: string, weightKg: number, quantity: number): string {
  return itemHasVisibleWeight(itemName) ? `${weightKg} kg (${quantity})` : `(${quantity})`;
}
