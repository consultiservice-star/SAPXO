export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnits(amountMinor: number): number {
  return amountMinor / 100;
}

export function formatMoney(amountMinor: number, currency: string, locale: string = "en"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  }).format(fromMinorUnits(amountMinor));
}

export function addMoney(a: number, b: number): number {
  return a + b;
}

export function sumLineItems(items: { amountMinor: number }[]): number {
  return items.reduce((sum, item) => addMoney(sum, item.amountMinor), 0);
}
