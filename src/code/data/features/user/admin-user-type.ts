// All types for admin user feature.
import type { TableMetaReq, TableMetaResp, EntryMeta } from '@/code/data/features/common/type.ts';
import type { UserProfileData } from '@/code/data/features/user/user-type';

// USER TABLE

/** User table filter form. */
export type UserTableFilterForm = {
  username: string | null; // If present, show only records that contain fully or partially this username.
  email: string | null; // If present, show only records that contain fully or partially this email.
  status: string | null; // If present, show only records of users with given status.
  locked: boolean | null; // If present, show only records of users with given locked value.
  createdFromAt: Date | null; // If present, show records with creation date that is same or later.
  createdToAt: Date | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User table filter request. */
export type UserTableReq = {
  username: string | null; // If present, show only records that contain fully or partially this username.
  email: string | null; // If present, show only records that contain fully or partially this email.
  status: string | null; // If present, show only records of users with given status.
  locked: boolean | null; // If present, show only records of users with given locked value.
  createdFromAt: string | null; // If present, show records with creation date that is same or later.
  createdToAt: string | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User table load response: page. */
export type UserTableResp = {
  entries: UserTableEntry[]; // All entries for single page from user table.
  tableMeta: TableMetaResp;
};

/** User table entry. */
export type UserTableEntry = {
  id: number;
  createdAt: string;
  username: string;
  email: string;
};

//

/** User full data request. */
export type UserFullDataReq = {
  id: number; // Identificator of user.
  username: string | null;
  email: string | null;
  locked: boolean | null;
  lang: string | null;
  profile: UserProfileData | null;
};

/** User full data response. */
export type UserFullDataResp = {
  id: number; // Identificator of user.
  createdAt: string;
  modifiedAt: string;
  username: string;
  email: string;
  status: string;
  locked: boolean;
  lang: string;
  profile: UserProfileData;
};

export type UserFullDataForm = {
  createdAt: string;
  modifiedAt: string;
  username: string | null;
  email: string | null;
  status: string;
  locked: boolean | null;
  lang: string | null;
  // Profile data.
  name: string | null;
  surname: string | null;
};

// USER HISTORY TABLE

/** User history table filter form. */
export type UserHistoryTableFilterForm = {
  userId: number; // User identificator.
  who: string | null; // If present, filter by who.
  what: string | null; // If present, filter by what.
  createdFromAt: Date | null; // If present, show records with creation date that is same or later.
  createdToAt: Date | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User history table filter request. */
export type UserHistoryTableReq = {
  userId: number; // User identificator.
  createdFromAt: string | null; // If present, show records with creation date that is same or later.
  createdToAt: string | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User history table load response: page. */
export type UserHistoryTableResp = {
  entries: UserHistoryTableEntry[]; // All entries for single page from user history table.
  tableMeta: TableMetaResp;
};

/** User history table entry. */
export type UserHistoryTableEntry = {
  id: number;
  createdAt: string;
  who: string;
  what: string;
  params: string;
};

// USER PERMISSIONS TABLE

/** User permission table filter form. */
export type UserPermissionTableFilterForm = {
  userId: number; // User identificator.
  createdFromAt: Date | null; // If present, show records with creation date that is same or later.
  createdToAt: Date | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User permission table filter request. */
export type UserPermissionTableReq = {
  userId: number; // User identificator.
  createdFromAt: string | null; // If present, show records with creation date that is same or later.
  createdToAt: string | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User permission table load response: page. */
export type UserPermissionTableResp = {
  entries: UserPermissionTableEntry[]; // All entries for single page from user permission table.
  tableMeta: TableMetaResp;
};

/** User permission table entry. */
export type UserPermissionTableEntry = {
  id: number;
  createdAt: string;
  name: string;
  value: string;
  meta: EntryMeta | null;
};

/** User permission table entry edit form. */
export type UserPermissionEntryEditForm = {
  name: string;
  value: string;
};

/** User permission table entry edit request. */
export type UserPermissionEntryEditReq = {
  id: number | null; // Null if new entry, otherwise edit existing entry.
  userId: number;
  name: string;
  value: string;
};

// USER CONFIG TABLE

/** User config table filter form. */
export type UserConfigTableFilterForm = {
  userId: number; // User identificator.
  createdFromAt: Date | null; // If present, show records with creation date that is same or later.
  createdToAt: Date | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User config table filter request. */
export type UserConfigTableReq = {
  userId: number; // User identificator.
  createdFromAt: string | null; // If present, show records with creation date that is same or later.
  createdToAt: string | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User config table load response: page. */
export type UserConfigTableResp = {
  entries: UserConfigTableEntry[]; // All entries for single page from user config table.
  tableMeta: TableMetaResp;
};

/** User config table entry. */
export type UserConfigTableEntry = {
  id: number;
  createdAt: string;
  name: string;
  value: string;
  meta: EntryMeta | null;
};

/** User config table entry edit form. */
export type UserConfigEntryEditForm = {
  name: string;
  value: string;
};

/** User config table entry edit request. */
export type UserConfigEntryEditReq = {
  id: number | null; // Null if new entry, otherwise edit existing entry.
  userId: number;
  name: string;
  value: string;
};

// USER TOKENS TABLE

/** User token table filter form. */
export type UserTokenTableFilterForm = {
  userId: number; // User identificator.
  createdFromAt: Date | null; // If present, show records with creation date that is same or later.
  createdToAt: Date | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User token table filter request. */
export type UserTokenTableReq = {
  userId: number; // User identificator.
  createdFromAt: string | null; // If present, show records with creation date that is same or later.
  createdToAt: string | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User token table load response: page. */
export type UserTokenTableResp = {
  entries: UserTokenTableEntry[]; // All entries for single page from user token table.
  tableMeta: TableMetaResp;
};

/** User token table entry. */
export type UserTokenTableEntry = {
  id: number;
  createdAt: string;
  expiresAt: string;
  token: string;
  payload: string;
};

// USER JWT TABLE

/** User JWT table filter form. */
export type UserJwtTableFilterForm = {
  userId: number; // User identificator.
  createdFromAt: Date | null; // If present, show records with creation date that is same or later.
  createdToAt: Date | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User JWT table filter request. */
export type UserJwtTableReq = {
  userId: number; // User identificator.
  createdFromAt: string | null; // If present, show records with creation date that is same or later.
  createdToAt: string | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User JWT table load response: page. */
export type UserJwtTableResp = {
  /** All entries for single page from user JWT table. */
  entries: UserJwtTableEntry[];
  tableMeta: TableMetaResp;
};

/** User JWT table entry. */
export type UserJwtTableEntry = {
  id: number;
  createdAt: string;
  expiresAt: string;
  token: string;
};

// OTHER

/** Needed for proper definition of tabRef because AdminUserTab uses generics. */
export interface AdminUserTabExpose {
  handleReload: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectEntry: (entry: Record<string, any> | null, force: boolean) => Promise<void>;
}
