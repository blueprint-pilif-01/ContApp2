import { beforeEach, describe, expect, it } from "vitest";
import {
  SINGLE_SIGNATURE_STORAGE_KEY,
  clearStoredSignature,
  readStoredSignature,
  saveStoredSignature,
} from "../src/lib/signatureStorage";

describe("signature storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads the unified local signature", () => {
    saveStoredSignature({
      name: "Owner",
      owner_id: 7,
      image: "data:image/png;base64,abc",
      updated_at: "2026-05-05T10:00:00.000Z",
    });

    expect(readStoredSignature()).toEqual({
      name: "Owner",
      owner_id: 7,
      image: "data:image/png;base64,abc",
      updated_at: "2026-05-05T10:00:00.000Z",
    });
  });

  it("can clear the active signature", () => {
    localStorage.setItem(SINGLE_SIGNATURE_STORAGE_KEY, JSON.stringify({ image: "x" }));
    clearStoredSignature();
    expect(readStoredSignature()).toBeNull();
  });

  it("reads the legacy signatures array as fallback", () => {
    localStorage.setItem(
      "contapp_local_signatures",
      JSON.stringify([{ name: "Legacy", owner_id: 1, image_url: "data:image/png;base64,legacy" }])
    );

    expect(readStoredSignature()?.image).toBe("data:image/png;base64,legacy");
  });
});
