import { useCallback, useMemo, useRef, useState } from "react"
import { ToastContext } from "./toastContext"

export function Toast({ message, type = "success", onClose }) {
  const bgColor = type === "success" ? "bg-green-700" : type === "error" ? "bg-red-700" : "bg-blue-700"
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"

  return (
    <div role={type === "error" ? "alert" : "status"} className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fadeIn`}>
      <span className="text-xl">{icon}</span>
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="ml-auto text-white/80 hover:text-white">
        ✕
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  )
}

// Mount once around the app. Errors stay 8 seconds, other messages 5.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)
  const remove = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), [])
  const push = useCallback((type, message) => {
    const id = nextId.current++
    setToasts((all) => [...all, { id, type, message }])
    setTimeout(() => remove(id), type === "error" ? 8000 : 5000)
  }, [remove])
  const api = useMemo(() => ({
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  }), [push])
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}
