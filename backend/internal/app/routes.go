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
		v1.Get("/auth/refresh-token", a.refreshToken)
		v1.Post("/auth/logout", a.logout)
		v1.Get("/public/sign/{token}", a.getPublicSignInvite)
		v1.Post("/public/sign/{token}", a.submitPublicSignInvite)

		v1.Group(func(protected chi.Router) {
			protected.Use(a.requireAuth)
			protected.Get("/auth/me", a.authMe)
			protected.With(a.requireAccount).Get("/auth/organisations", a.listAccountOrganisations)
			protected.With(a.requireAccount).Post("/auth/switch-organisation", a.switchOrganisation)
			protected.With(a.requireAccount).Get("/organisations/me/extensions", a.getCurrentOrganisationExtensions)
			protected.With(a.requireAccount).Get("/organisations/me/subscription", a.getCurrentOrganisationSubscription)
			protected.With(a.requireAccount).Get("/dashboard/overview", a.getDashboardOverview)
			protected.With(a.requireAccount).Get("/notifications", a.listNotifications)
			protected.With(a.requireAccount).Post("/notifications/read-all", a.markAllNotificationsRead)
			protected.With(a.requireAccount).Post("/notifications/{id}/read", a.markNotificationRead)
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
		admin.Get("/admin/files", a.getAdminFilesOverview)
		admin.Get("/admin/audit", a.listAdminAudit)
		admin.Get("/admin/jobs", a.listAdminJobs)
		admin.Post("/admin/jobs/{name}/trigger", a.triggerAdminJob)
		admin.Get("/admin/billing", a.getAdminBilling)
		admin.Get("/admin/billing/events", a.listAdminBillingEvents)
		admin.Get("/admin/contracts", a.getAdminContractsOverview)
		admin.Get("/admin/notifications", a.listAdminNotifications)
		admin.Post("/admin/notifications/broadcast", a.broadcastAdminNotification)
		admin.Get("/admin/subscription-plans", a.listAdminSubscriptionPlans)
		admin.Post("/admin/subscription-plans", a.createAdminSubscriptionPlan)
		admin.Put("/admin/subscription-plans/{id}", a.updateAdminSubscriptionPlan)
		admin.Delete("/admin/subscription-plans/{id}", a.deleteAdminSubscriptionPlan)
	})

	r.Group(func(workspace chi.Router) {
		workspace.Use(a.requireAccount)
		workspace.With(a.requirePermission(PermMembersRead)).Get("/members", a.listMembers)
		workspace.With(a.requirePermission(PermMembersWrite)).Post("/members", a.createMember)
		workspace.With(a.requirePermission(PermMembersRead)).Get("/members/{id}", a.getMember)
		workspace.With(a.requirePermission(PermMembersWrite)).Patch("/members/{id}", a.updateMember)
		workspace.With(a.requirePermission(PermMembersWrite)).Patch("/members/{id}/status", a.updateMemberStatus)
		workspace.With(a.requirePermission(PermRolesWrite)).Put("/members/{id}/roles", a.setMemberRoles)

		workspace.With(a.requirePermission(PermCategoriesRead)).Get("/employee-categories", a.listEmployeeCategories)
		workspace.With(a.requirePermission(PermCategoriesWrite)).Post("/employee-categories", a.createEmployeeCategory)
		workspace.With(a.requirePermission(PermCategoriesWrite)).Patch("/employee-categories/{id}", a.updateEmployeeCategory)
		workspace.With(a.requirePermission(PermCategoriesDelete)).Delete("/employee-categories/{id}", a.deleteEmployeeCategory)

		workspace.With(a.requirePermission(PermRolesRead)).Get("/roles", a.listRoles)
		workspace.With(a.requirePermission(PermRolesRead)).Get("/permissions", a.listPermissions)
		workspace.With(a.requirePermission(PermActivityRead)).Get("/activity-log", a.listActivityLog)
		workspace.With(a.requirePermission(PermTicketingRead)).Get("/planner/smart", a.getPlannerSmart)
		workspace.With(a.requirePermission(PermPlannerRead)).Get("/planner/events", a.listPlannerEvents)
		workspace.With(a.requirePermission(PermPlannerWrite)).Post("/planner/events", a.createPlannerEvent)
		workspace.With(a.requirePermission(PermPlannerDelete)).Delete("/planner/events/{id}", a.deletePlannerEvent)

		workspace.With(a.requirePermission(PermMembersRead)).Get("/settings/users", a.listSettingsUsers)
		workspace.With(a.requirePermission(PermMembersWrite)).Post("/settings/users", a.createSettingsUser)
		workspace.With(a.requirePermission(PermMembersRead)).Get("/settings/users/{id}", a.getSettingsUser)
		workspace.With(a.requirePermission(PermMembersWrite)).Put("/settings/users/{id}", a.updateSettingsUser)
		workspace.With(a.requirePermission(PermMembersDelete)).Delete("/settings/users/{id}", a.deleteSettingsUser)
		workspace.With(a.requirePermission(PermMembersWrite)).Post("/settings/users/{id}/invite", a.sendSettingsUserInvite)
		workspace.With(a.requirePermission(PermMembersWrite)).Post("/settings/users/{id}/reset-password", a.resetSettingsUserPassword)
		workspace.With(a.requirePermission(PermRolesRead)).Get("/settings/roles", a.listSettingsRoles)
		workspace.With(a.requirePermission(PermRolesWrite)).Post("/settings/roles", a.createSettingsRole)
		workspace.With(a.requirePermission(PermRolesWrite)).Put("/settings/roles/{id}", a.updateSettingsRole)
		workspace.With(a.requirePermission(PermRolesWrite)).Delete("/settings/roles/{id}", a.deleteSettingsRole)
		workspace.With(a.requirePermission(PermRolesRead)).Get("/settings/permissions/effective/{id}", a.getEffectiveSettingsPermissions)
		workspace.With(a.requirePermission(PermCategoriesRead)).Get("/settings/employee-categories", a.listEmployeeCategories)
		workspace.With(a.requirePermission(PermCategoriesWrite)).Post("/settings/employee-categories", a.createEmployeeCategory)
		workspace.With(a.requirePermission(PermCategoriesWrite)).Put("/settings/employee-categories/{id}", a.updateEmployeeCategory)
		workspace.With(a.requirePermission(PermCategoriesDelete)).Delete("/settings/employee-categories/{id}", a.deleteEmployeeCategory)

		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermClientsRead)).Get("/clients", a.listClients)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermClientsWrite)).Post("/clients", a.createClient)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermClientsRead)).Get("/clients/{id}", a.getClient)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermClientsWrite)).Put("/clients/{id}", a.updateClient)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermClientsDelete)).Delete("/clients/{id}", a.deleteClient)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/clients/{id}/documents", a.listClientDocuments)

		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/files", a.listFiles)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsWrite)).Post("/files", a.createFile)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/files/{id}", a.getFile)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsDelete)).Delete("/files/{id}", a.deleteFile)

		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/documents", a.listDocumentManagerItems)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsWrite)).Post("/documents/upload", a.uploadDocumentManagerItem)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsDelete)).Delete("/documents/{id}", a.deleteDocumentManagerItem)

		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/organisation-documents", a.listOrganisationDocuments)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsWrite)).Post("/organisation-documents", a.createOrganisationDocument)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/organisation-documents/{id}", a.getOrganisationDocument)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsDelete)).Delete("/organisation-documents/{id}", a.deleteOrganisationDocument)

		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsWrite)).Post("/client-documents", a.createClientDocument)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsRead)).Get("/client-documents/{id}", a.getClientDocument)
		workspace.With(a.requireFeature(FeatureDocuments), a.requirePermission(PermDocumentsDelete)).Delete("/client-documents/{id}", a.deleteClientDocument)

		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/templates", a.listContractTemplates)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Post("/contracts/templates", a.createContractTemplate)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/templates/{id}", a.getContractTemplate)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Put("/contracts/templates/{id}", a.updateContractTemplate)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsDelete)).Delete("/contracts/templates/{id}", a.deleteContractTemplate)

		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/invites", a.listContractInvites)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Post("/contracts/invites", a.createContractInvite)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/invites/{id}", a.getContractInvite)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Put("/contracts/invites/{id}", a.updateContractInvite)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Post("/contracts/invites/{id}/send", a.sendContractInvite)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsDelete)).Delete("/contracts/invites/{id}", a.deleteContractInvite)

		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/submissions", a.listContractSubmissions)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsWrite)).Post("/contracts/submissions", a.createContractSubmission)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/submissions/{id}", a.getContractSubmission)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/submissions/{id}/pdf", a.downloadContractSubmissionPDF)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsRead)).Get("/contracts/submissions/{id}/signature", a.downloadContractSubmissionSignature)
		workspace.With(a.requireFeature(FeatureContracts), a.requirePermission(PermContractsDelete)).Delete("/contracts/submissions/{id}", a.deleteContractSubmission)

		workspace.With(a.requirePermission(PermNotesRead)).Get("/workspace-notes", a.listWorkspaceNotes)
		workspace.With(a.requirePermission(PermNotesWrite)).Post("/workspace-notes", a.createWorkspaceNote)
		workspace.With(a.requirePermission(PermNotesRead)).Get("/workspace-notes/{id}", a.getWorkspaceNote)
		workspace.With(a.requirePermission(PermNotesWrite)).Put("/workspace-notes/{id}", a.updateWorkspaceNote)
		workspace.With(a.requirePermission(PermNotesDelete)).Delete("/workspace-notes/{id}", a.deleteWorkspaceNote)

		workspace.With(a.requirePermission(PermNotesRead)).Get("/notebook/documents", a.listNotebookDocuments)
		workspace.With(a.requirePermission(PermNotesWrite)).Post("/notebook/documents", a.createNotebookDocument)
		workspace.With(a.requirePermission(PermNotesWrite)).Put("/notebook/documents/{id}", a.updateNotebookDocument)
		workspace.With(a.requirePermission(PermNotesDelete)).Delete("/notebook/documents/{id}", a.deleteNotebookDocument)

		workspace.With(a.requireFeature(FeatureInternalChat), a.requirePermission(PermChatRead)).Get("/chat/conversations", a.listChatConversations)
		workspace.With(a.requireFeature(FeatureInternalChat), a.requirePermission(PermChatRead)).Get("/chat/conversations/{id}/messages", a.listChatMessages)
		workspace.With(a.requireFeature(FeatureInternalChat), a.requirePermission(PermChatWrite)).Post("/chat/conversations/{id}/messages", a.createChatMessage)
		workspace.With(a.requireFeature(FeatureInternalChat), a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/chat/derive-ticket", a.deriveTicketFromChat)
		workspace.With(a.requireFeature(FeatureInternalChat), a.requirePermission(PermTemplatesRead)).Get("/message-templates", a.listMessageTemplates)
		workspace.With(a.requireFeature(FeatureInternalChat), a.requirePermission(PermTemplatesWrite)).Post("/message-templates", a.createMessageTemplate)
		workspace.With(a.requireFeature(FeatureInternalChat), a.requirePermission(PermTemplatesDelete)).Delete("/message-templates/{id}", a.deleteMessageTemplate)

		workspace.With(a.requireFeature(FeatureHR), a.requirePermission(PermHRRead)).Get("/hr/hours", a.listHRHours)
		workspace.With(a.requireFeature(FeatureHR), a.requirePermission(PermHRWrite)).Post("/hr/hours", a.createHRHour)
		workspace.With(a.requireFeature(FeatureHR), a.requirePermission(PermHRRead)).Get("/hr/leaves", a.listHRLeaves)
		workspace.With(a.requireFeature(FeatureHR), a.requirePermission(PermHRWrite)).Post("/hr/leaves", a.createHRLeave)
		workspace.With(a.requireFeature(FeatureHR), a.requirePermission(PermHRRead)).Get("/hr/reviews", a.listHRReviews)
		workspace.With(a.requireFeature(FeatureHR), a.requirePermission(PermHRWrite)).Post("/hr/reviews", a.createHRReview)
		workspace.With(a.requireFeature(FeatureHR), a.requirePermission(PermHRWrite)).Post("/hr/certificates", a.createHRCertificateRequest)

		workspace.With(a.requirePermission(PermAutomationRead)).Get("/automation-rules", a.listAutomationRules)
		workspace.With(a.requirePermission(PermAutomationWrite)).Post("/automation-rules", a.createAutomationRule)
		workspace.With(a.requirePermission(PermAutomationWrite)).Put("/automation-rules/{id}", a.updateAutomationRule)
		workspace.With(a.requirePermission(PermAutomationDelete)).Delete("/automation-rules/{id}", a.deleteAutomationRule)

		workspace.With(a.requirePermission(PermReportsRead)).Get("/reports/overview", a.getReportsOverview)

		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingRead)).Get("/ticketing/tasks", a.listTicketingTasks)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/ticketing/tasks", a.createTicketingTask)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingRead)).Get("/ticketing/tasks/{id}", a.getTicketingTask)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Put("/ticketing/tasks/{id}", a.updateTicketingTask)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingDelete)).Delete("/ticketing/tasks/{id}", a.deleteTicketingTask)

		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingRead)).Get("/ticketing/tickets", a.listTicketingTasks)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/ticketing/tickets", a.createTicketingTask)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingRead)).Get("/ticketing/tickets/{id}", a.getTicketingTask)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Put("/ticketing/tickets/{id}", a.updateTicketingTask)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/ticketing/tickets/{id}/claim", a.claimTicketingTask)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/ticketing/tickets/{id}/complete", a.completeTicketingTask)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingWrite)).Post("/ticketing/tickets/{id}/refuse", a.refuseTicketingTask)
		workspace.With(a.requireFeature(FeatureTicketing), a.requirePermission(PermTicketingDelete)).Delete("/ticketing/tickets/{id}", a.deleteTicketingTask)
	})
}
