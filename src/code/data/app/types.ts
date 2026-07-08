/** Fundamental project properties. More or less constant. */
export type ProjectProp = {
  title: string;
  author: string;
  dateRange: string;
  version: string;
  build: string;
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
