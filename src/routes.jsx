import { Routes as ReactRoutes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import { PrivateRoute } from "./components/layout/PrivateRoute"
import { Login } from "./pages/Login"
import { Dashboard } from "./pages/Dashboard"
import { AdminsList } from "./pages/Adminslist"
import { AdminForm } from "./pages/Adminform"
import { ContentList } from "./pages/ContentList"
import { ContentForm } from "./pages/ContentForm"
import { GalleryList } from "./pages/GalleryList"
import { GalleryForm } from "./pages/GalleryForm"
import { Profile } from "./pages/Profile"
import { NotFound } from "./pages/NotFound"

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
            <ContentForm />
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