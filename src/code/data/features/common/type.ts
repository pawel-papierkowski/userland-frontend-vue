// Common types.

import type { Component } from 'vue';

import type { EnColumnKind } from '@/code/data/features/common/const.ts';

// //////
// EDITOR

export type TabData = {
  id: string,
  label: string,
  component: Component
};

// /////
// TABLE

/** Column data for TablePage component. */
export type ColumnData = {
  /** Name of column. */
  name: string,
  /** Default sort for this column. Allowed values: 'ASC', 'DESC' or '' (no sorting enabled for this column). */
  defSort: string,
  /** Translation key for column header. */
  translation: string,
  /** Is column visible? */
  visible: boolean,
  /** Is column editable? Applies only to in-place editing. */
  editable: boolean,
  /** Kind of column. */
  kind: EnColumnKind,
};

/** Metadata for given row. */
export type RowMeta = Record<string, FieldMeta>;

/** Metadata for given field. */
export type FieldMeta = {
  /** CSS class for field. */
  css: string;
};

//

/** Table metadata request for pagination and sorting. */
export type TableMetaReq = {
  pageSize: number|null; // Size of page.
  page: number|null; // Page number.
  sortBy: string|null; // Name of field to sort by. If null/empty, will sort by default field (usually createdAt).
  sortOrder: string|null; // Sort order for sortBy. If null/empty, will use descending order.
};

/** Table metadata response. */
export type TableMetaResp = {
  pageCount: number; // Count of all pages.
  entryCount: number; // Count of all entries (not just on current page).

  pageSize: number; // Size of page.
  page: number; // Page number. Zero-indexed.
  sortBy: string; // Name of field to sort by. If null/empty, will sort by default field (usually createdAt).
  sortOrder: string; // Sort order for sortBy. If null/empty, will use descending order.
};

/** Entry metadata response. */
export type EntryMeta = {
  /** Options available for this entry. */
  options: Record<string, EntryOption>|null,
  /** Other metadata. */
  data: Record<string, string>|null
};

/** Entry metadata option. */
export type EntryOption = {
  /** Access rules. */
  access: 'INVISIBLE'|'DISABLED'|'ENABLED',
  /** Reason for state of option as language key. */
  reason: string|null,
};

// OTHER

/** Needed for proper definition of tablePageRef because TablePage uses generics. */
export interface TablePageExpose {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectEntry: (entry: Record<string, any>|null, force: boolean) => Promise<void>;
}
