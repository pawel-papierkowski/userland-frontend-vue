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
      email: '',
      issuedAt: new Date(0),
      expiresAt: new Date(0),
      permissions: []
    }
  }

  /**
   * Apply token to the state and update logged status.
   * @param jwtToken JWT token from server.
   */
  function applyToken(jwtToken: string) {
    loginState.value.isLogged = !!jwtToken;
    loginState.value.token = jwtToken;
    if (jwtToken) {
      const decoded = jwtDecode(jwtToken);
      logger.debug('Decoded token:', decoded);
      readToken(decoded);
    } else {
      logger.warn('Failed to decode token.');
    }
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
    readPermissions(decodedJwt);
  }

  /**
   * Read permissions, if any present in token.
   * @param decodedJwt Decoded JWT.
   */
  function readPermissions(decodedJwt: JwtPayload) {
    for (const permPrefix of permissions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const permSuffix = (decodedJwt as Record<string, any>)[permPrefix] as string | undefined; // necessary as decodedJwt[permPrefix] generates IDE error
      if (permSuffix === undefined) continue;

      // Example: prefix 'role' and suffix 'admin,operator' will be mapped to ['role_admin', 'role_operator'].
      const splitSuffix: string[] = permSuffix.split(',');
      for (const permSuffix of splitSuffix) {
        const fullPermission = permPrefix+'_'+permSuffix;
        loginState.value.permissions.push(fullPermission);
      }
    }
  }

  return { loginState, applyToken, resetLoginState };
});
