/** Common code for error handling. */
import { isAxiosError } from 'axios';
import { logger } from '@/code/utils/logger.ts';

/**
 * Logs Axios error.
 * @param error Error itself.
 * @param comment Comment.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logAxiosError(error: any, comment: string) {
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
