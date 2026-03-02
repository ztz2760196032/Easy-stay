const DAY_MS = 24 * 60 * 60 * 1000;

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(input: string, days: number): string {
  const date = new Date(`${input}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

export function calcNights(checkIn: string, checkOut: string): number {
  const inMs = new Date(`${checkIn}T00:00:00`).getTime();
  const outMs = new Date(`${checkOut}T00:00:00`).getTime();
  const nights = Math.round((outMs - inMs) / DAY_MS);
  return Number.isFinite(nights) && nights > 0 ? nights : 1;
}

export function ensureValidRange(checkIn: string, checkOut: string) {
  if (!checkIn && !checkOut) {
    const today = formatDateInput(new Date());
    return { checkIn: today, checkOut: addDays(today, 1) };
  }

  if (!checkIn) {
    const fallback = addDays(checkOut, -1);
    return { checkIn: fallback, checkOut };
  }

  if (!checkOut || new Date(checkOut) <= new Date(checkIn)) {
    return { checkIn, checkOut: addDays(checkIn, 1) };
  }

  return { checkIn, checkOut };
}
