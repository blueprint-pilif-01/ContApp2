package app

import (
	"backend/internal/platform/httpx"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func (a *App) routes() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(a.logRequest)
	r.Use(middleware.Recoverer)
	r.Use(a.cors)
	r.NotFound(a.notFound)
	r.MethodNotAllowed(a.methodNotAllowed)

	r.Get("/health", a.health)
	r.Get("/ready", a.ready)

	r.Route(a.Config.APIBasePath, func(v1 chi.Router) {
		v1.Get("/health", a.health)
		v1.Get("/ready", a.ready)

		v1.Post("/auth/user/login", a.loginAccount)
		v1.Post("/auth/admin/login", a.loginAdmin)
		v1.Post("/auth/login", a.loginAccount)
		v1.Get("/auth/refresh-token", a.refreshToken)
		v1.Post("/auth/logout", a.logout)
		v1.Get("/public/sign/{token}", a.getPublicSignInvite)
		v1.Post("/public/sign/{token}", a.submitPublicSignInvite)

		v1.Group(func(protected chi.Router) {
			protected.Use(a.requireAuth)
			protected.Get("/auth/me", a.authMe)
			protected.Get("/auth/organisations", a.listAccountOrganisations)
			protected.Post("/auth/switch-organisation", a.switchOrganisation)
			protected.Get("/organisations/me/extensions", a.getCurrentOrganisationExtensions)
			protected.Get("/organisations/me/subscription", a.getCurrentOrganisationSubscription)
			protected.Get("/dashboard/overview", a.getDashboardOverview)
			protected.Get("/notifications", a.listNotifications)
			protected.Post("/notifications/read-all", a.markAllNotificationsRead)
			protected.Post("/notifications/{id}/read", a.markNotificationRead)
			a.mountProtectedRoutes(protected)
		})
	})

	return r
}

func (a *App) notFound(w http.ResponseWriter, r *http.Request) {
	a.Logger.Warn("route not found", "method", r.Method, "path", r.URL.Path, "remote_addr", r.RemoteAddr)
	httpx.Error(w, http.StatusNotFound, "route not found")
}

func (a *App) methodNotAllowed(w http.ResponseWriter, r *http.Request) {
	a.Logger.Warn("method not allowed", "method", r.Method, "path", r.URL.Path, "remote_addr", r.RemoteAddr)
	httpx.Error(w, http.StatusMethodNotAllowed, "method not allowed")
}

