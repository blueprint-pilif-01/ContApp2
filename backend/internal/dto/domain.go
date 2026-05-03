package dto

import (
	"backend/internal/models"
	"time"
)

type EmployeeCategoryRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	Color       *string `json:"color,omitempty"`
}

type FileRequest struct {
	StorageKey     string  `json:"storage_key"`
	OriginalName   string  `json:"original_name"`
	MimeType       string  `json:"mime_type"`
	SizeBytes      int64   `json:"size_bytes"`
	ChecksumSHA256 *string `json:"checksum_sha256,omitempty"`
	Category       *string `json:"category,omitempty"`
}

type OrganisationDocumentRequest struct {
	FileID       int64   `json:"file_id"`
	DocumentName string  `json:"document_name"`
	DocumentType *string `json:"document_type,omitempty"`
	Visibility   string  `json:"visibility"`
	Remarks      *string `json:"remarks,omitempty"`
}

type ClientDocumentRequest struct {
	ClientID       int64      `json:"client_id"`
	FileID         int64      `json:"file_id"`
	DocumentName   string     `json:"document_name"`
	FileType       *string    `json:"file_type,omitempty"`
	Status         string     `json:"status"`
	ExpirationDate *time.Time `json:"expiration_date,omitempty"`
	Remarks        *string    `json:"remarks,omitempty"`
}

type WorkspaceNoteRequest struct {
	ClientID   *int64 `json:"client_id,omitempty"`
	Visibility string `json:"visibility"`
	Title      string `json:"title"`
	Body       string `json:"body"`
	Pinned     bool   `json:"pinned"`
}

type ContractInviteRequest struct {
	TemplateID     int64      `json:"template_id"`
	ClientID       int64      `json:"client_id"`
	TokenHash      string     `json:"token_hash"`
	PublicToken    string     `json:"public_token"`
	Status         string     `json:"status"`
	Remarks        *string    `json:"remarks,omitempty"`
	ExpirationDate *time.Time `json:"expiration_date,omitempty"`
	UserID         int64      `json:"user_id"`
	DateAdded      string     `json:"date_added"`
	DateModified   string     `json:"date_modified"`
}

type ContractSubmissionRequest struct {
	InviteID       int64        `json:"invite_id"`
	TemplateID     int64        `json:"template_id"`
	ClientID       int64        `json:"client_id"`
	FilledFields   models.JSONB `json:"filled_fields"`
	SignatureImage *string      `json:"signature_image"`
	ContractNumber *string      `json:"contract_number,omitempty"`
	PDFFileID      *int64       `json:"pdf_file_id,omitempty"`
	Status         string       `json:"status"`
	SignedAt       *time.Time   `json:"signed_at,omitempty"`
	UserID         int64        `json:"user_id"`
	Remarks        string       `json:"remarks"`
	ExpirationDate string       `json:"expiration_date"`
	DateAdded      string       `json:"date_added"`
	DateModified   string       `json:"date_modified"`
}

type TicketingTaskRequest struct {
	AssigneeID     *int64     `json:"assignee_id"`
	AssigneeUserID *int64     `json:"assignee_user_id"`
	OwnerID        *int64     `json:"owner_id"`
	ClientID       *int64     `json:"client_id"`
	Title          string     `json:"title"`
	Description    *string    `json:"description,omitempty"`
	Status         string     `json:"status"`
	Priority       string     `json:"priority"`
	SourceType     *string    `json:"source_type,omitempty"`
	SourceID       *int64     `json:"source_id,omitempty"`
	DueAt          *time.Time `json:"due_at,omitempty"`
	DueDate        *time.Time `json:"due_date,omitempty"`
}

