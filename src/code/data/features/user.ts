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

// USER login

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


