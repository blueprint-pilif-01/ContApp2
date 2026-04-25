import { createResource } from "./createResource";
import type { ClientDTO, ClientUpsertRequest } from "../lib/types";

export const ClientsResource = createResource<ClientDTO, ClientUpsertRequest>({
  path: "clients",
  keyPrefix: "clients",
});

export const CLIENTS_KEY = ClientsResource.key;
export const useClient = ClientsResource.useById;
export const useCreateClient = ClientsResource.useCreate;
export const useUpdateClient = ClientsResource.useUpdate;
export const useDeleteClient = ClientsResource.useDelete;

export type { ClientDTO, ClientUpsertRequest };
