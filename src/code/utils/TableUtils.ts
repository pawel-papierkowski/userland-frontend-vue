import type { EntryMeta, EntryOption } from '@/code/data/features/common/type.ts';

/** Table-related utility functions. */
export class TableUtils {
  /**
   * Extract desired option from entry metadata.
   * @param entryMeta Entry metadata.
   * @param optionKey Option key.
   * @returns Option or null.
   */
  public static ExtractOption(entryMeta: EntryMeta|null, optionKey: string): EntryOption|null  {
    if (entryMeta == null) return null;
    const options: Record<string, EntryOption>|null = entryMeta.options;
    if (options == null) return null;
    return options[optionKey] || null;
  }
}
