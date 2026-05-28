export class TimeUtils {
  public static cnv(date: Date|null): string|null {
    if (date === null) return null;
    return date.toISOString();
  }
}
