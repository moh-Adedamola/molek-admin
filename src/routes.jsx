import { lazy } from "react"
import { Routes as ReactRoutes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import { PrivateRoute } from "./components/layout/PrivateRoute"
import { Login } from "./pages/Login"
import { NotFound } from "./pages/NotFound"

// Each page loads when it is first opened, so staff on slow connections
// download only the screen they need (Login and the 404 page load up front).
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })))
const AdminsList = lazy(() => import("./pages/Adminslist").then((m) => ({ default: m.AdminsList })))
const AdminForm = lazy(() => import("./pages/Adminform").then((m) => ({ default: m.AdminForm })))
const ContentList = lazy(() => import("./pages/ContentList").then((m) => ({ default: m.ContentList })))
const ContentForm = lazy(() => import("./pages/ContentForm").then((m) => ({ default: m.ContentForm })))
const GalleryList = lazy(() => import("./pages/GalleryList").then((m) => ({ default: m.GalleryList })))
const GalleryForm = lazy(() => import("./pages/GalleryForm").then((m) => ({ default: m.GalleryForm })))
const EventList = lazy(() => import("./pages/EventList").then((m) => ({ default: m.EventList })))
const EventForm = lazy(() => import("./pages/EventForm").then((m) => ({ default: m.EventForm })))
const Profile = lazy(() => import("./pages/Profile").then((m) => ({ default: m.Profile })))
const StudentsList = lazy(() => import("./pages/Studentslist").then((m) => ({ default: m.StudentsList })))
const StudentForm = lazy(() => import("./pages/Studentform").then((m) => ({ default: m.StudentForm })))
const StudentBulkUpload = lazy(() => import("./pages/Studentbulkupload").then((m) => ({ default: m.StudentBulkUpload })))
const PromotionRules = lazy(() => import("./pages/PromotionRules").then((m) => ({ default: m.PromotionRules })))
const StudentPromotion = lazy(() => import("./pages/StudentPromotion").then((m) => ({ default: m.StudentPromotion })))
const PromotionRevert = lazy(() => import("./pages/PromotionRevert").then((m) => ({ default: m.PromotionRevert })))
const StudentResultsHistory = lazy(() => import("./pages/StudentResultsHistory").then((m) => ({ default: m.StudentResultsHistory })))
const CAScoreUpload = lazy(() => import("./pages/Cascoreupload").then((m) => ({ default: m.CAScoreUpload })))
const ExamResultsImport = lazy(() => import("./pages/Examresultsimport").then((m) => ({ default: m.ExamResultsImport })))
const AcademicSetup = lazy(() => import("./pages/Academicsetup.jsx").then((m) => ({ default: m.AcademicSetup })))
const ExamResultsManager = lazy(() => import("./pages/ExamResultsManager").then((m) => ({ default: m.ExamResultsManager })))
const UnifiedScoreUpload = lazy(() => import("./pages/UnifiedScoreUpload").then((m) => ({ default: m.UnifiedScoreUpload })))
const FeesManager = lazy(() => import("./pages/FeesManager").then((m) => ({ default: m.FeesManager })))
const BehavioralManager = lazy(() => import("./pages/BehavioralManager").then((m) => ({ default: m.BehavioralManager })))
const Broadsheet = lazy(() => import("./pages/Broadsheet").then((m) => ({ default: m.Broadsheet })))
// Student Management Imports
// Results Manager Import
// Unified Score Upload
// Fees & Behavioral Management
// Broadsheet (cumulative results grid)

export default function Routes() {
    const { isAuthenticated } = useAuth()

    return (
        <ReactRoutes>
            {/* Public Route */}
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />

            {/* Dashboard */}
            <Route
                path="/"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <Dashboard />
                    </PrivateRoute>
                }
            />

            {/* Admin Management */}
            <Route
                path="/admins"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <AdminsList />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admins/create"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <AdminForm />
                    </PrivateRoute>
                }
            />
            <Route
                path="/admins/:id/edit"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <AdminForm />
                    </PrivateRoute>
                }
            />

            {/* Student Management */}
            <Route
                path="/students"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <StudentsList />
                    </PrivateRoute>
                }
            />
            <Route
                path="/students/create"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <StudentForm />
                    </PrivateRoute>
                }
            />
            <Route
                path="/students/:id/edit"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <StudentForm />
                    </PrivateRoute>
                }
            />
            <Route
                path="/students/bulk-upload"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <StudentBulkUpload />
                    </PrivateRoute>
                }
            />
            <Route
                path="/students/promote"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <StudentPromotion />
                    </PrivateRoute>
                }
            />
            <Route
                path="/students/promotion-rules"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <PromotionRules />
                    </PrivateRoute>
                }
            />

            <Route
                path="/students/revert"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <PromotionRevert />
                    </PrivateRoute>
                }
            />
            <Route
                path="/students/results-history"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <StudentResultsHistory />
                    </PrivateRoute>
                }
            />

            {/* Academic Setup */}
            <Route
                path="/academic-setup"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <AcademicSetup />
                    </PrivateRoute>
                }
            />

            {/* Unified Score Upload (replaces separate CA/OBJ/Theory pages) */}
            <Route
                path="/upload-scores"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <UnifiedScoreUpload />
                    </PrivateRoute>
                }
            />

            {/* Legacy routes — kept for backward compatibility */}
            <Route
                path="/ca-scores"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <CAScoreUpload />
                    </PrivateRoute>
                }
            />
            <Route
                path="/exam-results"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <ExamResultsImport />
                    </PrivateRoute>
                }
            />

            {/* Results Manager - CRUD for exam results */}
            <Route
                path="/results-manager"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <ExamResultsManager />
                    </PrivateRoute>
                }
            />

            {/* Fees Manager */}
            <Route
                path="/fees"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <FeesManager />
                    </PrivateRoute>
                }
            />

            {/* Behavioral Assessment Manager */}
            <Route
                path="/behavioral"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <BehavioralManager />
                    </PrivateRoute>
                }
            />

            {/* Broadsheet - cumulative results grid */}
            <Route
                path="/broadsheet"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <Broadsheet />
                    </PrivateRoute>
                }
            />

            {/* Content Management (Images/Videos) */}
            <Route
                path="/content"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <ContentList />
                    </PrivateRoute>
                }
            />
            <Route
                path="/content/create"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <ContentForm />
                    </PrivateRoute>
                }
            />
            <Route
                path="/content/:id/edit"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <ContentForm />
                    </PrivateRoute>
                }
            />

            {/* News Management (uses ContentList with filter) */}
            <Route
                path="/news"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <ContentList defaultContentType="news" pageTitle="News Management" />
                    </PrivateRoute>
                }
            />
            <Route
                path="/news/create"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <ContentForm defaultContentType="news" />
                    </PrivateRoute>
                }
            />
            <Route
                path="/news/:id/edit"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <ContentForm defaultContentType="news" />
                    </PrivateRoute>
                }
            />

            {/* Gallery Management */}
            <Route
                path="/galleries"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <GalleryList />
                    </PrivateRoute>
                }
            />
            <Route
                path="/galleries/create"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <GalleryForm />
                    </PrivateRoute>
                }
            />

            {/* Events Management */}
            <Route
                path="/events"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <EventList />
                    </PrivateRoute>
                }
            />
            <Route
                path="/events/new"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <EventForm />
                    </PrivateRoute>
                }
            />
            <Route
                path="/events/:id/edit"
                element={
                    <PrivateRoute requiredRoles={["admin", "superadmin"]}>
                        <EventForm />
                    </PrivateRoute>
                }
            />

            {/* Profile */}
            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </ReactRoutes>
    )
}