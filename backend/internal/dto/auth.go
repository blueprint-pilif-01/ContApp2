package dto

import (
	"backend/internal/models"
	"backend/internal/platform/auth"
	"strings"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r *LoginRequest) Normalize() {
	r.Email = strings.ToLower(strings.TrimSpace(r.Email))
}

type LoginResponse struct {
	AccessToken string              `json:"access_token"`
	TokenType   string              `json:"token_type"`
	Account     *AccountResponse    `json:"account,omitempty"`
	Admin       *AdminResponse      `json:"admin,omitempty"`
	Workspace   *WorkspaceResponse  `json:"workspace,omitempty"`
	Workspaces  []WorkspaceResponse `json:"workspaces,omitempty"`
}

type AccountResponse struct {
	ID        int64  `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type AdminResponse struct {
	ID        int64  `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type WorkspaceResponse struct {
	MembershipID   int64  `json:"membership_id"`
	OrganisationID int64  `json:"organisation_id"`
	Name           string `json:"name"`
	RoleLabel      string `json:"role_label"`
}

type SwitchOrganisationRequest struct {
	OrganisationID int64 `json:"organisation_id"`
}

type AuthMeResponse struct {
	ActorType      string `json:"actor_type"`
	AccountID      int64  `json:"account_id,omitempty"`
	AdminID        int64  `json:"admin_id,omitempty"`
	OrganisationID int64  `json:"organisation_id,omitempty"`
	MembershipID   int64  `json:"membership_id,omitempty"`
	TokenUse       string `json:"token_use,omitempty"`
}

func AccountFromModel(account *models.Account) *AccountResponse {
	if account == nil {
		return nil
	}
	return &AccountResponse{
		ID:        account.ID,
		Email:     account.Email,
		FirstName: account.FirstName,
		LastName:  account.LastName,
	}
}

func AdminFromModel(admin *models.Admin) *AdminResponse {
	if admin == nil {
		return nil
	}
	return &AdminResponse{
		ID:        admin.ID,
		Email:     admin.Email,
		FirstName: admin.FirstName,
		LastName:  admin.LastName,
	}
}

func WorkspaceFromModel(workspace *models.AccountWorkspace) *WorkspaceResponse {
	if workspace == nil {
		return nil
	}

	roleLabel := ""
	if workspace.JobTitle != nil {
		roleLabel = *workspace.JobTitle
	}

	return &WorkspaceResponse{
		MembershipID:   workspace.MembershipID,
		OrganisationID: workspace.OrganisationID,
		Name:           workspace.Organisation,
		RoleLabel:      roleLabel,
	}
}

func WorkspacesFromModels(workspaces []models.AccountWorkspace) []WorkspaceResponse {
	out := make([]WorkspaceResponse, 0, len(workspaces))
	for i := range workspaces {
		out = append(out, *WorkspaceFromModel(&workspaces[i]))
	}
	return out
}

func AuthMeFromClaims(claims *auth.Claims) AuthMeResponse {
	if claims == nil {
		return AuthMeResponse{}
	}
	return AuthMeResponse{
		ActorType:      claims.ActorType,
		AccountID:      claims.AccountID,
		AdminID:        claims.AdminID,
		OrganisationID: claims.OrganisationID,
		MembershipID:   claims.MembershipID,
		TokenUse:       claims.TokenUse,
	}
}
