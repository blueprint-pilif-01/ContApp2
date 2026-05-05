import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { AppShell } from "./app/shell/AppShell";
import { RequireAuth } from "./app/auth/RequireAuth";
import LoginPage from "./app/auth/LoginPage";
import RegisterPage from "./app/auth/RegisterPage";
import AdminLoginPage from "./app/auth/AdminLoginPage";
import { AdminShell } from "./app/admin/AdminShell";
import { RequireAdmin } from "./app/admin/RequireAdmin";
import { RequireExtension } from "./components/ui/RequireExtension";
import { RequireWorkspaceSettingsAccess } from "./components/ui/RequireWorkspaceAccess";
import type { ExtensionKey } from "./lib/extensions";

// ── Landing (public marketing site) ──────────────────────────────────────────
import LandingPage from "./App";

// ── App pages (lazy loaded) ──────────────────────────────────────────────────
const DashboardPage        = lazy(() => import("./app/pages/DashboardPage"));
const ClientsPage          = lazy(() => import("./app/pages/clients/ClientsPage"));
const ClientDetailPage     = lazy(() => import("./app/pages/clients/ClientDetailPage"));
const TicketingPage        = lazy(() => import("./app/pages/ticketing/TicketingPage"));
const ChatPage             = lazy(() => import("./app/pages/chat/ChatPage"));
const CalendarPage         = lazy(() => import("./app/pages/calendar/CalendarPage"));
const HrPage               = lazy(() => import("./app/pages/hr/HrPage"));
const NotebookPage         = lazy(() => import("./app/pages/notebook/NotebookPage"));
const PlannerSmartPage     = lazy(() => import("./app/pages/planner/PlannerSmartPage"));
const AiKitchenSinkPage    = lazy(() => import("./app/pages/dev/AiKitchenSinkPage"));
const TemplatesPage        = lazy(() => import("./app/pages/contracts/TemplatesPage"));
const TemplateEditorPage   = lazy(() => import("./app/pages/contracts/TemplateEditorPage"));
const InvitesPage          = lazy(() => import("./app/pages/contracts/InvitesPage"));
const SubmissionsPage      = lazy(() => import("./app/pages/contracts/SubmissionsPage"));
const SubmissionDetailPage = lazy(() => import("./app/pages/contracts/SubmissionDetailPage"));
const SettingsPage         = lazy(() => import("./app/pages/settings/SettingsPage"));
const UsersRolesPage       = lazy(() => import("./app/pages/settings/UsersRolesPage"));
const UserProfilePage      = lazy(() => import("./app/pages/settings/UserProfilePage"));
const LegislationPage      = lazy(() => import("./app/pages/legislation/LegislationPage"));
const SignPage             = lazy(() => import("./public/SignPage"));
const SignSuccessPage      = lazy(() => import("./public/SignSuccessPage"));
const ClientPortalPage     = lazy(() => import("./public/ClientPortalPage"));
const ReportsPage          = lazy(() => import("./app/pages/reports/ReportsPage"));
const DocumentsPage        = lazy(() => import("./app/pages/documents/DocumentsPage"));
const ActivityLogPage      = lazy(() => import("./app/pages/settings/ActivityLogPage"));
const AutomationRulesPage  = lazy(() => import("./app/pages/settings/AutomationRulesPage"));

// ── Admin pages (lazy) ───────────────────────────────────────────────────────
const AdminDashboardPage    = lazy(() => import("./app/admin/pages/AdminDashboardPage"));
const AdminOrganisationsPage = lazy(() => import("./app/admin/pages/OrganisationsPage"));
const AdminUsersPage        = lazy(() => import("./app/admin/pages/AdminUsersPage"));
const AdminExtensionsPage   = lazy(() => import("./app/admin/pages/ExtensionsPage"));
const AdminBillingPage      = lazy(() => import("./app/admin/pages/AdminBillingPage"));
const AdminFilesPage        = lazy(() => import("./app/admin/pages/AdminFilesPage"));
const AdminContractsPage    = lazy(() => import("./app/admin/pages/AdminContractsPage"));
const AdminNotificationsPage = lazy(() => import("./app/admin/pages/AdminNotificationsPage"));
const AdminJobsPage         = lazy(() => import("./app/admin/pages/AdminJobsPage"));
const AdminAuditPage        = lazy(() => import("./app/admin/pages/AdminAuditPage"));
const AdminPlansPage        = lazy(() => import("./app/admin/pages/AdminPlansPage"));

/** Full-page loading spinner while lazy chunk loads */
function PageLoader(): ReactNode {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
    </div>
  );
}

