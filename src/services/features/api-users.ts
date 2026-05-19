/** Handles calling user feature endpoints. */
import backendApi from '@/services/api-common.ts';
import type { UserRegisterReq, TokenActivationReq, UserLoginReq, UserPasswordResetLinkReq, UserPasswordResetReq } from '@/code/data/features/user.ts';

// Set up a default Axios instance for this feature.
const apiClient = backendApi.create('/users');

export default {
  /** Register user.
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
  }
}
