import { describe, it, expect } from 'vitest';
import type { EntryMeta, EntryOption } from '@/code/data/features/common/type.ts';

import { TableUtils } from '@/code/utils/TableUtils';


describe('TableUtils', () => {
  // ////////////////////////////////////////////////////////////////////////////
  // ExtractOption

  describe('ExtractOption', () => {
    it('returns null when entryMeta is null', () => {
      // Arrange: Null metadata.
      const entryMeta = null;
      const optionKey = 'edit';

      // Act: Extract option.
      const result = TableUtils.ExtractOption(entryMeta, optionKey);

      // Assert: Null returned.
      expect(result).toBeNull();
    });

    it('returns null when entryMeta.options is null', () => {
      // Arrange: Metadata with null options.
      const entryMeta: EntryMeta = { options: null, data: null };
      const optionKey = 'edit';

      // Act: Extract option.
      const result = TableUtils.ExtractOption(entryMeta, optionKey);

      // Assert: Null returned.
      expect(result).toBeNull();
    });

    it('returns the option when the key exists', () => {
      // Arrange: Metadata with an existing option.
      const option: EntryOption = { access: 'ENABLED', reason: null };
      const entryMeta: EntryMeta = { options: { edit: option }, data: null };
      const optionKey = 'edit';

      // Act: Extract option.
      const result = TableUtils.ExtractOption(entryMeta, optionKey);

      // Assert: The option is returned.
      expect(result).toBe(option);
    });

    it('returns null when the option key does not exist', () => {
      // Arrange: Metadata with options but missing the requested key.
      const option: EntryOption = { access: 'ENABLED', reason: null };
      const entryMeta: EntryMeta = { options: { view: option }, data: null };
      const optionKey = 'edit';

      // Act: Extract option.
      const result = TableUtils.ExtractOption(entryMeta, optionKey);

      // Assert: Null returned.
      expect(result).toBeNull();
    });

    it('returns null when options is an empty object', () => {
      // Arrange: Metadata with empty options.
      const entryMeta: EntryMeta = { options: {}, data: null };
      const optionKey = 'edit';

      // Act: Extract option.
      const result = TableUtils.ExtractOption(entryMeta, optionKey);

      // Assert: Null returned.
      expect(result).toBeNull();
    });

    //

    it('returns option with DISABLED access and a reason string', () => {
      // Arrange: Option with DISABLED access and a reason.
      const option: EntryOption = { access: 'DISABLED', reason: 'form.errFieldEmpty' };
      const entryMeta: EntryMeta = { options: { delete: option }, data: null };
      const optionKey = 'delete';

      // Act: Extract option.
      const result = TableUtils.ExtractOption(entryMeta, optionKey);

      // Assert: The option is returned with correct values.
      expect(result).toEqual({ access: 'DISABLED', reason: 'form.errFieldEmpty' });
    });

    it('returns option with INVISIBLE access', () => {
      // Arrange: Option with INVISIBLE access.
      const option: EntryOption = { access: 'INVISIBLE', reason: null };
      const entryMeta: EntryMeta = { options: { admin: option }, data: null };
      const optionKey = 'admin';

      // Act: Extract option.
      const result = TableUtils.ExtractOption(entryMeta, optionKey);

      // Assert: The option is returned.
      expect(result).toEqual({ access: 'INVISIBLE', reason: null });
    });
  });
});
