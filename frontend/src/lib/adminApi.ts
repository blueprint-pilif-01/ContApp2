/**
 * Legacy entry point. All real implementation now lives in `./api` under
 * `adminApi`. This file is kept as a compatibility shim for older imports.
 */
export { adminApi, userApi, api, isApiError } from "./api";
export type { ApiError } from "./api";
