const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0 });

export const money = (n: number) => eur.format(Math.round(n * 100) / 100);

/** Adds working days (Mon to Fri) to a date. */
export function addWorkingDays(from: Date, days: number) {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left--;
  }
  return d;
}

const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
export const shortDate = (d: Date) => dayFmt.format(d);

export const deliveryWindow = (days: readonly [number, number], from = new Date()) =>
  `${shortDate(addWorkingDays(from, days[0]))} to ${shortDate(addWorkingDays(from, days[1]))}`;

export const assetUrl = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`;