function S({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

/** Lazy + extension gate combo. */
function G({ ext, children }: { ext: ExtensionKey; children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <RequireExtension extension={ext}>{children}</RequireExtension>
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // ── Public marketing ─────────────────────────────────────────────────────
  { path: "/",              element: <LandingPage /> },

  // ── Auth ──────────────────────────────────────────────────────────────────
  { path: "/login",         element: <LoginPage /> },
  { path: "/auth/register", element: <RegisterPage /> },
  { path: "/public/sign/:token", element: <S><SignPage /></S> },
  { path: "/public/sign/:token/success", element: <S><SignSuccessPage /></S> },
  { path: "/portal/:token", element: <S><ClientPortalPage /></S> },

  // ── Protected app ─────────────────────────────────────────────────────────
  {
    path: "/app",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },

      // Phase 1 — Dashboard (always free)
      { path: "dashboard", element: <S><DashboardPage /></S> },

      // Phase 2 — Clients (Contracts Pro)
      { path: "clients",     element: <G ext="contracts_pro"><ClientsPage /></G> },
      { path: "clients/:id", element: <G ext="contracts_pro"><ClientDetailPage /></G> },

      // Phase 3 — Operațional
      { path: "ticketing", element: <G ext="ticketing_pro"><TicketingPage /></G> },
      { path: "chat", element: <G ext="internal_chat"><ChatPage /></G> },
      { path: "calendar", element: <S><CalendarPage /></S> },
      { path: "hr", element: <G ext="hr_pro"><HrPage /></G> },
      { path: "notebook", element: <S><NotebookPage /></S> },
      { path: "planner-smart", element: <G ext="ai_assistant"><PlannerSmartPage /></G> },
      // Legacy redirects — notițe & workspace-notes consolidate into Notebook
      { path: "notes", element: <Navigate to="/app/notebook" replace /> },
      { path: "workspace-notes", element: <Navigate to="/app/notebook?view=shared" replace /> },
      { path: "tasks", element: <Navigate to="/app/ticketing" replace /> },

      // Phase 4-5 — Contracts (Contracts Pro)
      { path: "contracts/templates",          element: <G ext="contracts_pro"><TemplatesPage /></G> },
      { path: "contracts/templates/new",      element: <G ext="contracts_pro"><TemplateEditorPage /></G> },
      { path: "contracts/templates/:id/edit", element: <G ext="contracts_pro"><TemplateEditorPage /></G> },
      { path: "contracts/invites",            element: <G ext="contracts_pro"><InvitesPage /></G> },
      { path: "contracts/submissions",        element: <G ext="contracts_pro"><SubmissionsPage /></G> },
      { path: "contracts/submissions/:id",    element: <G ext="contracts_pro"><SubmissionDetailPage /></G> },

      // Phase 7 — Settings (always free)
      { path: "settings",    element: <S><SettingsPage /></S> },
      { path: "settings/users-roles", element: <S><RequireWorkspaceSettingsAccess><UsersRolesPage /></RequireWorkspaceSettingsAccess></S> },
      { path: "settings/users/:id", element: <S><RequireWorkspaceSettingsAccess><UserProfilePage /></RequireWorkspaceSettingsAccess></S> },

      // Informare — Legislation Monitor
      { path: "legislation", element: <G ext="legislation_monitor"><LegislationPage /></G> },

      // New features
      { path: "reports", element: <S><ReportsPage /></S> },
      { path: "documents", element: <S><DocumentsPage /></S> },
      { path: "settings/activity-log", element: <S><RequireWorkspaceSettingsAccess><ActivityLogPage /></RequireWorkspaceSettingsAccess></S> },
      { path: "settings/automations", element: <S><RequireWorkspaceSettingsAccess><AutomationRulesPage /></RequireWorkspaceSettingsAccess></S> },

      { path: "_kitchen-sink", element: <S><AiKitchenSinkPage /></S> },
    ],
  },

  // ── Admin console ─────────────────────────────────────────────────────────
  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminShell />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "dashboard", element: <S><AdminDashboardPage /></S> },
      { path: "organisations", element: <S><AdminOrganisationsPage /></S> },
      { path: "users", element: <S><AdminUsersPage /></S> },
      { path: "extensions", element: <S><AdminExtensionsPage /></S> },
      { path: "plans", element: <S><AdminPlansPage /></S> },
      { path: "billing", element: <S><AdminBillingPage /></S> },
      { path: "files", element: <S><AdminFilesPage /></S> },
      { path: "contracts", element: <S><AdminContractsPage /></S> },
      { path: "notifications", element: <S><AdminNotificationsPage /></S> },
      { path: "jobs", element: <S><AdminJobsPage /></S> },
      { path: "audit", element: <S><AdminAuditPage /></S> },
    ],
  },

  // ── Catch-all ─────────────────────────────────────────────────────────────
  { path: "*", element: <Navigate to="/" replace /> },
]);
