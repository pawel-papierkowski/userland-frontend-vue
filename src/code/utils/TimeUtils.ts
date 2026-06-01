export class TimeUtils {
  /**
   * Converts a Date to a local ISO string describing full date and time (YYYY-MM-DDThh:mm:ss.SSS).
   * We ignore timezone.
   * @param date Date/time Javascript class instance.
   * @returns Date&time as ISO-formatted string without zone.
   */
  public static cnvFull(date: Date | null): string | null {
    if (date === null) return null;

    const YYYY = date.getFullYear();
    const MM = this.pad(date.getMonth() + 1);
    const DD = this.pad(date.getDate());
    const hh = this.pad(date.getHours());
    const mm = this.pad(date.getMinutes());
    const ss = this.pad(date.getSeconds());
    const ms = this.pad(date.getMilliseconds(), 3);

    let isoStr = `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;
    if (ms !== '000') isoStr += `.${ms}`;
    return isoStr;
  }

  /**
   * Converts a Date to a local ISO string describing date only (YYYY-MM-DD).
   * We ignore timezone.
   * @param date Date/time Javascript class instance.
   * @returns Date&time as ISO-formatted string without zone.
   */
  public static cnvDate(date: Date | null): string | null {
    if (date === null) return null;

    const YYYY = date.getFullYear();
    const MM = this.pad(date.getMonth() + 1);
    const DD = this.pad(date.getDate());

    return `${YYYY}-${MM}-${DD}`;
  }

  /**
   * Converts a Date to a local ISO string describing time only (hh:mm:ss.SSS).
   * We ignore timezone.
   * @param date Date/time Javascript class instance.
   * @returns Date&time as ISO-formatted string without zone.
   */
  public static cnvTime(date: Date | null): string | null {
    if (date === null) return null;

    const hh = this.pad(date.getHours());
    const mm = this.pad(date.getMinutes());
    const ss = this.pad(date.getSeconds());
    const ms = this.pad(date.getMilliseconds(), 3);

    let isoStr = `${hh}:${mm}:${ss}`;
    if (ms !== '000') isoStr += `.${ms}`;
    return isoStr;
  }

  //

  /**
   * Format date.
   * @param date Date. Can be null.
   * @returns Formatted date as string. If null, will return empty string.
   */
  public static formatDate(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get how many days are present in given year and month.
   * @param year Year.
   * @param month Month.
   * @returns Count of days in given year and month.
   */
  public static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Find out first day of month.
   * @param year Year.
   * @param month Month.
   * @returns Weekday as number. 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
   */
  public static getFirstDayOfMonth(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    return (day + 6) % 7;
  }

  //

  private static pad(n: number, length: number = 2): string {
    return n.toString().padStart(length, '0');
  }
}
