import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { AppShell } from "./app/shell/AppShell";
import { RequireAuth } from "./app/auth/RequireAuth";
import LoginPage from "./app/auth/LoginPage";

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

export const router = createBrowserRouter([
  // ── Auth ──────────────────────────────────────────────────────────────────
  { path: "/",              element: <Navigate to="/app" replace /> },
  { path: "/login",         element: <LoginPage /> },
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

      // Phase 1 — Dashboard
      { path: "dashboard", element: <S><DashboardPage /></S> },

      // Phase 2 — Clients
      { path: "clients",     element: <S><ClientsPage /></S> },
      { path: "clients/:id", element: <S><ClientDetailPage /></S> },

      // Phase 3 — Operațional
      { path: "ticketing", element: <S><TicketingPage /></S> },
      { path: "chat", element: <S><ChatPage /></S> },
      { path: "calendar", element: <S><CalendarPage /></S> },
      { path: "hr", element: <S><HrPage /></S> },
      { path: "notebook", element: <S><NotebookPage /></S> },
      { path: "planner-smart", element: <S><PlannerSmartPage /></S> },
      // Legacy redirects — notițe & workspace-notes consolidate into Notebook
      { path: "notes", element: <Navigate to="/app/notebook" replace /> },
      { path: "workspace-notes", element: <Navigate to="/app/notebook?view=shared" replace /> },
      { path: "tasks", element: <Navigate to="/app/ticketing" replace /> },

      // Phase 4-5 — Contracts
      { path: "contracts/templates",          element: <S><TemplatesPage /></S> },
      { path: "contracts/templates/new",      element: <S><TemplateEditorPage /></S> },
      { path: "contracts/templates/:id/edit", element: <S><TemplateEditorPage /></S> },
      { path: "contracts/invites",            element: <S><InvitesPage /></S> },
      { path: "contracts/submissions",        element: <S><SubmissionsPage /></S> },
      { path: "contracts/submissions/:id",    element: <S><SubmissionDetailPage /></S> },

      // Phase 7 — Settings
      { path: "settings",    element: <S><SettingsPage /></S> },
      { path: "settings/users-roles", element: <S><UsersRolesPage /></S> },
      { path: "settings/users/:id", element: <S><UserProfilePage /></S> },

      // Informare
      { path: "legislation", element: <S><LegislationPage /></S> },

      // New features
      { path: "reports", element: <S><ReportsPage /></S> },
      { path: "documents", element: <S><DocumentsPage /></S> },
      { path: "settings/activity-log", element: <S><ActivityLogPage /></S> },
      { path: "settings/automations", element: <S><AutomationRulesPage /></S> },

      { path: "_kitchen-sink", element: <S><AiKitchenSinkPage /></S> },
    ],
  },

  // ── Catch-all ─────────────────────────────────────────────────────────────
  { path: "*", element: <Navigate to="/app" replace /> },
]);
