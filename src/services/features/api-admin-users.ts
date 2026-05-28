// Handles calling user feature endpoints.
import backendApi from '@/services/api-common.ts';
import type { UserTableReq, UserFullDataReq } from '@/code/data/features/user/admin-user';

// Set up a default Axios instance for this feature.
const apiClient = backendApi.create('/admin/users');

export default {
  /**
   * Get page from user table.
   * @param payload User table request.
   * @returns Result of call.
   */
  loadPage(payload: UserTableReq) {
    return apiClient.post('', payload);
  },

  /**
   * Get data (general and profile) of given user.
   * @param payload User data request.
   * @returns Result of call.
   */
  loadUserData(payload: UserFullDataReq) {
    return apiClient.get('/'+payload.id);
  }
};
