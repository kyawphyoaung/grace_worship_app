import { differenceInCalendarDays, parseISO } from "date-fns";
import { ANNIVERSARY_DATE } from "@/lib/config";

export function getTogetherDuration(now = new Date()) {
  const start = parseISO(ANNIVERSARY_DATE);
  const totalDays = Math.max(0, differenceInCalendarDays(now, start));

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) {
    return { totalDays: 0, years: 0, months: 0, days: 0 };
  }

  return { totalDays, years, months, days };
}
