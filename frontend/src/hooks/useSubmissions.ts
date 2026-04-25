import { createResource } from "./createResource";
import type {
  ContractSubmissionCreateRequest,
  ContractSubmissionDTO,
} from "../lib/types";

export const SubmissionsResource = createResource<
  ContractSubmissionDTO,
  ContractSubmissionCreateRequest
>({
  path: "contracts/submissions",
  keyPrefix: "contract-submissions",
});

export const SUBMISSIONS_KEY = SubmissionsResource.key;
export const useSubmission = SubmissionsResource.useById;
export const useCreateSubmission = SubmissionsResource.useCreate;
export const useDeleteSubmission = SubmissionsResource.useDelete;

export type { ContractSubmissionCreateRequest, ContractSubmissionDTO };
