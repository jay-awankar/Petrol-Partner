// lib/time.ts
import { toZonedTime, format } from "date-fns-tz";

export function formatIST(date: string | Date, fmt = "dd MMM yyyy, hh:mm a") {
  const timeZone = "Asia/Kolkata";
  const zoned = toZonedTime(new Date(date), timeZone);
  return format(zoned, fmt, { timeZone });
}
