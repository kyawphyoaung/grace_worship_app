import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  format,
  parseISO,
} from "date-fns";
import { ANNIVERSARY_DATE } from "@/lib/config";

const MM_DIGITS = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"] as const;

export function toMyanmarDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => MM_DIGITS[Number(d)] ?? d);
}

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
    return {
      totalDays: 0,
      years: 0,
      months: 0,
      days: 0,
      monthsaries: 0,
      anniversaries: 0,
      sinceLabelEn: formatSinceEn(start),
      sinceLabelMm: formatSinceMm(start),
    };
  }

  // Completed monthly / yearly markers after the start date (start day itself = 0).
  const monthsaries = Math.max(0, differenceInCalendarMonths(now, start));
  const anniversaries = Math.max(0, differenceInCalendarYears(now, start));

  return {
    totalDays,
    years,
    months,
    days,
    monthsaries,
    anniversaries,
    sinceLabelEn: formatSinceEn(start),
    sinceLabelMm: formatSinceMm(start),
  };
}

function formatSinceEn(start: Date): string {
  return `since ${format(start, "do MMM yyyy")}`;
}

function formatSinceMm(start: Date): string {
  const y = toMyanmarDigits(start.getFullYear());
  const d = toMyanmarDigits(start.getDate());
  const monthNames = [
    "ဇန်နဝါရီ",
    "ဖေဖော်ဝါရီ",
    "မတ်",
    "ဧပြီ",
    "မေ",
    "ဇွန်",
    "ဇူလိုင်",
    "ဩဂုတ်",
    "စက်တင်ဘာ",
    "အောက်တိုဘာ",
    "နိုဝင်ဘာ",
    "ဒီဇင်ဘာ",
  ];
  const m = monthNames[start.getMonth()] ?? "";
  return `${y} ခုနှစ် ${m} ${d} ရက်မှစ၍`;
}
