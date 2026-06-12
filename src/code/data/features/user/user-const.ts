import type { ColumnData } from '@/code/data/features/common/type.ts';
import type {
  UserFullDataForm,
  UserTableResp,
  UserHistoryTableResp,
  UserPermissionTableResp,
  UserConfigTableResp,
  UserTokenTableResp,
  UserJwtTableResp,
} from '@/code/data/features/user/admin-user-type.ts';
import { EnColumnKind } from '@/code/data/features/common/const.ts';

// USER TABLE

/** Null user form. */
export const emptyUserForm: UserFullDataForm = {
  createdAt: '',
  modifiedAt: '',
  username: null,
  email: null,
  status: '',
  locked: null,
  lang: null,
  name: null,
  surname: null,
};

/** Empty user table. */
export const emptyUserTable: UserTableResp = {
  entries: [],
  tableMeta: { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' },
};

/** List of user status values. */
export const enUserStatus: (string | null)[] = [null, 'PENDING', 'ACTIVE', 'DEMO'];

/** List of user table columns. */
export const userTableColumns: ColumnData[] = [
  {
    name: 'id', // unique key
    defSort: 'ASC',
    translation: 'admin.user.table.col.id',
    visible: false,
    kind: EnColumnKind.Data,
  },
  {
    name: 'createdAt',
    defSort: 'DESC',
    translation: 'admin.user.table.col.createdAt',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'username',
    defSort: 'ASC',
    translation: 'admin.user.table.col.username',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'email',
    defSort: 'ASC',
    translation: 'admin.user.table.col.email',
    visible: true,
    kind: EnColumnKind.Data,
  },
];

// USER HISTORY TABLE

/** Empty user history table. */
export const emptyUserHistoryTable: UserHistoryTableResp = {
  entries: [],
  tableMeta: { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' },
};

/** List of user history who values. */
export const enUserHistoryWho: (string | null)[] = [null, 'USER', 'OPERATOR', 'SYSTEM'];
/** List of user history what values. */
export const enUserHistoryWhat: (string | null)[] = [
  null,
  'CREATE',
  'ACTIVATE',
  'EDIT',
  'EMAIL_CHANGE_REQ',
  'EMAIL_CHANGE',
  'PASS_RESET_REQ',
  'PASS_RESET',
  'DELETE_REQ',
  'LOGIN',
  'LOGOUT',
  'PROLONG',
];

/** List of user history table columns. */
export const userHistoryTableColumns: ColumnData[] = [
  {
    name: 'id', // unique key
    defSort: 'ASC',
    translation: 'admin.user.history.table.col.id',
    visible: false,
    kind: EnColumnKind.Data,
  },
  {
    name: 'createdAt',
    defSort: 'DESC',
    translation: 'admin.user.history.table.col.createdAt',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'who',
    defSort: 'ASC',
    translation: 'admin.user.history.table.col.who',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'what',
    defSort: 'ASC',
    translation: 'admin.user.history.table.col.what',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'params',
    defSort: 'ASC',
    translation: 'admin.user.history.table.col.params',
    visible: true,
    kind: EnColumnKind.Data,
  },
];

// USER PERMISSIONS TABLE

/** Empty user permissions table. */
export const emptyUserPermissionTable: UserPermissionTableResp = {
  entries: [],
  tableMeta: { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' },
};

/** List of user permissions table columns. */
export const userPermissionsTableColumns: ColumnData[] = [
  {
    name: 'id', // unique key
    defSort: 'ASC',
    translation: 'admin.user.permissions.table.col.id',
    visible: false,
    kind: EnColumnKind.Data,
  },
  {
    name: 'createdAt',
    defSort: 'DESC',
    translation: 'admin.user.permissions.table.col.createdAt',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'name',
    defSort: 'ASC',
    translation: 'admin.user.permissions.table.col.name',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'value',
    defSort: 'ASC',
    translation: 'admin.user.permissions.table.col.value',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'options',
    defSort: '',
    translation: 'admin.user.permissions.table.col.options',
    visible: true,
    kind: EnColumnKind.Custom,
  },
];

// USER CONFIG TABLE

/** Empty user config table. */
export const emptyUserConfigTable: UserConfigTableResp = {
  entries: [],
  tableMeta: { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' },
};

/** List of user config table columns. */
export const userConfigTableColumns: ColumnData[] = [
  {
    name: 'id', // unique key
    defSort: 'ASC',
    translation: 'admin.user.config.table.col.id',
    visible: false,
    kind: EnColumnKind.Data,
  },
  {
    name: 'createdAt',
    defSort: 'DESC',
    translation: 'admin.user.config.table.col.createdAt',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'name',
    defSort: 'ASC',
    translation: 'admin.user.config.table.col.name',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'value',
    defSort: 'ASC',
    translation: 'admin.user.config.table.col.value',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'options',
    defSort: '',
    translation: 'admin.user.config.table.col.options',
    visible: true,
    kind: EnColumnKind.Custom,
  },
];

// USER TOKENS TABLE

/** Empty user tokens table. */
export const emptyUserTokenTable: UserTokenTableResp = {
  entries: [],
  tableMeta: { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' },
};

/** List of user tokens table columns. */
export const userTokensTableColumns: ColumnData[] = [
  {
    name: 'id', // unique key
    defSort: 'ASC',
    translation: 'admin.user.tokens.table.col.id',
    visible: false,
    kind: EnColumnKind.Data,
  },
  {
    name: 'createdAt',
    defSort: 'DESC',
    translation: 'admin.user.tokens.table.col.createdAt',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'expiresAt',
    defSort: 'ASC',
    translation: 'admin.user.tokens.table.col.expiresAt',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'token',
    defSort: 'ASC',
    translation: 'admin.user.tokens.table.col.token',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'payload',
    defSort: 'ASC',
    translation: 'admin.user.tokens.table.col.payload',
    visible: true,
    kind: EnColumnKind.Data,
  },
];

// USER JWT TABLE

/** Empty user JWT table. */
export const emptyUserJwtTable: UserJwtTableResp = {
  entries: [],
  tableMeta: { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' },
};

/** List of user JWT table columns. */
export const userJwtTableColumns: ColumnData[] = [
  {
    name: 'id', // unique key
    defSort: 'ASC',
    translation: 'admin.user.jwt.table.col.id',
    visible: false,
    kind: EnColumnKind.Data,
  },
  {
    name: 'createdAt',
    defSort: 'DESC',
    translation: 'admin.user.jwt.table.col.createdAt',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'expiresAt',
    defSort: 'ASC',
    translation: 'admin.user.jwt.table.col.expiresAt',
    visible: true,
    kind: EnColumnKind.Data,
  },
  {
    name: 'token',
    defSort: 'ASC',
    translation: 'admin.user.jwt.table.col.token',
    visible: true,
    kind: EnColumnKind.Data,
  },
];
