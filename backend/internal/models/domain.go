package models

import "time"

type Client struct {
	ID               int64
	OrganisationID   int64
	OwnerUserID      *int64
	ClientType       string
	FirstName        *string
	LastName         *string
	CompanyName      *string
	Email            *string
	Phone            *string
	CNP              *string
	CUI              *string
	TVA              bool
	ResponsibleName  *string
	ResponsibleEmail *string
	Address          *string
	Status           string
	CreatedAt        time.Time
	UpdatedAt        time.Time
	DeletedAt        *time.Time
}

type File struct {
	ID             int64
	OrganisationID int64
	UploadedByID   *int64
	StorageKey     string
	OriginalName   string
	MimeType       string
	SizeBytes      int64
	ChecksumSHA256 *string
	Category       *string
	CreatedAt      time.Time
	DeletedAt      *time.Time
}

type OrganisationDocument struct {
	ID             int64
	OrganisationID int64
	FileID         int64
	UploadedByID   *int64
	DocumentName   string
	DocumentType   *string
	Visibility     string
	Remarks        *string
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}

type ClientDocument struct {
	ID             int64
	OrganisationID int64
	ClientID       int64
	FileID         int64
	DocumentName   string
	FileType       *string
	Status         string
	ExpirationDate *time.Time
	Remarks        *string
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}

type ContractTemplate struct {
	ID             int64
	OrganisationID int64
	CreatedByID    int64
	Name           string
	ContractType   string
	ContentJSON    JSONB
	Status         string
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}

type ContractInvite struct {
	ID             int64
	OrganisationID int64
	TemplateID     int64
	ClientID       int64
	CreatedByID    int64
	TokenHash      string
	Status         string
	Remarks        *string
	ExpirationDate *time.Time
	SentAt         *time.Time
	ViewedAt       *time.Time
	RevokedAt      *time.Time
	SignedAt       *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}

type ContractSubmission struct {
	ID             int64
	OrganisationID int64
	InviteID       int64
	TemplateID     int64
	ClientID       int64
	FilledFields   JSONB
	SignatureImage []byte
	ContractNumber *string
	PDFFileID      *int64
	Status         string
	SignedAt       *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}

type WorkspaceNote struct {
	ID             int64
	OrganisationID int64
	OwnerUserID    int64
	ClientID       *int64
	Visibility     string
	Title          string
	Body           string
	Pinned         bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}

type TicketingTask struct {
	ID             int64
	OrganisationID int64
	CreatedByID    int64
	AssigneeUserID *int64
	ClientID       *int64
	Title          string
	Description    *string
	Status         string
	Priority       string
	SourceType     *string
	SourceID       *int64
	DueAt          *time.Time
	ClaimedAt      *time.Time
	CompletedAt    *time.Time
	RefusedAt      *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}

type Event struct {
	ID             int64
	OrganisationID *int64
	ActorType      *string
	ActorID        *int64
	EventType      string
	EntityType     *string
	EntityID       *int64
	Data           JSONB
	CreatedAt      time.Time
}
