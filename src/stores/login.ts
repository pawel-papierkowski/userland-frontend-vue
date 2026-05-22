import { defineStore } from 'pinia';
import { ref } from 'vue';
import { jwtDecode, type JwtPayload } from 'jwt-decode';

import { logger } from '@/code/utils/logger.ts';

import { permissions } from '@/code/data/app/const.ts';
import type { LoginState } from '@/code/data/app/types.ts';

/**
 * Stores login data, including JWT token.
 */
export const useLoginStore = defineStore('login', () => {
  /** Login state. */
  const loginState = ref<LoginState>(resetLoginState());

  /** Initialize/reset login state. */
  function resetLoginState(): LoginState {
    return {
      isLogged: false,
      token: '',
      username: '',
      email: '',
      issuedAt: new Date(0),
      expiresAt: new Date(0),
      permissions: []
    }
  }

  /**
   * Apply token to the state and update logged status.
   * @param jwtToken JWT token from server.
   * @returns True if token was used successfully, otherwise false.
   */
  function applyToken(jwtToken: string): boolean {
    loginState.value = resetLoginState();

    if (jwtToken) {
      const decodedJwt = jwtDecode(jwtToken);
      logger.debug('Decoded JWT:', decodedJwt);
      if (!verifyToken(decodedJwt)) {
        loginState.value.isLogged = false;
        logger.warn('Failed to use JWT: it is expired.');
        return false;
      }
      loginState.value.isLogged = true;
      loginState.value.token = jwtToken;
      readToken(decodedJwt);
      return true;
    }

    logger.warn('Failed to decode JWT.');
    return false;
  }

  /**
   * Verify token. Note only verification we do is expiration date.
   * @param decodedJwt Decoded JWT.
   * @returns True if token is valid, otherwise false.
   */
  function verifyToken(decodedJwt: JwtPayload): boolean {
    const nowAt = new Date();
    const expiresAt = new Date((decodedJwt?.exp || 0) * 1000);
    return expiresAt.getTime() > nowAt.getTime();
  }

  /**
   * Read all data encoded in JWT, including our custom data like permissions.
   * @param decodedJwt Decoded JWT.
   */
  function readToken(decodedJwt: JwtPayload) {
    loginState.value.email = decodedJwt?.sub || '';
    loginState.value.issuedAt = new Date((decodedJwt?.iat || 0) * 1000);
    loginState.value.expiresAt = new Date((decodedJwt?.exp || 0) * 1000);

    // Our custom data.
    loginState.value.username = getValue(decodedJwt, 'name') || '';
    readPermissions(decodedJwt);
  }

  /**
   * Read permissions, if any present in token.
   * @param decodedJwt Decoded JWT.
   */
  function readPermissions(decodedJwt: JwtPayload) {
    for (const permPrefix of permissions) {
      const permSuffix = getValue(decodedJwt, permPrefix);
      if (permSuffix === null) continue;

      // Example: prefix 'role' and suffix 'admin,operator' will be mapped to ['role_admin', 'role_operator'].
      const splitSuffix: string[] = permSuffix.split(',');
      for (const permSuffix of splitSuffix) {
        const fullPermission = permPrefix+'_'+permSuffix;
        loginState.value.permissions.push(fullPermission);
      }
    }
  }

  /**
   * Retrieve custom value from decoded JWT.
   * @param decodedJwt Decoded JWT.
   * @param fieldName Name of custom field.
   * @returns Value of given field or null if field does not exist.
   */
  function getValue(decodedJwt: JwtPayload, fieldName: string): string|null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (decodedJwt as Record<string, any>)[fieldName]; // necessary as decodedJwt[fieldName] generates IDE error
    return value || null as string|null;
  }

  return { loginState, applyToken, resetLoginState };
});
