import { createResource } from "./createResource";
import type {
  ContractTemplateCreateRequest,
  ContractTemplateDTO,
} from "../lib/types";

export const TemplatesResource = createResource<
  ContractTemplateDTO,
  ContractTemplateCreateRequest
>({
  path: "contracts/templates",
  keyPrefix: "contract-templates",
});

export const TEMPLATES_KEY = TemplatesResource.key;
export const useTemplate = TemplatesResource.useById;
export const useCreateTemplate = TemplatesResource.useCreate;
export const useDeleteTemplate = TemplatesResource.useDelete;

export type { ContractTemplateCreateRequest, ContractTemplateDTO };
