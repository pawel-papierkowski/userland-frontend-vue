/** Handles calling user feature endpoints. */
import backendApi from '@/services/api-common.ts';
import type { UserRegisterReq, TokenActivationReq } from '@/code/data/features/user.ts';

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
  }
}
