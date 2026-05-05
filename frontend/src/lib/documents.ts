export interface FolderLike {
  name: string;
  type: "file" | "folder";
  folder: string;
}

export function normalizeFolderPath(path: string | null | undefined): string {
  if (!path || path.trim() === "") return "/";
  let next = path.trim().replaceAll("\\", "/");
  if (!next.startsWith("/")) next = `/${next}`;
  if (!next.endsWith("/")) next = `${next}/`;
  return next.replace(/\/+/g, "/");
}

export function itemFullPath(item: FolderLike): string {
  return `${normalizeFolderPath(item.folder)}${item.name}${item.type === "folder" ? "/" : ""}`.replace(/\/+/g, "/");
}

export function isDirectChild(item: FolderLike, currentFolder: string): boolean {
  const folder = normalizeFolderPath(item.folder);
  const current = normalizeFolderPath(currentFolder);
  if (folder !== current) return false;
  if (item.name.includes("/")) return false;
  return true;
}

export function filterDirectChildren<T extends FolderLike>(
  items: T[],
  currentFolder: string,
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    const inFolder = isDirectChild(item, currentFolder);
    const matchesQuery = !q || item.name.toLowerCase().includes(q);
    return inFolder && matchesQuery;
  });
}
