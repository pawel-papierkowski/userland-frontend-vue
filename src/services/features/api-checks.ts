/** Handles calling check feature endpoints. */
import backendApi from '@/services/api-common.ts';

// Set up a default Axios instance for this feature.
const apiClient = backendApi.create('/checks');

export default {
  /**
   * Alive check.
   * @returns Result of call.
   */
  alive() {
    return apiClient.get('/alive');
  },

  /**
   * Must-be-logged check.
   * @returns Result of call.
   */
  mustBeLogged() {
    return apiClient.get('/must-be-logged');
  },

  /**
   * Must-be-admin check.
   * @returns Result of call.
   */
  mustBeAdmin() {
    return apiClient.get('/must-be-admin');
  },

  /**
   * Exception check.
   * @returns Result of call.
   */
  exception() {
    return apiClient.get('/exception');
  }
}
