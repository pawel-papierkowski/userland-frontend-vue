/**
 * Common code for API handling.
 * Remember to always surround api calls with try-catch, even if you do not care about results. See AppLoginer.logout()
 * for example of such case.
 */
import axios from 'axios';
import { isAxiosError } from 'axios';

import { logger } from '@/code/utils/logger.ts';
import { apiAddress } from '@/code/data/app/const.ts';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

export default {
  /**
   * Set up a default Axios instance.
   * @param endpointBase Base endpoint.
   * @returns Axios instance.
   */
  create(endpointBase : string) {
    const instance = axios.create({
      baseURL: apiAddress + endpointBase,
      timeout: 5000,
    });

    // Add authentication token, if it is present.
    instance.interceptors.request.use(async (config) => {
      const token = AppLoginer.getJwt();
      //logger.debug(`Token: ${token}`);
      if (token === null) return config; // no token present, nothing to do

      // Check if we should prolong session.
      // We do NOT prolong if we are already in prolong or login/logout/register request.
      const isAuthRequest = config.url === '/prolong' || config.url === '/login' || config.url === '/logout' || config.url === '/register';

      if (!isAuthRequest && AppLoginer.shouldProlong()) {
        logger.debug('Session close to expiration, prolonging...');
        try {
          await AppLoginer.prolongSilently();
        } catch (error) {
          logger.error(error, 'Failed to prolong.');
        }
      }

      // Attach authorization header.
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    return instance;
  },

  /**
   * Logs API error to console.
   * @param error Error itself.
   * @param comment Comment.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logError(error: any, comment: string) {
    if (isAxiosError(error)) {
        if (error.response) {
          // The server actually responded with an error (e.g., 400 Bad Request). Log it.
          logger.error(comment, {
            status: error.response.status, // e.g. 400
            message: error.message,        // e.g. "Request failed with status code 400"
            backendBody: error.response.data // The actual JSON from backend
          });
        } else if (error.request) {
          // Request was made but no response was received (e.g. backend is down).
          logger.error(comment, 'Backend is unreachable. No response received.');
        }
    } else {
      logger.error(comment, 'An unexpected error occurred:', error);
    }
  }
}
