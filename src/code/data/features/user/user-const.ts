import type { ColumnData } from "@/code/data/features/common.ts";

/** List of user status values. */
export const enUserStatus: (string|null)[] = [ null, 'PENDING', 'ACTIVE' ];

/** List of user table columns. */
export const userTableColumns: ColumnData[] = [
  {
    name: "id",
    translation: "admin.user.table.col.id",
    visible: false
  },
  {
    name: "createdAt",
    translation: "admin.user.table.col.createdAt",
    visible: true
  },
  {
    name: "username",
    translation: "admin.user.table.col.username",
    visible: true
  },
  {
    name: "email",
    translation: "admin.user.table.col.email",
    visible: true
  }
];
