import { Routes as ReactRoutes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import { PrivateRoute } from "./components/layout/PrivateRoute"
import { Login } from "./pages/Login"
import { Dashboard } from "./pages/Dashboard"
import { UsersList } from "./pages/UsersList"
import { UserForm } from "./pages/UserForm"
import { StudentsList } from "./pages/StudentsList"
import { StudentForm } from "./pages/StudentForm"
import { ContentList } from "./pages/ContentList"
import { GalleryList } from "./pages/GalleryList"
import { GalleryForm } from "./pages/GalleryForm"
import { ContentForm } from "./pages/ContentForm"
import { Profile } from "./pages/Profile"
import { NotFound } from "./pages/NotFound"

export default function Routes() {
  const { isAuthenticated } = useAuth()

  return (
    <ReactRoutes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace/> : <Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/users"
        element={
          <PrivateRoute requiredRoles={["admin", "superadmin", "teacher"]}>
            <UsersList />
          </PrivateRoute>
        }
      />
      <Route
        path="/users/create"
        element={
          <PrivateRoute requiredRoles={["admin", "superadmin", "teacher"]}>
            <UserForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <PrivateRoute requiredRoles={["admin", "superadmin", "teacher"]}>
            <UserForm />
          </PrivateRoute>
        }
      />

      <Route
        path="/students"
        element={
          <PrivateRoute requiredRoles={["admin", "superadmin", "teacher"]}>
            <StudentsList />
          </PrivateRoute>
        }
      />
      <Route
        path="/students/create"
        element={
          <PrivateRoute requiredRoles={["admin", "superadmin", "teacher"]}>
            <StudentForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/students/:id/edit"
        element={
          <PrivateRoute requiredRoles={["admin", "superadmin", "teacher"]}>
            <StudentForm />
          </PrivateRoute>
        }
      />

      <Route
        path="/content"
        element={
          <PrivateRoute requiredRoles={["admin", "superadmin", "teacher"]}>
            <ContentList />
          </PrivateRoute>
        }
      />
      <Route
        path="/content/create"
        element={
          <PrivateRoute requiredRoles={["admin", "superadmin", "teacher"]}>
            <ContentForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/content/:id/edit"
        element={
          <PrivateRoute requiredRoles={["admin", "superadmin", "teacher"]}>
            <ContentForm />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
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

      <Route path="*" element={<NotFound />} />
    </ReactRoutes>
  )
}
