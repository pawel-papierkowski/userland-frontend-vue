import { useLoginStore } from '@/stores/login.ts';

/**
 * Class for handling user login, logout and related functionality like checking login state or permissions.
 * Essentially it is wrapper for login store.
 */
export class AppLoginer {
  /**
   * Log in user.
   * @param jwtToken JWT token provided by /api/users/login endpoint.
   */
  public static login(jwtToken: string) {
    const loginStore = useLoginStore();
    loginStore.applyToken(jwtToken);
  }

  /**
   * Log out user.
   */
  public static logout() {
    const loginStore = useLoginStore();
    loginStore.loginState = loginStore.resetLoginState();
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
