// All types for admin user feature.
import type { TableMetaReq, TableMetaResp } from '@/code/data/features/common.ts';
import type { UserProfileDataResp } from '@/code/data/features/user/user';

// USER TABLE

/** User table load form. */
export type UserTableForm = {
  username: string | null; // If present, show only records that contain fully or partially this username.
  email: string | null; // If present, show only records that contain fully or partially this email.
  status: string | null; // If present, show only records of users with given status.
  locked: boolean | null; // If present, show only records of users with given locked value.
  createdFromAt: Date | null; // If present, show records with creation date that is same or later.
  createdToAt: Date | null; // If present, show records with creation date that is same or earlier.
  tableMeta: TableMetaReq | null; // Metadata for table result.
};

/** User table load request. */
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

/** User full data request. */
export type UserFullDataReq = {
  id: number; // Identificator of user.
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
  profile: UserProfileDataResp;
};

export type UserFullDataForm = {
  createdAt: string;
  modifiedAt: string;
  username: string;
  email: string;
  status: string;
  locked: boolean|null;
  lang: string;
  // Profile data.
  name: string;
  surname: string;
};
