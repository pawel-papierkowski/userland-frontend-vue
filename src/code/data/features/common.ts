// Common types.

/** Column data for TablePage component. */
export type ColumnData = {
  name: string,
  defSort: string, // Default sort for this column. Allowed values: ASC, DESC.
  translation: string,
  visible: boolean
};

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
  page: number; // Page number.
  sortBy: string; // Name of field to sort by. If null/empty, will sort by default field (usually createdAt).
  sortOrder: string; // Sort order for sortBy. If null/empty, will use descending order.
};
