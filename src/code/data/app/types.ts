import type { JwtPayload } from 'jwt-decode';

/** Fundamental project properties. More or less constant. */
export type ProjectProp = {
  title: string;
  author: string;
  dateRange: string;
  version: string;
  build: string;
};

/** JWT payload with our custom claims. */
export type CustomJwtPayload = JwtPayload & {
  /** User display name. */
  name?: string;
  /** Permissions map: prefix -> comma-separated suffixes. E.g. { role: "admin,operator" }. */
  perms?: Record<string, string>;
};

/** Login state. */
export type LoginState = {
  /** True if logged in, otherwise false. */
  isLogged: boolean;
  /** Raw token from /api/users/login endpoint. */
  token: string;

  /** User name. Can be shown on frontend. */
  username: string;
  /** Email. */
  email: string;
  /** Issued at. */
  issuedAt: Date;
  /** Expires at. */
  expiresAt: Date;
  /** Permissions. Example: ["ROLE_ADMIN", "USER_EDIT"] */
  permissions: string[];
};
