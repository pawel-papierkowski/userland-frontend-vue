// Handles calling user feature endpoints.
import backendApi from '@/services/api-common.ts';
import type { UserTableReq } from '@/code/data/features/user/admin-user';

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
};