func (a *App) mountProtectedRoutes(r chi.Router) {
	r.Group(func(admin chi.Router) {
		admin.Use(a.requireAdmin)
		admin.Get("/admin/dashboard", a.getAdminDashboard)
		admin.Get("/admin/users", a.listAdminUsers)
		admin.Post("/admin/users", a.createAdminUser)
		admin.Put("/admin/users/{id}", a.updateAdminUser)
		admin.Delete("/admin/users/{id}", a.deleteAdminUser)
		admin.Post("/admin/users/{id}/impersonate", a.impersonateAdminUser)
		admin.Get("/admin/organisations", a.listAdminOrganisations)
		admin.Post("/admin/organisations", a.createAdminOrganisation)
		admin.Get("/admin/organisations/{id}", a.getAdminOrganisation)
		admin.Put("/admin/organisations/{id}", a.updateAdminOrganisation)
		admin.Delete("/admin/organisations/{id}", a.deleteAdminOrganisation)
		admin.Post("/admin/organisations/{id}/suspend", a.adminOrganisationStatusAction)
		admin.Post("/admin/organisations/{id}/restore", a.adminOrganisationStatusAction)
		admin.Patch("/admin/organisations/{id}/status", a.updateAdminOrganisationStatus)
		admin.Get("/admin/organisations/{id}/features", a.listAdminOrganisationFeatures)
		admin.Get("/admin/organisations/{id}/extensions", a.getAdminOrganisationExtensions)
		admin.Put("/admin/organisations/{id}/extensions", a.updateAdminOrganisationExtensions)
		admin.Get("/admin/organisations/{id}/subscriptions", a.listAdminOrganisationSubscriptions)
	})

	r.With(a.requirePermission(PermMembersRead)).Get("/members", a.listMembers)
	r.With(a.requirePermission(PermMembersWrite)).Post("/members", a.createMember)
	r.With(a.requirePermission(PermMembersRead)).Get("/members/{id}", a.getMember)
	r.With(a.requirePermission(PermMembersWrite)).Patch("/members/{id}", a.updateMember)
	r.With(a.requirePermission(PermMembersWrite)).Patch("/members/{id}/status", a.updateMemberStatus)
	r.With(a.requirePermission(PermRolesWrite)).Put("/members/{id}/roles", a.setMemberRoles)

	r.With(a.requirePermission(PermCategoriesRead)).Get("/employee-categories", a.listEmployeeCategories)
	r.With(a.requirePermission(PermCategoriesWrite)).Post("/employee-categories", a.createEmployeeCategory)
	r.With(a.requirePermission(PermCategoriesWrite)).Patch("/employee-categories/{id}", a.updateEmployeeCategory)
	r.With(a.requirePermission(PermCategoriesDelete)).Delete("/employee-categories/{id}", a.deleteEmployeeCategory)

	r.With(a.requirePermission(PermRolesRead)).Get("/roles", a.listRoles)
	r.With(a.requirePermission(PermRolesRead)).Get("/permissions", a.listPermissions)
	r.With(a.requirePermission(PermMembersRead)).Get("/activity-log", a.listActivityLog)
	r.With(a.requirePermission(PermTicketingRead)).Get("/planner/smart", a.getPlannerSmart)
	r.With(a.requirePermission(PermMembersRead)).Get("/planner/events", a.listPlannerEvents)
	r.With(a.requirePermission(PermMembersWrite)).Post("/planner/events", a.createPlannerEvent)
	r.With(a.requirePermission(PermMembersWrite)).Delete("/planner/events/{id}", a.deletePlannerEvent)

	r.With(a.requirePermission(PermMembersRead)).Get("/settings/users", a.listSettingsUsers)
	r.With(a.requirePermission(PermMembersWrite)).Post("/settings/users", a.createSettingsUser)
	r.With(a.requirePermission(PermMembersRead)).Get("/settings/users/{id}", a.getSettingsUser)
	r.With(a.requirePermission(PermMembersWrite)).Put("/settings/users/{id}", a.updateSettingsUser)
	r.With(a.requirePermission(PermMembersDelete)).Delete("/settings/users/{id}", a.deleteSettingsUser)
	r.With(a.requirePermission(PermMembersWrite)).Post("/settings/users/{id}/invite", a.sendSettingsUserInvite)
	r.With(a.requirePermission(PermMembersWrite)).Post("/settings/users/{id}/reset-password", a.resetSettingsUserPassword)
	r.With(a.requirePermission(PermRolesRead)).Get("/settings/roles", a.listSettingsRoles)
	r.With(a.requirePermission(PermRolesWrite)).Post("/settings/roles", a.createSettingsRole)
	r.With(a.requirePermission(PermRolesWrite)).Put("/settings/roles/{id}", a.updateSettingsRole)
	r.With(a.requirePermission(PermRolesWrite)).Delete("/settings/roles/{id}", a.deleteSettingsRole)
	r.With(a.requirePermission(PermRolesRead)).Get("/settings/permissions/effective/{id}", a.getEffectiveSettingsPermissions)
	r.With(a.requirePermission(PermCategoriesRead)).Get("/settings/employee-categories", a.listEmployeeCategories)
	r.With(a.requirePermission(PermCategoriesWrite)).Post("/settings/employee-categories", a.createEmployeeCategory)
	r.With(a.requirePermission(PermCategoriesWrite)).Put("/settings/employee-categories/{id}", a.updateEmployeeCategory)
	r.With(a.requirePermission(PermCategoriesDelete)).Delete("/settings/employee-categories/{id}", a.deleteEmployeeCategory)

	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermClientsRead)).Get("/clients", a.listClients)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermClientsWrite)).Post("/clients", a.createClient)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermClientsRead)).Get("/clients/{id}", a.getClient)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermClientsWrite)).Put("/clients/{id}", a.updateClient)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermClientsDelete)).Delete("/clients/{id}", a.deleteClient)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/clients/{id}/documents", a.listClientDocuments)

	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/files", a.listFiles)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsWrite)).Post("/files", a.createFile)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/files/{id}", a.getFile)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsDelete)).Delete("/files/{id}", a.deleteFile)

	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/documents", a.listDocumentManagerItems)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsWrite)).Post("/documents/upload", a.uploadDocumentManagerItem)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsDelete)).Delete("/documents/{id}", a.deleteDocumentManagerItem)

	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/organisation-documents", a.listOrganisationDocuments)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsWrite)).Post("/organisation-documents", a.createOrganisationDocument)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/organisation-documents/{id}", a.getOrganisationDocument)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsDelete)).Delete("/organisation-documents/{id}", a.deleteOrganisationDocument)

	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsWrite)).Post("/client-documents", a.createClientDocument)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/client-documents/{id}", a.getClientDocument)
	r.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsDelete)).Delete("/client-documents/{id}", a.deleteClientDocument)

	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/templates", a.listContractTemplates)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Post("/contracts/templates", a.createContractTemplate)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/templates/{id}", a.getContractTemplate)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Put("/contracts/templates/{id}", a.updateContractTemplate)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsDelete)).Delete("/contracts/templates/{id}", a.deleteContractTemplate)

	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/invites", a.listContractInvites)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Post("/contracts/invites", a.createContractInvite)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/invites/{id}", a.getContractInvite)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Put("/contracts/invites/{id}", a.updateContractInvite)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Post("/contracts/invites/{id}/send", a.sendContractInvite)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsDelete)).Delete("/contracts/invites/{id}", a.deleteContractInvite)

	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/submissions", a.listContractSubmissions)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Post("/contracts/submissions", a.createContractSubmission)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/submissions/{id}", a.getContractSubmission)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/submissions/{id}/pdf", a.downloadContractSubmissionPDF)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/submissions/{id}/signature", a.downloadContractSubmissionSignature)
	r.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsDelete)).Delete("/contracts/submissions/{id}", a.deleteContractSubmission)

	r.With(a.requirePermission(PermNotesRead)).Get("/workspace-notes", a.listWorkspaceNotes)
	r.With(a.requirePermission(PermNotesWrite)).Post("/workspace-notes", a.createWorkspaceNote)
	r.With(a.requirePermission(PermNotesRead)).Get("/workspace-notes/{id}", a.getWorkspaceNote)
	r.With(a.requirePermission(PermNotesWrite)).Put("/workspace-notes/{id}", a.updateWorkspaceNote)
	r.With(a.requirePermission(PermNotesDelete)).Delete("/workspace-notes/{id}", a.deleteWorkspaceNote)

	r.With(a.requirePermission(PermNotesRead)).Get("/notebook/documents", a.listNotebookDocuments)
	r.With(a.requirePermission(PermNotesWrite)).Post("/notebook/documents", a.createNotebookDocument)
	r.With(a.requirePermission(PermNotesWrite)).Put("/notebook/documents/{id}", a.updateNotebookDocument)
	r.With(a.requirePermission(PermNotesDelete)).Delete("/notebook/documents/{id}", a.deleteNotebookDocument)

	r.With(a.requireFeature(FeatureInternalChat), a.requirePermission(PermMembersRead)).Get("/chat/conversations", a.listChatConversations)
	r.With(a.requireFeature(FeatureInternalChat), a.requirePermission(PermMembersRead)).Get("/chat/conversations/{id}/messages", a.listChatMessages)
	r.With(a.requireFeature(FeatureInternalChat), a.requirePermission(PermMembersWrite)).Post("/chat/conversations/{id}/messages", a.createChatMessage)

	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingRead)).Get("/ticketing/tasks", a.listTicketingTasks)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/ticketing/tasks", a.createTicketingTask)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingRead)).Get("/ticketing/tasks/{id}", a.getTicketingTask)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Put("/ticketing/tasks/{id}", a.updateTicketingTask)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingDelete)).Delete("/ticketing/tasks/{id}", a.deleteTicketingTask)

	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingRead)).Get("/ticketing/tickets", a.listTicketingTasks)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/ticketing/tickets", a.createTicketingTask)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingRead)).Get("/ticketing/tickets/{id}", a.getTicketingTask)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Put("/ticketing/tickets/{id}", a.updateTicketingTask)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/ticketing/tickets/{id}/claim", a.claimTicketingTask)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/ticketing/tickets/{id}/complete", a.completeTicketingTask)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/ticketing/tickets/{id}/refuse", a.refuseTicketingTask)
	r.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingDelete)).Delete("/ticketing/tickets/{id}", a.deleteTicketingTask)
}
