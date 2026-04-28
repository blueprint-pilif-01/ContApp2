package repository

import (
	"backend/internal/models"
	"context"
	"database/sql"
)

type DatabaseRepo interface {
	Connection() *sql.DB
	IdentityRepository
	OrganisationRepository
	EntitlementRepository
	PermissionRepository
	ClientRepository
	DocumentRepository
	ContractRepository
	WorkspaceRepository
	TicketingRepository
}

type IdentityRepository interface {
	GetAdminByEmail(ctx context.Context, email string) (*models.Admin, error)
	GetAdminByID(ctx context.Context, id int64) (*models.Admin, error)
	GetAccountByEmail(ctx context.Context, email string) (*models.Account, error)
	GetAccountByID(ctx context.Context, id int64) (*models.Account, error)
	UpdateAccountLastLogin(ctx context.Context, id int64) error
	ListAccountWorkspaces(ctx context.Context, accountID int64) ([]models.AccountWorkspace, error)
	GetAccountWorkspace(ctx context.Context, accountID, organisationID int64) (*models.AccountWorkspace, error)
	CreateRefreshSession(ctx context.Context, session *models.RefreshSession) error
	GetRefreshSessionByJTI(ctx context.Context, jti string) (*models.RefreshSession, error)
	RevokeRefreshSessionByJTI(ctx context.Context, jti string) error
}

type OrganisationRepository interface {
	GetOrganisationByID(ctx context.Context, id int64) (*models.Organisation, error)
	GetOrganisationSettings(ctx context.Context, organisationID int64) (*models.OrganisationSettings, error)
	ListEmployeeCategories(ctx context.Context, organisationID int64) ([]models.EmployeeCategory, error)
}

type EntitlementRepository interface {
	ListOrganisationFeatures(ctx context.Context, organisationID int64) ([]models.OrganisationFeature, error)
	ListOrganisationFeatureLimits(ctx context.Context, organisationID int64) ([]models.OrganisationFeatureLimit, error)
}

type PermissionRepository interface {
	ListPermissionsForMembership(ctx context.Context, organisationID, membershipID int64) ([]string, error)
}

type ClientRepository interface {
	CreateClient(ctx context.Context, client *models.Client) error
	ListClients(ctx context.Context, organisationID int64) ([]models.Client, error)
	GetClient(ctx context.Context, organisationID, id int64) (*models.Client, error)
	UpdateClient(ctx context.Context, client *models.Client) error
	DeleteClient(ctx context.Context, organisationID, id int64) error
}

type DocumentRepository interface {
	CreateFile(ctx context.Context, file *models.File) error
	ListFiles(ctx context.Context, organisationID int64) ([]models.File, error)
	GetFile(ctx context.Context, organisationID, id int64) (*models.File, error)
	DeleteFile(ctx context.Context, organisationID, id int64) error
	CreateOrganisationDocument(ctx context.Context, document *models.OrganisationDocument) error
	ListOrganisationDocuments(ctx context.Context, organisationID int64) ([]models.OrganisationDocument, error)
	GetOrganisationDocument(ctx context.Context, organisationID, id int64) (*models.OrganisationDocument, error)
	DeleteOrganisationDocument(ctx context.Context, organisationID, id int64) error
	CreateClientDocument(ctx context.Context, document *models.ClientDocument) error
	ListClientDocuments(ctx context.Context, organisationID, clientID int64) ([]models.ClientDocument, error)
	GetClientDocument(ctx context.Context, organisationID, id int64) (*models.ClientDocument, error)
	DeleteClientDocument(ctx context.Context, organisationID, id int64) error
}

type ContractRepository interface {
	CreateContractTemplate(ctx context.Context, template *models.ContractTemplate) error
	ListContractTemplates(ctx context.Context, organisationID int64) ([]models.ContractTemplate, error)
	GetContractTemplate(ctx context.Context, organisationID, id int64) (*models.ContractTemplate, error)
	UpdateContractTemplate(ctx context.Context, template *models.ContractTemplate) error
	DeleteContractTemplate(ctx context.Context, organisationID, id int64) error
	CreateContractInvite(ctx context.Context, invite *models.ContractInvite) error
	ListContractInvites(ctx context.Context, organisationID int64) ([]models.ContractInvite, error)
	GetContractInvite(ctx context.Context, organisationID, id int64) (*models.ContractInvite, error)
	DeleteContractInvite(ctx context.Context, organisationID, id int64) error
	CreateContractSubmission(ctx context.Context, submission *models.ContractSubmission) error
	ListContractSubmissions(ctx context.Context, organisationID int64) ([]models.ContractSubmission, error)
	GetContractSubmission(ctx context.Context, organisationID, id int64) (*models.ContractSubmission, error)
	DeleteContractSubmission(ctx context.Context, organisationID, id int64) error
}

type WorkspaceRepository interface {
	CreateWorkspaceNote(ctx context.Context, note *models.WorkspaceNote) error
	ListWorkspaceNotes(ctx context.Context, organisationID, membershipID int64) ([]models.WorkspaceNote, error)
	GetWorkspaceNote(ctx context.Context, organisationID, membershipID, id int64) (*models.WorkspaceNote, error)
	UpdateWorkspaceNote(ctx context.Context, note *models.WorkspaceNote) error
	DeleteWorkspaceNote(ctx context.Context, organisationID, membershipID, id int64) error
}

type TicketingRepository interface {
	CreateTicketingTask(ctx context.Context, task *models.TicketingTask) error
	ListTicketingTasks(ctx context.Context, organisationID int64) ([]models.TicketingTask, error)
	GetTicketingTask(ctx context.Context, organisationID, id int64) (*models.TicketingTask, error)
	UpdateTicketingTask(ctx context.Context, task *models.TicketingTask) error
	DeleteTicketingTask(ctx context.Context, organisationID, id int64) error
}
