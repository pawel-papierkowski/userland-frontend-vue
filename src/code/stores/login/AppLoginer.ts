import { logger } from '@/code/utils/logger.ts';

import backendApiUser from '@/services/features/api-users.ts';

import { useLoginStore } from '@/stores/login.ts';
import { locstJwt } from '@/code/data/app/const.ts';

import backendApi from '@/services/api-common.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager';

/**
 * Class for handling user login, logout and related functionality like checking login state or permissions.
 * Essentially it is wrapper for login store.
 */
export class AppLoginer {
  /**
   * Log in user. You can get token from /api/users/login or /api/users/prolong endpoints or from local storage.
   * Can be safely called when already logged in.
   * @param jwtToken JWT token.
   */
  public static login(jwtToken: string) {
    const loginStore = useLoginStore();

    // Failure can happen when token is already expired.
    const result = loginStore.applyToken(jwtToken);
    if (result) localStorage.setItem(locstJwt, jwtToken);
    else localStorage.removeItem(locstJwt);

    if (result) logger.debug("Logged in successfully.");
    else logger.debug("Failed to log in.");
  }

  /**
   * Log out user. Contains API call.
   */
  public static async logout() {
    const loginStore = useLoginStore();

    await backendApiUser.logout(); // API CALL. We don't care if this call fails.

    loginStore.loginState = loginStore.resetLoginState();
    localStorage.removeItem(locstJwt);

    AppMessager.successT('user.logout.msg.success.title', 'user.logout.msg.success.content');
    logger.debug("Logged out successfully.");
  }

  /**
   * Prolong user session. Contains API call.
   */
  public static async prolong() {
    const loginStore = useLoginStore();

    try {
      const response = await backendApiUser.prolong(); // API CALL.
      const jwtToken = response.data.jwtToken;

      // Prolong call will revoke current token, we need to replace it with new token.
      const result = loginStore.applyToken(jwtToken);
      if (result) localStorage.setItem(locstJwt, jwtToken);
      else localStorage.removeItem(locstJwt);
    } catch (error) {
      backendApi.logError(error, 'Prolong failed!');
    }
  }

  //

  /**
   * Check if user is logged.
   * @returns True if user is logged, otherwise false.
   */
  public static isLogged(): boolean {
    const loginStore = useLoginStore();
    return loginStore.loginState.isLogged;
  }

  /**
   * Get username.
   * @returns Username or empty string if no username.
   */
  public static getUsername(): string {
    const loginStore = useLoginStore();
    return loginStore.loginState.name;
  }

  /**
   * Retrieve JWT, if it exists.
   * @returns JWT or null if no token.
   */
  public static getJwt(): string|null {
    const loginStore = useLoginStore();
    if (!loginStore.loginState.isLogged) return null;

    const token = loginStore.loginState.token;
    return token || null;
  }

  /**
   * Check if user has at least one of given permissions.
   * @param permNames Name of permissions. Example: ['role_admin', 'role_operator'].
   */
  public static hasPermissionsAny(permNames: string[]): boolean {
    for (const permName of permNames) {
      if (AppLoginer.hasPermission(permName)) return true;
    }
    return false;
  }

  /**
   * Check if user has given permission.
   * @param permName Name of permission. Example: 'role_operator'.
   */
  public static hasPermission(permName: string): boolean {
    const loginStore = useLoginStore();
    if (!loginStore.loginState.isLogged) return false;
    return loginStore.loginState.permissions.indexOf(permName) !== -1;
  }
}
