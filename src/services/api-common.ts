/** Common code for API handling. */
import axios from 'axios';

import { apiAddress } from '@/code/data/app/const.ts';

/**
 * Set up a default Axios instance.
 * @param endpointBase Base endpoint.
 * @returns Axios instance.
 */
export function createApi(endpointBase : string) {
  return axios.create({
    baseURL: apiAddress + endpointBase,
    timeout: 5000,
  });
}
