import type { ColumnData } from "@/code/data/features/common.ts";
import type { UserTableResp } from '@/code/data/features/user/admin-user.ts';

/** List of user status values. */
export const emptyUserTable: UserTableResp = { entries: [], tableMeta: {pageCount:0, entryCount:0, pageSize:0, page:0, sortBy:"", sortOrder:""}};

/** List of user status values. */
export const enUserStatus: (string|null)[] = [ null, 'PENDING', 'ACTIVE', 'DEMO' ];

/** List of user table columns. */
export const userTableColumns: ColumnData[] = [
  {
    name: "id",
    defSort: "ASC",
    translation: "admin.user.table.col.id",
    visible: false
  },
  {
    name: "createdAt",
    defSort: "DESC",
    translation: "admin.user.table.col.createdAt",
    visible: true
  },
  {
    name: "username",
    defSort: "ASC",
    translation: "admin.user.table.col.username",
    visible: true
  },
  {
    name: "email",
    defSort: "ASC",
    translation: "admin.user.table.col.email",
    visible: true
  }
];
