import { useEffect } from "react";

/**
 * Stabilize deterministic seed-like values per feature key.
 * Useful for keeping mock demo datasets predictable after refreshes.
 */
export function useFeatureSeed(featureKey: string, seedValue: string) {
  useEffect(() => {
    const key = `contapp_seed_${featureKey}`;
    const current = localStorage.getItem(key);
    if (!current) {
      localStorage.setItem(key, seedValue);
    }
  }, [featureKey, seedValue]);
}
