/**
 * Request/response DTOs mirroring `backend/cmd/api/DTO.go`.
 * Kept intentionally narrow — only the fields the frontend touches.
 */

export interface JSONResponse<T = unknown> {
  error: boolean;
  message: string;
  data?: T;
}

export interface IDPayload {
  id: number;
}

// ── Users ───────────────────────────────────────────────────────────────────
export interface UserCreateRequest {
  organisation_id: number;
  type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  status: string;
  signature_id: number;
}

export interface UserCreateResponse {
  id: number;
  organisation_id: number;
  type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  signature_id: number;
  date_modified: string;
  date_added: string;
}

// ── Organisations ──────────────────────────────────────────────────────────
export interface OrganisationUpsertRequest {
  name: string;
  cui: number;
  address: string;
  status: string;
  subscription_id: number;
}

// Backend does not return orgs on read today — keep this narrow.
export interface OrganisationDTO {
  id: number;
  name: string;
  cui: number;
  address: string;
  status: string;
}

// ── Clients ────────────────────────────────────────────────────────────────
export interface ClientUpsertRequest {
  cnp: number;
  user_id: number;
  organisation_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  address: string;
  signature_id: number;
}

export interface ClientDTO extends ClientUpsertRequest {
  id: number;
}

// ── Client Organisations ───────────────────────────────────────────────────
export interface ClientOrganisationUpsertRequest {
  cui: number;
  user_id: number;
  organisation_id: number;
  responsible_name: string;
  responsible_email: string;
  phone: string;
  status: string;
  tva: boolean;
  address: string;
  type: string;
  signature_id: number;
}

export interface ClientOrganisationDTO extends ClientOrganisationUpsertRequest {
  id: number;
}

// ── Signatures ─────────────────────────────────────────────────────────────
export interface SignatureCreateRequest {
  name: string;
  file_id: number;
  owner_id: number;
}

export interface SignatureDTO {
  id: number;
  name: string;
  file_id: number;
  owner_id: number;
  date_added: string;
}

// ── Subscription Plans ─────────────────────────────────────────────────────
export interface SubscriptionPlanCreateRequest {
  slug: number;
  name: string;
  price: number;
  stripe_price_id: number;
  limits_json: unknown;
  features_json: unknown;
}

export interface SubscriptionPlanDTO {
  id: number;
  slug: number;
  name: string;
  price: number;
  stripe_price_id: number;
  limits_json: unknown;
  features_json: unknown;
}

// ── Subscriptions ──────────────────────────────────────────────────────────
export interface SubscriptionCreateRequest {
  subscription_plan_id: number;
  organisation_id: number;
  status: string;
  stripe_subscription_id: number;
  current_period_end: string;
}

export interface SubscriptionDTO {
  id: number;
  subscription_plan_id: number;
  organisation_id: number;
  status: string;
  stripe_subscription_id: number;
  current_period_end: string;
  date_added: string;
}

// ── Files ──────────────────────────────────────────────────────────────────
export interface FileCreateRequest {
  organisation_id: number;
  uploaded_by_id: number;
  category: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
}

export interface FileDTO {
  id: number;
  organisation_id: number;
  uploaded_by_id: number;
  category: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  date_added: string;
}

// ── Contract Templates ─────────────────────────────────────────────────────
export interface ContractTemplateCreateRequest {
  user_id: number;
  organisation_id: number;
  name: string;
  contract_type: string;
}

export interface ContractTemplateDTO {
  id: number;
  user_id: number;
  organisation_id: number;
  name: string;
  contract_type: string;
  date_added: string;
}

// ── Template Fields ────────────────────────────────────────────────────────
export interface TemplateFieldCreateRequest {
  template_id: number;
  data: string;
  date_modified: string;
  date_added: string;
}

export interface TemplateFieldDTO {
  id?: number;
  template_id: number;
  data: string;
  date_modified: string;
  date_added: string;
}

// ── Contract Invites ───────────────────────────────────────────────────────
export interface ContractInviteCreateRequest {
  template_id: number;
  user_id: number;
  client_id: number;
  remarks: string;
  expiration_date: string;
}

export interface ContractInviteDTO {
  id: number;
  template_id: number;
  user_id: number;
  client_id: number;
  remarks: string;
  expiration_date: string;
  date_added: string;
}

// ── Contract Submissions ───────────────────────────────────────────────────
export interface ContractSubmissionCreateRequest {
  invite_id: number;
  user_id: number;
  client_id: number;
  pdf_file_id: number;
  remarks: string;
  status: string;
  expiration_date: string;
}

export interface ContractSubmissionDTO {
  id: number;
  invite_id: number;
  user_id: number;
  client_id: number;
  pdf_file_id: number;
  remarks: string;
  status: string;
  expiration_date: string;
  date_added: string;
}

// ── Events ─────────────────────────────────────────────────────────────────
export interface EventCreateRequest {
  owner_id: number;
  event_trigger_type: string;
  event_type: string;
  data: string;
  state_created: string;
}

export interface EventDTO {
  id: number;
  owner_id: number;
  event_trigger_type: string;
  event_type: string;
  data: string;
  state_created: string;
}

// ── Notes ──────────────────────────────────────────────────────────────────
export interface NoteCreateRequest {
  owner_id: number;
  name: string;
  data: string;
  date_modified: string;
  date_added: string;
}

export interface NoteDTO {
  id: number;
  owner_id: number;
  name: string;
  data: string;
  date_modified: string;
  date_added: string;
}

// ── Notifications ──────────────────────────────────────────────────────────
export interface NotificationCreateRequest {
  user_id: number;
  name: string;
  data: string;
  timer: string;
}

export interface NotificationDTO {
  id: number;
  user_id: number;
  name: string;
  data: string;
  timer: string;
  date_added: string;
}

// ── Tasks ──────────────────────────────────────────────────────────────────
export interface TaskCreateRequest {
  owner_id: number;
  assignee_id: number;
  name: string;
  data: string;
  expiration_date: string;
  task_status: string;
}

export interface TaskDTO {
  id: number;
  owner_id: number;
  assignee_id: number;
  name: string;
  data: string;
  expiration_date: string;
  task_status: string;
  date_added: string;
}

// ── Client Documents ───────────────────────────────────────────────────────
export interface ClientDocumentCreateRequest {
  document_name: string;
  user_id: number;
  client_id: number;
  remarks: string;
  file_id: number;
  file_type: string;
  status: string;
  expiration_date: string;
  signature_id: number;
}

export interface ClientDocumentDTO extends ClientDocumentCreateRequest {
  id: number;
  date_added: string;
}
