import { logger } from '@/code/utils/logger.ts';

import backendApiUser from '@/services/features/api-users.ts';

import { useLoginStore } from '@/stores/login.ts';
import { prolongExpiration, prolongAfterLongTime } from '@/code/data/app/const.ts';
import { locstJwt, locstLastApiCall } from '@/code/data/app/storage.ts';
import type { LoginState } from '@/code/data/app/types.ts';
import { durSessionExpired } from '@/stores/messages/const.ts';

import apiLogging from '@/services/api-logging.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager';

/**
 * Class for handling user login, logout and related functionality like checking login state or permissions.
 * Essentially it is wrapper for login store.
 */
export class AppLoginer {
  /** Promise for prolongation. Used to avoid multiple concurrent calls. */
  private static prolongPromise: Promise<{ result: boolean; jwt: string }> | null = null;

  /**
   * Log in user. You can get token from /api/users/login or /api/users/prolong endpoints or from local storage.
   * Can be safely called when already logged in.
   * Note: there is no API call.
   * @param jwtToken JWT token.
   * @returns True if login was successful, otherwise false.
   */
  public static login(jwtToken: string): boolean {
    const loginStore = useLoginStore();

    // Failure can happen when token is already expired.
    const result = loginStore.applyToken(jwtToken);
    if (result) localStorage.setItem(locstJwt, jwtToken);
    else localStorage.removeItem(locstJwt);

    if (result) logger.debug('Logged in successfully as user "', loginStore.loginState.email, '".');
    else logger.warn('Failed to log in.');
    return result;
  }

  /**
   * Log out user. Contains API call.
   * @package onBackend: If true, call also backend.
   */
  public static async logout(onBackend: boolean = true) {
    const loginStore = useLoginStore();
    if (!loginStore.loginState.isLogged) return; // already not logged in

    if (onBackend) {
      try {
        await backendApiUser.logout(); // API CALL. We don't care if this call fails.
      } catch (error) {
        apiLogging.logError(error, 'Logout failed on backend!');
      }
    }

    loginStore.loginState = loginStore.resetLoginState();
    localStorage.removeItem(locstJwt);

    AppMessager.infoT('user.logout.msg.info.title', 'user.logout.msg.info.content');
    logger.debug('Logged out successfully.');
  }

  /**
   * Handle expired session. Clears login state without calling backend, removes JWT and shows warning message.
   * Used by response interceptor when backend returns 401 (unauthorized) for non-login requests.
   */
  public static expireSession() {
    const loginStore = useLoginStore();
    if (!loginStore.loginState.isLogged) return;

    loginStore.loginState = loginStore.resetLoginState();
    localStorage.removeItem(locstJwt);

    AppMessager.warningT('user.session.msg.warning.title', 'user.session.msg.warning.content', durSessionExpired);
    logger.debug('Session expired.');
  }

  /**
   * Prolong user session. Contains API call.
   */
  public static async prolong() {
    try {
      const { result } = await AppLoginer.prolongSilently();
      if (result) {
        AppMessager.infoT('user.prolong.msg.info.title', 'user.prolong.msg.info.content');
        logger.debug('Prolong successful.');
      } else {
        logger.warn('Prolong failed!');
      }
    } catch (error) {
      apiLogging.logError(error, 'Prolong failed!');
    }
  }

  /**
   * Prolong user session silently. Contains API call. It is up to you to catch exceptions and react to result.
   * @returns result: true if successful, otherwise false. jwt: JWT token.
   */
  public static async prolongSilently(): Promise<{ result: boolean; jwt: string }> {
    if (AppLoginer.prolongPromise) return AppLoginer.prolongPromise;

    AppLoginer.prolongPromise = (async () => {
      try {
        const loginStore = useLoginStore();

        const response = await backendApiUser.prolong(); // API CALL.
        const jwtToken = response.data.jwtToken;

        // Prolong call revoked current token, we need to replace it with new token.
        const result = loginStore.applyToken(jwtToken);
        if (result) localStorage.setItem(locstJwt, jwtToken);
        else localStorage.removeItem(locstJwt);
        return { result: result, jwt: jwtToken };
      } finally {
        AppLoginer.prolongPromise = null;
      }
    })();

    return AppLoginer.prolongPromise;
  }

  //

  /**
   * Check if user session should be prolonged.
   * @returns True if session should be prolonged, otherwise false.
   */
  public static shouldProlong(): boolean {
    return AppLoginer.isExpiringSoon() || AppLoginer.isIdleTooLong();
  }

  /**
   * Check if user session is expiring soon.
   * @returns True if session is expiring soon, otherwise false.
   */
  private static isExpiringSoon(): boolean {
    const loginStore = useLoginStore();
    if (!loginStore.loginState.isLogged) return false;

    const expiresAt = loginStore.loginState.expiresAt.getTime();
    const nowAt = new Date().getTime();
    const diff = expiresAt - nowAt;

    // If less than 5 minutes left, prolong.
    return diff > 0 && diff < prolongExpiration * 60 * 1000;
  }

  /**
   * Check if user session was idle for long time.
   * @returns True if session was idle for long time, otherwise false.
   */
  private static isIdleTooLong(): boolean {
    const lastCallStr = localStorage.getItem(locstLastApiCall);
    if (!lastCallStr) return false;
    return Date.now() - Number(lastCallStr) >= prolongAfterLongTime * 60 * 1000;
  }

  //

  /**
   * Get login state.
   * @returns Login state.
   */
  public static getState(): LoginState {
    const loginStore = useLoginStore();
    return loginStore.loginState;
  }

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
    return loginStore.loginState.username;
  }

  /**
   * Get email.
   * @returns email or empty string if no email.
   */
  public static getEmail(): string {
    const loginStore = useLoginStore();
    return loginStore.loginState.email;
  }

  /**
   * Retrieve JWT, if it exists.
   * @returns JWT or null if no token.
   */
  public static getJwt(): string | null {
    const loginStore = useLoginStore();
    if (!loginStore.loginState.isLogged) return null;

    const token = loginStore.loginState.token;
    return token || null;
  }

  //

  /**
   * Check if user has given permission.
   * @param permName Name of permission. Example: 'role_operator'.
   * @returns True if has given permission.
   */
  public static hasPermission(permName: string): boolean {
    const loginStore = useLoginStore();
    if (!loginStore.loginState.isLogged) return false;
    return loginStore.loginState.permissions.indexOf(permName) !== -1;
  }

  /**
   * Check if user has at least one of given permissions.
   * @param permNames Name of permissions. Example: ['role_admin', 'role_operator'].
   * @returns True if user has at least one of given permissions.
   */
  public static hasPermissionsAny(permNames: string[]): boolean {
    if (permNames.length === 0) return true; // empty array is treated as success

    for (const permName of permNames) {
      if (AppLoginer.hasPermission(permName)) return true;
    }
    return false;
  }

  /**
   * Check if user has all given permissions.
   * @param permNames Name of permissions. Example: ['role_operator', 'user_view'].
   * @returns True if user has all given permissions.
   */
  public static hasPermissionsAll(permNames: string[]): boolean {
    if (permNames.length === 0) return true; // empty array is treated as success

    for (const permName of permNames) {
      if (!AppLoginer.hasPermission(permName)) return false;
    }
    return true;
  }
}
