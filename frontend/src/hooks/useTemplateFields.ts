import { createResource } from "./createResource";
import type {
  TemplateFieldCreateRequest,
  TemplateFieldDTO,
} from "../lib/types";

export const TemplateFieldsResource = createResource<
  TemplateFieldDTO,
  TemplateFieldCreateRequest
>({
  path: "contracts/template-fields",
  keyPrefix: "template-fields",
});

export const TEMPLATE_FIELDS_KEY = TemplateFieldsResource.key;
export const useTemplateField = TemplateFieldsResource.useById;
export const useCreateTemplateField = TemplateFieldsResource.useCreate;
export const useDeleteTemplateField = TemplateFieldsResource.useDelete;

export type { TemplateFieldCreateRequest, TemplateFieldDTO };
