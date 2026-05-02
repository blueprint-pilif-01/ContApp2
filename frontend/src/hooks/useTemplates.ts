import { createResource } from "./createResource";
import type {
  ContractTemplateCreateRequest,
  ContractTemplateDTO,
  ContractTemplateUpdateRequest,
} from "../lib/types";

export const TemplatesResource = createResource<
  ContractTemplateDTO,
  ContractTemplateCreateRequest,
  ContractTemplateUpdateRequest
>({
  path: "contracts/templates",
  keyPrefix: "contract-templates",
});

export const TEMPLATES_KEY = TemplatesResource.key;
export const useTemplate = TemplatesResource.useById;
export const useCreateTemplate = TemplatesResource.useCreate;
export const useUpdateTemplate = TemplatesResource.useUpdate;
export const useDeleteTemplate = TemplatesResource.useDelete;

export type {
  ContractTemplateCreateRequest,
  ContractTemplateDTO,
  ContractTemplateUpdateRequest,
};
