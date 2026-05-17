import { defineStore } from 'pinia';
import { ref } from 'vue';
import { jwtDecode, type JwtPayload } from 'jwt-decode';

import type { LoginState } from '@/code/data/app/types.ts';

/**
 * Stores login data, including JWT token.
 */
export const useLoginStore = defineStore('login', () => {
  /** Login state. */
  const loginState = ref<LoginState>(resetLoginState());

  /** Initialize/reset login state. Call when logging out. */
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
   * @param tokenRaw JWT token from server.
   */
  function applyToken(tokenRaw: string) {
    loginState.value.isLogged = !!tokenRaw;
    loginState.value.token = tokenRaw;
    if (tokenRaw) {
      const decoded = jwtDecode(tokenRaw);
      console.log('Decoded token:', decoded);
      readToken(decoded);
    }
  }

  /**
   * Read all data encoded in JWT.
   * @param decodedJwt Decoded JWT.
   */
  function readToken(decodedJwt: JwtPayload) {
    loginState.value.email = decodedJwt?.sub || '';
    loginState.value.issuedAt = new Date((decodedJwt?.iat || 0) * 1000);
    loginState.value.expiresAt = new Date((decodedJwt?.exp || 0) * 1000);

    // TODO: read persmissions field and convert to array
  }

  return { loginState, applyToken, resetLoginState };
});
