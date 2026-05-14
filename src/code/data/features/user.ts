/** All types for user feature.  */

/** User registration form. Can be used directly as request for POST /api/users/register. */
export type UserRegisterForm = {
  username: string; // Name shown on frontend.
  email: string; // Email address. Doubles as unique name of account.
  password: string; // Password.
  confirmPassword: string; // Second password field to compare with first. Not used by backend.
  lang: string; // Short language code.
};
