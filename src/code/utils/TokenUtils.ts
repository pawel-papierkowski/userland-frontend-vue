import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";

/** Utility class for handling tokens. */
export class TokenUtils {
  /**
   * Resolve token from query.
   * @param route Route data.
   * @returns Token as string.
   */
  public static resolve(route: RouteLocationNormalizedLoadedGeneric): string {
    // Ensure token is string, even if the URL query is missing or duplicated.
    const tokenStr: string = (Array.isArray(route.query.token) ? route.query.token[0] : route.query.token) ?? '';
    return tokenStr;
  }


  /**
   * Checks if token is present and is not malformed. Note it does NOT verify if it actually exists on backend.
   * @param token Token.
   * @returns True if token seems valid, otherwise false.
   */
  public static verify(token: string): boolean {
    if (token === undefined || token === null || token === '') return false;
    const tokenRegex = /^[A-Za-z0-9]{32}$/;
    return tokenRegex.test(token);
  }
}
