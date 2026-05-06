import { describe, expect, it } from "vitest";
import { filterDirectChildren, itemFullPath } from "../src/lib/documents";

const items = [
  { id: 1, name: "Client", type: "folder" as const, folder: "/" },
  { id: 2, name: "root.pdf", type: "file" as const, folder: "/" },
  { id: 3, name: "inside.pdf", type: "file" as const, folder: "/Client/" },
  { id: 4, name: "Nested", type: "folder" as const, folder: "/Client/" },
  { id: 5, name: "deep.pdf", type: "file" as const, folder: "/Client/Nested/" },
];

describe("document folder filtering", () => {
  it("returns only direct children for root", () => {
    expect(filterDirectChildren(items, "/", "").map((item) => item.name)).toEqual([
      "Client",
      "root.pdf",
    ]);
  });

  it("returns only direct children inside a folder", () => {
    expect(filterDirectChildren(items, "/Client/", "").map((item) => item.name)).toEqual([
      "inside.pdf",
      "Nested",
    ]);
  });

  it("builds folder navigation paths consistently", () => {
    expect(itemFullPath(items[0]!)).toBe("/Client/");
    expect(itemFullPath(items[2]!)).toBe("/Client/inside.pdf");
  });
});
