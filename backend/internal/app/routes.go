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

		v1.Group(func(protected chi.Router) {
			protected.Use(a.requireAuth)
			protected.Get("/auth/me", a.authMe)
			protected.Get("/auth/organisations", a.listAccountOrganisations)
			protected.Post("/auth/switch-organisation", a.switchOrganisation)
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
	r.With(a.requirePermission(PermClientsRead)).Get("/clients", a.listClients)
	r.With(a.requirePermission(PermClientsWrite)).Post("/clients", a.createClient)
	r.With(a.requirePermission(PermClientsRead)).Get("/clients/{id}", a.getClient)
	r.With(a.requirePermission(PermClientsWrite)).Put("/clients/{id}", a.updateClient)
	r.With(a.requirePermission(PermClientsDelete)).Delete("/clients/{id}", a.deleteClient)
	r.With(a.requirePermission(PermDocumentsRead)).Get("/clients/{id}/documents", a.listClientDocuments)

	r.With(a.requirePermission(PermDocumentsRead)).Get("/files", a.listFiles)
	r.With(a.requirePermission(PermDocumentsWrite)).Post("/files", a.createFile)
	r.With(a.requirePermission(PermDocumentsRead)).Get("/files/{id}", a.getFile)
	r.With(a.requirePermission(PermDocumentsDelete)).Delete("/files/{id}", a.deleteFile)

	r.With(a.requirePermission(PermDocumentsRead)).Get("/organisation-documents", a.listOrganisationDocuments)
	r.With(a.requirePermission(PermDocumentsWrite)).Post("/organisation-documents", a.createOrganisationDocument)
	r.With(a.requirePermission(PermDocumentsRead)).Get("/organisation-documents/{id}", a.getOrganisationDocument)
	r.With(a.requirePermission(PermDocumentsDelete)).Delete("/organisation-documents/{id}", a.deleteOrganisationDocument)

	r.With(a.requirePermission(PermDocumentsWrite)).Post("/client-documents", a.createClientDocument)
	r.With(a.requirePermission(PermDocumentsRead)).Get("/client-documents/{id}", a.getClientDocument)
	r.With(a.requirePermission(PermDocumentsDelete)).Delete("/client-documents/{id}", a.deleteClientDocument)

	r.With(a.requirePermission(PermContractsRead)).Get("/contracts/templates", a.listContractTemplates)
	r.With(a.requirePermission(PermContractsWrite)).Post("/contracts/templates", a.createContractTemplate)
	r.With(a.requirePermission(PermContractsRead)).Get("/contracts/templates/{id}", a.getContractTemplate)
	r.With(a.requirePermission(PermContractsWrite)).Put("/contracts/templates/{id}", a.updateContractTemplate)
	r.With(a.requirePermission(PermContractsDelete)).Delete("/contracts/templates/{id}", a.deleteContractTemplate)

	r.With(a.requirePermission(PermContractsRead)).Get("/contracts/invites", a.listContractInvites)
	r.With(a.requirePermission(PermContractsWrite)).Post("/contracts/invites", a.createContractInvite)
	r.With(a.requirePermission(PermContractsRead)).Get("/contracts/invites/{id}", a.getContractInvite)
	r.With(a.requirePermission(PermContractsDelete)).Delete("/contracts/invites/{id}", a.deleteContractInvite)

	r.With(a.requirePermission(PermContractsRead)).Get("/contracts/submissions", a.listContractSubmissions)
	r.With(a.requirePermission(PermContractsWrite)).Post("/contracts/submissions", a.createContractSubmission)
	r.With(a.requirePermission(PermContractsRead)).Get("/contracts/submissions/{id}", a.getContractSubmission)
	r.With(a.requirePermission(PermContractsDelete)).Delete("/contracts/submissions/{id}", a.deleteContractSubmission)

	r.With(a.requirePermission(PermNotesRead)).Get("/workspace-notes", a.listWorkspaceNotes)
	r.With(a.requirePermission(PermNotesWrite)).Post("/workspace-notes", a.createWorkspaceNote)
	r.With(a.requirePermission(PermNotesRead)).Get("/workspace-notes/{id}", a.getWorkspaceNote)
	r.With(a.requirePermission(PermNotesWrite)).Put("/workspace-notes/{id}", a.updateWorkspaceNote)
	r.With(a.requirePermission(PermNotesDelete)).Delete("/workspace-notes/{id}", a.deleteWorkspaceNote)

	r.With(a.requirePermission(PermTicketingRead)).Get("/ticketing/tasks", a.listTicketingTasks)
	r.With(a.requirePermission(PermTicketingWrite)).Post("/ticketing/tasks", a.createTicketingTask)
	r.With(a.requirePermission(PermTicketingRead)).Get("/ticketing/tasks/{id}", a.getTicketingTask)
	r.With(a.requirePermission(PermTicketingWrite)).Put("/ticketing/tasks/{id}", a.updateTicketingTask)
	r.With(a.requirePermission(PermTicketingDelete)).Delete("/ticketing/tasks/{id}", a.deleteTicketingTask)
}
