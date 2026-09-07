/**
 * Common code for API handling.
 * Remember to always surround API calls with try-catch, even if you do not care about results. See AppLoginer.logout()
 * for an example of such a case.
 */
import axios from 'axios';
import { isAxiosError } from 'axios';

import { logger } from '@/code/utils/logger.ts';
import { apiAddress } from '@/code/data/app/const.ts';
import { locstLastApiCall } from '@/code/data/app/storage.ts';

import { AppLoginer } from '@/code/wrappers/login/AppLoginer.ts';

export default {
  /**
   * Set up a default Axios instance.
   * @param endpointBase Base endpoint.
   * @param timeout Timeout in seconds. Default is a minute since we may need to wait for GCP to spin up.
   * @returns Axios instance.
   */
  create(endpointBase: string, timeout: number = 60) {
    const instance = axios.create({
      baseURL: apiAddress + endpointBase,
      timeout: timeout * 1000,
    });

    // Add authentication token, if it is present.
    instance.interceptors.request.use(async (config) => {
      let token = AppLoginer.getJwt();
      if (token === null) return config; // no token present, nothing to do

      // Check if we should prolong the session.
      // We do NOT prolong if we are already in a prolong, login, logout, or register request.
      const isAuthRequest =
        config.url === '/prolong' || config.url === '/login' || config.url === '/logout' || config.url === '/register';

      if (!isAuthRequest) {
        if (AppLoginer.shouldProlong()) {
          logger.debug('Prolonging session...');
          try {
            const { jwt } = await AppLoginer.prolongSilently();
            token = jwt; // we need to use the new token
          } catch (error) {
            logger.error(error, 'Failed to prolong.');
          }
        }

        // Remember when we last made a non-auth API call.
        localStorage.setItem(locstLastApiCall, String(Date.now()));
      }

      // Attach authorization header.
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Handle 401 (Unauthorized) responses for non-login requests — session expired.
    instance.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (isAxiosError(error) && error.response?.status === 401) {
          const isLoginRequest = error.config?.url === '/login';
          if (!isLoginRequest && AppLoginer.isLogged()) {
            AppLoginer.expireSession();
          }
        }
        return Promise.reject(error);
      },
    );

    return instance;
  },
};