type EmployeeCategoryResponse struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	Name           string     `json:"name"`
	Description    *string    `json:"description,omitempty"`
	Color          *string    `json:"color,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

type ClientResponse struct {
	ID               int64      `json:"id"`
	OrganisationID   int64      `json:"organisation_id"`
	OwnerUserID      *int64     `json:"owner_user_id,omitempty"`
	ClientType       string     `json:"client_type"`
	FirstName        *string    `json:"first_name,omitempty"`
	LastName         *string    `json:"last_name,omitempty"`
	CompanyName      *string    `json:"company_name,omitempty"`
	Email            *string    `json:"email,omitempty"`
	Phone            *string    `json:"phone,omitempty"`
	CNP              *string    `json:"cnp,omitempty"`
	CUI              *string    `json:"cui,omitempty"`
	TVA              bool       `json:"tva"`
	ResponsibleName  *string    `json:"responsible_name,omitempty"`
	ResponsibleEmail *string    `json:"responsible_email,omitempty"`
	Address          *string    `json:"address,omitempty"`
	Status           string     `json:"status"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
}

type FileResponse struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	UploadedByID   *int64     `json:"uploaded_by_id,omitempty"`
	StorageKey     string     `json:"storage_key"`
	OriginalName   string     `json:"original_name"`
	MimeType       string     `json:"mime_type"`
	SizeBytes      int64      `json:"size_bytes"`
	ChecksumSHA256 *string    `json:"checksum_sha256,omitempty"`
	Category       *string    `json:"category,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

type OrganisationDocumentResponse struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	FileID         int64      `json:"file_id"`
	UploadedByID   *int64     `json:"uploaded_by_id,omitempty"`
	DocumentName   string     `json:"document_name"`
	DocumentType   *string    `json:"document_type,omitempty"`
	Visibility     string     `json:"visibility"`
	Remarks        *string    `json:"remarks,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

type ClientDocumentResponse struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	ClientID       int64      `json:"client_id"`
	FileID         int64      `json:"file_id"`
	DocumentName   string     `json:"document_name"`
	FileType       *string    `json:"file_type,omitempty"`
	Status         string     `json:"status"`
	ExpirationDate *time.Time `json:"expiration_date,omitempty"`
	Remarks        *string    `json:"remarks,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

type WorkspaceNoteResponse struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	OwnerUserID    int64      `json:"owner_user_id"`
	ClientID       *int64     `json:"client_id,omitempty"`
	Visibility     string     `json:"visibility"`
	Title          string     `json:"title"`
	Body           string     `json:"body"`
	Pinned         bool       `json:"pinned"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

type ContractTemplateResponse struct {
	ID             int64        `json:"id"`
	OrganisationID int64        `json:"organisation_id"`
	CreatedByID    int64        `json:"created_by_id"`
	Name           string       `json:"name"`
	ContractType   string       `json:"contract_type"`
	ContentJSON    models.JSONB `json:"content_json"`
	Status         string       `json:"status"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
	DeletedAt      *time.Time   `json:"deleted_at,omitempty"`
}

type ContractInviteResponse struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	TemplateID     int64      `json:"template_id"`
	ClientID       int64      `json:"client_id"`
	UserID         int64      `json:"user_id"`
	CreatedByID    int64      `json:"created_by_id"`
	TokenHash      string     `json:"token_hash"`
	PublicToken    string     `json:"public_token"`
	Status         string     `json:"status"`
	Remarks        *string    `json:"remarks,omitempty"`
	ExpirationDate *time.Time `json:"expiration_date,omitempty"`
	SentAt         *time.Time `json:"sent_at,omitempty"`
	ViewedAt       *time.Time `json:"viewed_at,omitempty"`
	RevokedAt      *time.Time `json:"revoked_at,omitempty"`
	SignedAt       *time.Time `json:"signed_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DateAdded      time.Time  `json:"date_added"`
	DateModified   time.Time  `json:"date_modified"`
}

