package models

import "time"

type Client struct {
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

type File struct {
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

type OrganisationDocument struct {
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

type ClientDocument struct {
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

type ContractTemplate struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	CreatedByID    int64      `json:"created_by_id"`
	Name           string     `json:"name"`
	ContractType   string     `json:"contract_type"`
	ContentJSON    JSONB      `json:"content_json"`
	Status         string     `json:"status"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

type ContractInvite struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	TemplateID     int64      `json:"template_id"`
	ClientID       int64      `json:"client_id"`
	CreatedByID    int64      `json:"created_by_id"`
	TokenHash      string     `json:"token_hash"`
	Status         string     `json:"status"`
	Remarks        *string    `json:"remarks,omitempty"`
	ExpirationDate *time.Time `json:"expiration_date,omitempty"`
	SentAt         *time.Time `json:"sent_at,omitempty"`
	ViewedAt       *time.Time `json:"viewed_at,omitempty"`
	RevokedAt      *time.Time `json:"revoked_at,omitempty"`
	SignedAt       *time.Time `json:"signed_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

type ContractSubmission struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	InviteID       int64      `json:"invite_id"`
	TemplateID     int64      `json:"template_id"`
	ClientID       int64      `json:"client_id"`
	FilledFields   JSONB      `json:"filled_fields"`
	SignatureImage []byte     `json:"signature_image,omitempty"`
	ContractNumber *string    `json:"contract_number,omitempty"`
	PDFFileID      *int64     `json:"pdf_file_id,omitempty"`
	Status         string     `json:"status"`
	SignedAt       *time.Time `json:"signed_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

type WorkspaceNote struct {
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

type TicketingTask struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	CreatedByID    int64      `json:"created_by_id"`
	AssigneeUserID *int64     `json:"assignee_user_id,omitempty"`
	ClientID       *int64     `json:"client_id,omitempty"`
	Title          string     `json:"title"`
	Description    *string    `json:"description,omitempty"`
	Status         string     `json:"status"`
	Priority       string     `json:"priority"`
	SourceType     *string    `json:"source_type,omitempty"`
	SourceID       *int64     `json:"source_id,omitempty"`
	DueAt          *time.Time `json:"due_at,omitempty"`
	ClaimedAt      *time.Time `json:"claimed_at,omitempty"`
	CompletedAt    *time.Time `json:"completed_at,omitempty"`
	RefusedAt      *time.Time `json:"refused_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

type Event struct {
	ID             int64     `json:"id"`
	OrganisationID *int64    `json:"organisation_id,omitempty"`
	ActorType      *string   `json:"actor_type,omitempty"`
	ActorID        *int64    `json:"actor_id,omitempty"`
	EventType      string    `json:"event_type"`
	EntityType     *string   `json:"entity_type,omitempty"`
	EntityID       *int64    `json:"entity_id,omitempty"`
	Data           JSONB     `json:"data"`
	CreatedAt      time.Time `json:"created_at"`
}
