/** Kind of column in table. */
export enum EnCalendarCellType {
  /** Standard date cell that should show day. */
  Date,
  /** Week cell that shows week number. */
  Week,
}

/** Dedicated date-only (year, month, day) type. */
export type CalendarCell = {
  /** Identificator of cell for data-testid attribute. */
  testid: string;

  /** Type of cell. */
  type: EnCalendarCellType;

  /** Day. */
  day: number;
  /** Month. */
  month: number;
  /** Year. */
  year: number;
  /** If true, this date pick is for current month. */
  isCurrentMonth: boolean;
}