type ContractSubmissionResponse struct {
	ID             int64        `json:"id"`
	OrganisationID int64        `json:"organisation_id"`
	InviteID       int64        `json:"invite_id"`
	TemplateID     int64        `json:"template_id"`
	ClientID       int64        `json:"client_id"`
	FilledFields   models.JSONB `json:"filled_fields"`
	SignatureImage []byte       `json:"signature_image,omitempty"`
	ContractNumber *string      `json:"contract_number,omitempty"`
	PDFFileID      *int64       `json:"pdf_file_id,omitempty"`
	Status         string       `json:"status"`
	SignedAt       *time.Time   `json:"signed_at,omitempty"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
	DeletedAt      *time.Time   `json:"deleted_at,omitempty"`
}

type TicketingTaskResponse struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	CreatedByID    int64      `json:"created_by_id"`
	UserID         int64      `json:"user_id"`
	OwnerID        int64      `json:"owner_id"`
	AssigneeUserID *int64     `json:"assignee_user_id,omitempty"`
	AssigneeID     *int64     `json:"assignee_id,omitempty"`
	ClientID       *int64     `json:"client_id,omitempty"`
	Title          string     `json:"title"`
	Description    *string    `json:"description,omitempty"`
	Status         string     `json:"status"`
	Priority       string     `json:"priority"`
	SourceType     *string    `json:"source_type,omitempty"`
	Source         *string    `json:"source,omitempty"`
	SourceID       *int64     `json:"source_id,omitempty"`
	DueAt          *time.Time `json:"due_at,omitempty"`
	DueDate        *time.Time `json:"due_date,omitempty"`
	ClaimedAt      *time.Time `json:"claimed_at,omitempty"`
	CompletedAt    *time.Time `json:"completed_at,omitempty"`
	RefusedAt      *time.Time `json:"refused_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
	DateAdded      time.Time  `json:"date_added"`
	DateModified   time.Time  `json:"date_modified"`
}

func EmployeeCategoryFromModel(category models.EmployeeCategory) EmployeeCategoryResponse {
	return EmployeeCategoryResponse(category)
}

func EmployeeCategoriesFromModels(categories []models.EmployeeCategory) []EmployeeCategoryResponse {
	out := make([]EmployeeCategoryResponse, 0, len(categories))
	for _, category := range categories {
		out = append(out, EmployeeCategoryFromModel(category))
	}
	return out
}

func ClientFromModel(client models.Client) ClientResponse {
	return ClientResponse(client)
}

func ClientsFromModels(clients []models.Client) []ClientResponse {
	out := make([]ClientResponse, 0, len(clients))
	for _, client := range clients {
		out = append(out, ClientFromModel(client))
	}
	return out
}

func FileFromModel(file models.File) FileResponse {
	return FileResponse(file)
}

func FilesFromModels(files []models.File) []FileResponse {
	out := make([]FileResponse, 0, len(files))
	for _, file := range files {
		out = append(out, FileFromModel(file))
	}
	return out
}

func OrganisationDocumentFromModel(document models.OrganisationDocument) OrganisationDocumentResponse {
	return OrganisationDocumentResponse(document)
}

func OrganisationDocumentsFromModels(documents []models.OrganisationDocument) []OrganisationDocumentResponse {
	out := make([]OrganisationDocumentResponse, 0, len(documents))
	for _, document := range documents {
		out = append(out, OrganisationDocumentFromModel(document))
	}
	return out
}

func ClientDocumentFromModel(document models.ClientDocument) ClientDocumentResponse {
	return ClientDocumentResponse(document)
}

func ClientDocumentsFromModels(documents []models.ClientDocument) []ClientDocumentResponse {
	out := make([]ClientDocumentResponse, 0, len(documents))
	for _, document := range documents {
		out = append(out, ClientDocumentFromModel(document))
	}
	return out
}

func WorkspaceNoteFromModel(note models.WorkspaceNote) WorkspaceNoteResponse {
	return WorkspaceNoteResponse(note)
}

func WorkspaceNotesFromModels(notes []models.WorkspaceNote) []WorkspaceNoteResponse {
	out := make([]WorkspaceNoteResponse, 0, len(notes))
	for _, note := range notes {
		out = append(out, WorkspaceNoteFromModel(note))
	}
	return out
}

