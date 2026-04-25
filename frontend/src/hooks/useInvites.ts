import { createResource } from "./createResource";
import type {
  ContractInviteCreateRequest,
  ContractInviteDTO,
} from "../lib/types";

export const InvitesResource = createResource<
  ContractInviteDTO,
  ContractInviteCreateRequest
>({
  path: "contracts/invites",
  keyPrefix: "contract-invites",
});

export const INVITES_KEY = InvitesResource.key;
export const useInvite = InvitesResource.useById;
export const useCreateInvite = InvitesResource.useCreate;
export const useDeleteInvite = InvitesResource.useDelete;

export type { ContractInviteCreateRequest, ContractInviteDTO };
