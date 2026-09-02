export function formatMoney(value: number) {
  return `TZS ${new Intl.NumberFormat("en-TZ").format(value)}/=`;
}