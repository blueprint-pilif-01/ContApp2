/**
 * Global setup for Vitest.
 *
 * - Ensures a clean `localStorage` and `sessionStorage` before each test.
 * - Restores the original `window.fetch` between tests when individual
 *   suites replace it.
 */

import { afterEach, beforeEach, vi } from "vitest";

const originalFetch = globalThis.fetch;
vi.stubEnv("VITE_API_BASE_URL", "");

beforeEach(() => {
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    // ignore
  }
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});
