/** Handles calling user feature endpoints. */
import backendApi from '@/services/api-common.ts';
import type { UserRegisterForm } from '@/code/data/features/user.ts';

// Set up a default Axios instance for this feature.
const apiClient = backendApi.create('/users');

export default {
  /** Register user.
   * @param form Form data.
   */
  register(form : UserRegisterForm) {
    return apiClient.post('/register', form);
  }
}
