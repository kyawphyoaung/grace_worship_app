import { differenceInCalendarDays, parseISO } from "date-fns";

/** Unique YYYY-MM-DD activity dates, already sorted ascending. */
export function computeStreaks(dates: string[]): {
  current: number;
  best: number;
} {
  const unique = [...new Set(dates)].sort();
  if (unique.length === 0) {
    return { current: 0, best: 0 };
  }

  let best = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const gap = differenceInCalendarDays(
      parseISO(unique[i]),
      parseISO(unique[i - 1]),
    );
    if (gap === 1) {
      run += 1;
      best = Math.max(best, run);
    } else if (gap > 1) {
      run = 1;
    }
  }

  const today = new Date();
  const last = parseISO(unique[unique.length - 1]);
  const daysSinceLast = differenceInCalendarDays(today, last);

  // Gentle: streak still counts if last activity was today or yesterday
  let current = 0;
  if (daysSinceLast <= 1) {
    current = 1;
    for (let i = unique.length - 1; i > 0; i--) {
      const gap = differenceInCalendarDays(
        parseISO(unique[i]),
        parseISO(unique[i - 1]),
      );
      if (gap === 1) current += 1;
      else break;
    }
  }

  return { current, best: Math.max(best, current) };
}
