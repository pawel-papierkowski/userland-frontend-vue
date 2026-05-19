/** All types for user feature. */

// USER REGISTRATION

/** User registration form. */
export type UserRegisterForm = {
  username: string; // Name shown on frontend.
  email: string; // Email address. Doubles as unique name of account.
  password: string; // Password.
  confirmPassword: string; // Second password field to compare with first.
};

/** User registration request. */
export type UserRegisterReq = {
  username: string; // Name shown on frontend.
  email: string; // Email address. Doubles as unique name of account.
  password: string; // Password.
  lang: string; // Short language code.
  frontend: string; // Used frontend. Always VUE.
};

// USER ACTIVATION

/** Token activation request. */
export type TokenActivationReq = {
  token: string;
  frontend: string; // Used frontend. Always VUE.
};

// USER LOGIN

/** User login form. */
export type UserLoginForm = {
  email: string;
  password: string;
};

/** User login request. */
export type UserLoginReq = {
  email: string;
  password: string;
};

// USER PASSWORD RESET

/** User password reset link form. */
export type UserPasswordResetLinkForm = {
  email: string;
};

/** User password reset link request. */
export type UserPasswordResetLinkReq = {
  email: string;
  frontend: string; // Used frontend. Always VUE.
};

/** User password reset confirmation form. */
export type UserPasswordResetForm = {
  password: string; // Password.
  confirmPassword: string; // Second password field to compare with first.
};

/** User password reset confirmation request. */
export type UserPasswordResetReq = {
  token: string;
  password: string;
};

// USER ACCOUNT DELETION

/** User account delete link form. */
export type UserAccountDeleteLinkForm = {
  email: string;
};

/** User account delete link request. */
export type UserAccountDeleteLinkReq = {
  email: string;
  frontend: string; // Used frontend. Always VUE.
};

/** User account delete confirmation request. */
export type UserAccountDeleteReq = {
  token: string;
};

