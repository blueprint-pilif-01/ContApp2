import { deleteStore, getStore, listStore, upsertStore } from "../state";
import { json, notFound, parseId, matchesQuery, type MockHandler } from "../shared";

const resourceMap = {
  clients: "clients",
  "contracts/templates": "templates",
  "contracts/template-fields": "templateFields",
  "contracts/invites": "invites",
  "contracts/submissions": "submissions",
  signatures: "signatures",
} as const;

type ResourceKey = keyof typeof resourceMap;

function withTemplateContent(row: Record<string, unknown>) {
  if (row.content_json) return row;
  const fields = listStore("templateFields")
    .filter((field) => Number(field.template_id) === Number(row.id))
    .sort((a, b) => Number(b.id) - Number(a.id));
  const latest = fields[0];
  if (!latest?.data) return { ...row, content_json: null };
  try {
    return {
      ...row,
      content_json: JSON.parse(String(latest.data)) as Record<string, unknown>,
    };
  } catch {
    return { ...row, content_json: null };
  }
}

export const resourceHandler: MockHandler = ({ path, method, body, query }) => {
  const noActor = path.replace(/^\/(user|admin)\//, "/").replace(/^\/+/, "");
  const parts = noActor.split("/").filter(Boolean);
  const resource2 = parts.slice(0, 2).join("/") as ResourceKey;
  const resource1 = (parts[0] ?? "") as ResourceKey;

  const resource = (resource2 in resourceMap ? resource2 : resource1) as ResourceKey;
  if (!(resource in resourceMap)) return null;

  const consumed = resource.includes("/") ? 2 : 1;
  const id = parseId(parts[consumed]);
  const storeName = resourceMap[resource];

  if (method === "GET" && id === null) {
    const rows = listStore(storeName).sort((a, b) => Number(b.id) - Number(a.id));
    const filtered = matchesQuery(rows, query, ["name", "title", "email", "status", "remarks"]);
    return json(
      resource === "contracts/templates"
        ? filtered.map(withTemplateContent)
        : filtered
    );
  }

  if (method === "GET" && id !== null) {
    const rec = getStore(storeName, id);
    return rec
      ? json(resource === "contracts/templates" ? withTemplateContent(rec) : rec)
      : notFound();
  }

  if (method === "POST" && id === null) {
    const created = upsertStore(storeName, body ?? {});
    if (resource === "contracts/invites" && !created.public_token) {
      const withToken = upsertStore(
        storeName,
        { ...created, public_token: `tok-${created.id}` },
        created.id
      );
      return json(withToken, 201);
    }
    return json(created, 201);
  }

  if (method === "PUT" && id !== null) {
    const existing = getStore(storeName, id);
    if (!existing) return notFound();
    const updated = upsertStore(storeName, body ?? {}, id);
    return json(updated);
  }

  if (method === "DELETE" && id !== null) {
    if (!deleteStore(storeName, id)) return notFound();
    return json({ message: `${resource} deleted` });
  }

  return null;
};
