"use client"

import { useContext } from "react"

import React from "react"

export const ToastContext = React.createContext()

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}

export function Toast({ message, type = "success", onClose }) {
  const bgColor = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"

  return (
    <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fadeIn`}>
      <span className="text-xl">{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-auto text-white/70 hover:text-white">
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
