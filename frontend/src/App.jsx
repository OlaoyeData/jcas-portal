import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AnnouncementProvider } from './contexts/AnnouncementContext'

// Layouts
import MainLayout      from './components/MainLayout'
import DashboardLayout from './components/DashboardLayout'

// Public pages
import HomePage         from './pages/HomePage'
import AboutPage        from './pages/AboutPage'
import GuidelinesPage   from './pages/GuidelinesPage'
import ArchivePage      from './pages/ArchivePage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import SearchPage       from './pages/SearchPage'
import PeerReviewPage   from './pages/PeerReviewPage'
import IndexingPage     from './pages/IndexingPage'
import OpenAccessPage   from './pages/OpenAccessPage'
import APCPage from './pages/APCPage'

// Auth pages
import LoginPage            from './pages/auth/LoginPage'
import RegisterPage         from './pages/auth/RegisterPage'
import ResetPasswordPage    from './pages/auth/ResetPasswordPage'
import AcceptInvitationPage from './pages/auth/AcceptInvitationPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

// Dashboard pages
import AuthorDashboard         from './pages/dashboard/AuthorDashboard'
import NewSubmissionPage        from './pages/dashboard/NewSubmissionPage'
import ManuscriptDetailPage     from './pages/dashboard/ManuscriptDetailPage'
import RevisionUploadPage       from './pages/dashboard/RevisionUploadPage'
import AuthorReviewsPage        from './pages/dashboard/AuthorReviewsPage'
import AuthorSettingsPage       from './pages/dashboard/AuthorSettingsPage'
import PaymentPage              from './pages/dashboard/PaymentPage'

import ReviewerDashboard        from './pages/dashboard/ReviewerDashboard'
import ReviewerInvitationsPage  from './pages/dashboard/ReviewerInvitationsPage'
import ReviewerActivePage       from './pages/dashboard/ReviewerActivePage'
import ReviewerHistoryPage      from './pages/dashboard/ReviewerHistoryPage'
import ReviewerSettingsPage     from './pages/dashboard/ReviewerSettingsPage'
import ReviewFormPage           from './pages/dashboard/ReviewFormPage'
import ReviewerPendingPage      from './pages/dashboard/ReviewerPendingPage'

import EditorDashboard          from './pages/dashboard/EditorDashboard'
import EditorQueuePage          from './pages/dashboard/EditorQueuePage'
import EditorReviewersPage      from './pages/dashboard/EditorReviewersPage'
import EditorMetricsPage        from './pages/dashboard/EditorMetricsPage'
import EditorSettingsPage       from './pages/dashboard/EditorSettingsPage'
import SubmissionManagementPage from './pages/dashboard/SubmissionManagementPage'

import EditorInChiefDashboard   from './pages/dashboard/EditorInChiefDashboard'

import AdminOverviewPage        from './pages/dashboard/AdminOverviewPage'
import AdminUsersPage           from './pages/dashboard/AdminUsersPage'
import AdminJournalPage         from './pages/dashboard/AdminJournalPage'
import AdminSubjectsPage        from './pages/dashboard/AdminSubjectsPage'
import AdminTemplatesPage       from './pages/dashboard/AdminTemplatesPage'
import AdminAnnouncementsPage   from './pages/dashboard/AdminAnnouncementsPage'
import AdminVolumesPage         from './pages/dashboard/AdminVolumesPage'
import AdminSettingsPage from './pages/dashboard/AdminSettingsPage'

// Roles that count as editorial staff
const EDITORIAL = ['editor', 'editor_in_chief', 'admin']
const ALL_DASHBOARD = ['author', 'reviewer', 'editor', 'editor_in_chief', 'admin']

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-400">
      <Loader size={24} className="animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  // Unapproved reviewers always see the pending page
  if (user.role === 'reviewer' && user.is_approved === false) {
    return <ReviewerPendingPage />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return children
}

function getDashboardPath(role) {
  if (role === 'editor_in_chief') return '/dashboard/editor_in_chief'
  return `/dashboard/${role}`
}

function DashboardIndexRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={getDashboardPath(user.role)} replace />
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-7xl font-display text-navy-900 font-bold mb-4">404</p>
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
        <a href="/" className="btn-primary">Return Home</a>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>

      {/* ── Public routes ────────────────────────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/"                        element={<HomePage />}          />
        <Route path="/about"                   element={<AboutPage />}         />
        <Route path="/apc" element={<APCPage />} />
        <Route path="/submit/guidelines"       element={<GuidelinesPage />}    />
        <Route path="/archive"                 element={<ArchivePage />}       />
        <Route path="/article/:id"             element={<ArticleDetailPage />} />
        <Route path="/search"                  element={<SearchPage />}        />
        <Route path="/peer-review"             element={<PeerReviewPage />}    />
        <Route path="/indexing"                element={<IndexingPage />}      />
        <Route path="/open-access"             element={<OpenAccessPage />}    />
        <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
      </Route>

      {/* ── Auth pages ───────────────────────────────────────────────── */}
      <Route path="/login"          element={<LoginPage />}         />
      <Route path="/register"       element={<RegisterPage />}      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* ── Dashboard ────────────────────────────────────────────────── */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardIndexRedirect />} />

        {/* ── Author ─────────────────────────────────────────────────── */}
        <Route path="author"
          element={<ProtectedRoute allowedRoles={['author', 'admin']}><AuthorDashboard /></ProtectedRoute>} />
        <Route path="author/reviews"
          element={<ProtectedRoute allowedRoles={['author', 'admin']}><AuthorReviewsPage /></ProtectedRoute>} />
        <Route path="author/settings"
          element={<ProtectedRoute allowedRoles={['author', 'admin']}><AuthorSettingsPage /></ProtectedRoute>} />

        {/* Submit — authors + editorial staff can all submit */}
        <Route path="author/submit"
          element={
            <ProtectedRoute allowedRoles={['author', 'editor', 'editor_in_chief', 'admin']}>
              <NewSubmissionPage />
            </ProtectedRoute>
          } />

        {/* Manuscript detail — authors + editorial staff */}
        <Route path="author/manuscript/:id"
          element={
            <ProtectedRoute allowedRoles={['author', 'editor', 'editor_in_chief', 'admin']}>
              <ManuscriptDetailPage />
            </ProtectedRoute>
          } />

        <Route path="author/manuscript/:id/revise"
          element={
            <ProtectedRoute allowedRoles={['author', 'editor', 'editor_in_chief', 'admin']}>
              <RevisionUploadPage />
            </ProtectedRoute>
          } />

        {/* Payment page — author and editorial staff */}
        <Route path="manuscript/:id/payment"
          element={
            <ProtectedRoute allowedRoles={['author', 'editor', 'editor_in_chief', 'admin']}>
              <PaymentPage />
            </ProtectedRoute>
          } />

        {/* ── Reviewer ───────────────────────────────────────────────── */}
        <Route path="reviewer"
          element={<ProtectedRoute allowedRoles={['reviewer', 'admin']}><ReviewerDashboard /></ProtectedRoute>} />
        <Route path="reviewer/invitations"
          element={<ProtectedRoute allowedRoles={['reviewer', 'admin']}><ReviewerInvitationsPage /></ProtectedRoute>} />
        <Route path="reviewer/active"
          element={<ProtectedRoute allowedRoles={['reviewer', 'admin']}><ReviewerActivePage /></ProtectedRoute>} />
        <Route path="reviewer/history"
          element={<ProtectedRoute allowedRoles={['reviewer', 'admin']}><ReviewerHistoryPage /></ProtectedRoute>} />
        <Route path="reviewer/settings"
          element={<ProtectedRoute allowedRoles={['reviewer', 'admin']}><ReviewerSettingsPage /></ProtectedRoute>} />
        <Route path="reviewer/review/:id"
          element={<ProtectedRoute allowedRoles={['reviewer', 'admin']}><ReviewFormPage /></ProtectedRoute>} />

        {/* ── Editor ─────────────────────────────────────────────────── */}
        <Route path="editor"
          element={<ProtectedRoute allowedRoles={['editor', 'admin']}><EditorDashboard /></ProtectedRoute>} />
        <Route path="editor/queue"
          element={<ProtectedRoute allowedRoles={['editor', 'admin']}><EditorQueuePage /></ProtectedRoute>} />
        <Route path="editor/reviewers"
          element={<ProtectedRoute allowedRoles={['editor', 'admin']}><EditorReviewersPage /></ProtectedRoute>} />
        <Route path="editor/metrics"
          element={<ProtectedRoute allowedRoles={['editor', 'admin']}><EditorMetricsPage /></ProtectedRoute>} />
        <Route path="editor/settings"
          element={<ProtectedRoute allowedRoles={['editor', 'admin']}><EditorSettingsPage /></ProtectedRoute>} />
        <Route path="editor/submission/:id"
          element={<ProtectedRoute allowedRoles={['editor', 'admin']}><SubmissionManagementPage /></ProtectedRoute>} />
        <Route path="editor/my-submissions"
          element={<ProtectedRoute allowedRoles={['editor', 'admin']}><AuthorDashboard /></ProtectedRoute>} />

        {/* ── Editor-in-Chief ─────────────────────────────────────────── */}
        <Route path="editor_in_chief"
          element={<ProtectedRoute allowedRoles={['editor_in_chief', 'admin']}><EditorInChiefDashboard /></ProtectedRoute>} />
        <Route path="editor_in_chief/queue"
          element={<ProtectedRoute allowedRoles={['editor_in_chief', 'admin']}><EditorQueuePage /></ProtectedRoute>} />
        <Route path="editor_in_chief/reviewers"
          element={<ProtectedRoute allowedRoles={['editor_in_chief', 'admin']}><EditorReviewersPage /></ProtectedRoute>} />
        <Route path="editor_in_chief/metrics"
          element={<ProtectedRoute allowedRoles={['editor_in_chief', 'admin']}><EditorMetricsPage /></ProtectedRoute>} />
        <Route path="editor_in_chief/settings"
          element={<ProtectedRoute allowedRoles={['editor_in_chief', 'admin']}><EditorSettingsPage /></ProtectedRoute>} />
        <Route path="editor_in_chief/submission/:id"
          element={<ProtectedRoute allowedRoles={['editor_in_chief', 'admin']}><SubmissionManagementPage /></ProtectedRoute>} />
        <Route path="editor_in_chief/my-submissions"
          element={<ProtectedRoute allowedRoles={['editor_in_chief', 'admin']}><AuthorDashboard /></ProtectedRoute>} />

        {/* ── Admin ──────────────────────────────────────────────────── */}
        <Route path="admin"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminOverviewPage /></ProtectedRoute>} />
        <Route path="admin/users"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="admin/journal"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminJournalPage /></ProtectedRoute>} />
        <Route path="admin/subjects"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminSubjectsPage /></ProtectedRoute>} />
        <Route path="admin/templates"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminTemplatesPage /></ProtectedRoute>} />
        <Route path="admin/announcements"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminAnnouncementsPage /></ProtectedRoute>} />
        <Route path="admin/volumes"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminVolumesPage /></ProtectedRoute>} />
        <Route path="admin/settings" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AnnouncementProvider>
        <AppRoutes />
      </AnnouncementProvider>
    </AuthProvider>
  )
}