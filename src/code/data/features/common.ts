// Common types.

/** Column data for TablePage component. */
export type ColumnData = {
  name: string,
  translation: string,
  visible: boolean
};

/** Table metadata for pagination and sorting. */
export type TableMeta = {
  pageSize: number|null; // Size of page.
  page: number|null; // Page number.
  sortBy: string|null; // Name of field to sort by. If null/empty, will sort by default field (usually createdAt).
  sortOrder: string|null; // Sort order for sortBy. If null/empty, will use descending order.
};
