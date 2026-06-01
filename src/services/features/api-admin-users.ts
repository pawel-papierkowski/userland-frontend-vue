// Handles calling user feature endpoints.
import backendApi from '@/services/api-common.ts';
import type { UserTableReq, UserFullDataReq,
  UserHistoryTableReq, UserPermissionTableReq, UserConfigTableReq, UserTokenTableReq, UserJwtTableReq } from '@/code/data/features/user/admin-user';

// Set up a default Axios instance for this feature.
const apiClient = backendApi.create('/admin/users');

export default {
  // USER TABLE

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
  },

  // USER HISTORY TABLE

  /**
   * Get page from user history table.
   * @param payload User history table request.
   * @returns Result of call.
   */
  loadHistoryPage(payload: UserHistoryTableReq) {
    return apiClient.post('/history', payload);
  },

  // USER PERMISSIONS TABLE

  /**
   * Get page from user permission table.
   * @param payload User permission table request.
   * @returns Result of call.
   */
  loadPermissionsPage(payload: UserPermissionTableReq) {
    return apiClient.post('/permissions', payload);
  },

  // USER CONFIG TABLE

  /**
   * Get page from user config table.
   * @param payload User config table request.
   * @returns Result of call.
   */
  loadConfigPage(payload: UserConfigTableReq) {
    return apiClient.post('/config', payload);
  },

  // USER TOKENS TABLE

  /**
   * Get page from user token table.
   * @param payload User token table request.
   * @returns Result of call.
   */
  loadTokensPage(payload: UserTokenTableReq) {
    return apiClient.post('/tokens', payload);
  },

  // USER JWT TABLE

  /**
   * Get page from user JWT table.
   * @param payload User JWT table request.
   * @returns Result of call.
   */
  loadJwtPage(payload: UserJwtTableReq) {
    return apiClient.post('/jwt', payload);
  },
};
