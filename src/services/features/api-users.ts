/** Handles calling user feature endpoints. */
import backendApi from '@/services/api-common.ts';
import type {
  UserRegisterReq,
  TokenActivationReq,
  UserLoginReq,
  UserEditReq,
  UserPasswordResetLinkReq,
  UserPasswordResetReq,
  UserEmailChangeLinkReq,
  UserEmailChangeReq,
  UserAccountDeleteLinkReq,
  UserAccountDeleteReq,
} from '@/code/data/features/user/user';

// Set up a default Axios instance for this feature.
const apiClient = backendApi.create('/users');

export default {
  /**
   * Register user.
   * @param payload User registration request.
   * @returns Result of call.
   */
  register(payload: UserRegisterReq) {
    return apiClient.post('/register', payload);
  },

  /**
   * Activate user based on given token.
   * @param payload Activation token request.
   * @returns Result of call.
   */
  activate(payload: TokenActivationReq) {
    return apiClient.post('/activate', payload);
  },

  /**
   * Login user.
   * @param payload User login request.
   * @returns Result of call.
   */
  login(payload: UserLoginReq) {
    return apiClient.post('/login', payload);
  },

  /**
   * Logout user.
   * @returns Result of call.
   */
  logout() {
    return apiClient.post('/logout');
  },

  /**
   * Prolong user session.
   * @returns Result of call.
   */
  prolong() {
    return apiClient.post('/prolong');
  },

  /**
   * Get all data of currently logged user.
   * @returns Result of call.
   */
  view() {
    return apiClient.get('/view');
  },

  /**
   * Change some or all data of currently logged user.
   * @returns Result of call.
   */
  edit(payload: UserEditReq) {
    return apiClient.patch('/edit', payload);
  },

  //

  /**
   * Password reset link.
   * @param payload Password reset link request.
   * @returns Result of call.
   */
  passwordResetLink(payload: UserPasswordResetLinkReq) {
    return apiClient.post('/password/link', payload);
  },

  /**
   * Password reset confirmation.
   * @param payload Password reset confirmation request.
   * @returns Result of call.
   */
  passwordResetConfirm(payload: UserPasswordResetReq) {
    return apiClient.patch('/password/confirm', payload);
  },

  /**
   * Email change link.
   * @param payload Email change link request.
   * @returns Result of call.
   */
  emailChangeLink(payload: UserEmailChangeLinkReq) {
    return apiClient.post('/email/link', payload);
  },

  /**
   * Email change confirmation based on given token.
   * @param payload Email change confirmation request.
   * @returns Result of call.
   */
  emailChangeConfirm(payload: UserEmailChangeReq) {
    return apiClient.patch('/email/confirm', payload);
  },

  /**
   * Account delete link.
   * @param payload Account delete link request.
   * @returns Result of call.
   */
  accountDeleteLink(payload: UserAccountDeleteLinkReq) {
    return apiClient.post('/delete/link', payload);
  },

  /**
   * Account delete confirmation based on given token.
   * @param payload Account delete confirmation request.
   * @returns Result of call.
   */
  accountDeleteConfirm(payload: UserAccountDeleteReq) {
    return apiClient.delete('/delete/confirm', { data: payload });
  },
};
