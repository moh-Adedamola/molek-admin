import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ToastProvider } from "./components/ui/Toast"
import Routes from "./routes"

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Routes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
