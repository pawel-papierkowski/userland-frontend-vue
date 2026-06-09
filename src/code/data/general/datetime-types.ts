/** Dedicated date-only (year, month, day) type. */
export type DatePick = {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

/** Dedicated time-only (hour, minute) type. */
export type TimePick = {
  hour: number;
  minute: number;
}