func ContractTemplateFromModel(template models.ContractTemplate) ContractTemplateResponse {
	return ContractTemplateResponse(template)
}

func ContractTemplatesFromModels(templates []models.ContractTemplate) []ContractTemplateResponse {
	out := make([]ContractTemplateResponse, 0, len(templates))
	for _, template := range templates {
		out = append(out, ContractTemplateFromModel(template))
	}
	return out
}

func ContractInviteFromModel(invite models.ContractInvite) ContractInviteResponse {
	return ContractInviteResponse{
		ID:             invite.ID,
		OrganisationID: invite.OrganisationID,
		TemplateID:     invite.TemplateID,
		ClientID:       invite.ClientID,
		UserID:         invite.CreatedByID,
		CreatedByID:    invite.CreatedByID,
		TokenHash:      invite.TokenHash,
		PublicToken:    invite.TokenHash,
		Status:         invite.Status,
		Remarks:        invite.Remarks,
		ExpirationDate: invite.ExpirationDate,
		SentAt:         invite.SentAt,
		ViewedAt:       invite.ViewedAt,
		RevokedAt:      invite.RevokedAt,
		SignedAt:       invite.SignedAt,
		CreatedAt:      invite.CreatedAt,
		UpdatedAt:      invite.UpdatedAt,
		DateAdded:      invite.CreatedAt,
		DateModified:   invite.UpdatedAt,
	}
}

func ContractInvitesFromModels(invites []models.ContractInvite) []ContractInviteResponse {
	out := make([]ContractInviteResponse, 0, len(invites))
	for _, invite := range invites {
		out = append(out, ContractInviteFromModel(invite))
	}
	return out
}

func ContractSubmissionFromModel(submission models.ContractSubmission) ContractSubmissionResponse {
	return ContractSubmissionResponse(submission)
}

func ContractSubmissionsFromModels(submissions []models.ContractSubmission) []ContractSubmissionResponse {
	out := make([]ContractSubmissionResponse, 0, len(submissions))
	for _, submission := range submissions {
		out = append(out, ContractSubmissionFromModel(submission))
	}
	return out
}

func TicketingTaskFromModel(task models.TicketingTask) TicketingTaskResponse {
	dueAt := task.DueAt
	if dueAt == nil {
		fallback := task.CreatedAt.Add(24 * time.Hour)
		dueAt = &fallback
	}
	return TicketingTaskResponse{
		ID:             task.ID,
		OrganisationID: task.OrganisationID,
		CreatedByID:    task.CreatedByID,
		UserID:         task.CreatedByID,
		OwnerID:        task.CreatedByID,
		AssigneeUserID: task.AssigneeUserID,
		AssigneeID:     task.AssigneeUserID,
		ClientID:       task.ClientID,
		Title:          task.Title,
		Description:    task.Description,
		Status:         frontendTicketStatus(task.Status),
		Priority:       frontendTicketPriority(task.Priority),
		SourceType:     task.SourceType,
		Source:         task.SourceType,
		SourceID:       task.SourceID,
		DueAt:          dueAt,
		DueDate:        dueAt,
		ClaimedAt:      task.ClaimedAt,
		CompletedAt:    task.CompletedAt,
		RefusedAt:      task.RefusedAt,
		CreatedAt:      task.CreatedAt,
		UpdatedAt:      task.UpdatedAt,
		DeletedAt:      task.DeletedAt,
		DateAdded:      task.CreatedAt,
		DateModified:   task.UpdatedAt,
	}
}

func frontendTicketStatus(status string) string {
	if status == "in_work" {
		return "in_progress"
	}
	return status
}

func frontendTicketPriority(priority string) string {
	if priority == "normal" {
		return "medium"
	}
	return priority
}

func TicketingTasksFromModels(tasks []models.TicketingTask) []TicketingTaskResponse {
	out := make([]TicketingTaskResponse, 0, len(tasks))
	for _, task := range tasks {
		out = append(out, TicketingTaskFromModel(task))
	}
	return out
}
