/** Handles calling user feature endpoints. */
import backendApi from '@/services/api-common.ts';
import type { UserRegisterForm } from '@/code/data/features/user.ts';

// Set up a default Axios instance for this feature.
const apiClient = backendApi.create('/users');

export default {
  /** Register user.
   * @param payload Form data.
   * @returns Result of call.
   */
  register(payload: UserRegisterForm) {
    return apiClient.post('/register', payload);
  },

  /**
   * Activate user based on given token.
   * @param tokenStr Token string.
   * @returns Result of call.
   */
  activate(tokenStr: string) {
    const payload = { token: tokenStr, frontend: 'VUE' };
    return apiClient.post('/activate', payload);
  }
}
