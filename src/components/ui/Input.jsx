import { useId, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export function Input({ label, error, required = false, type = "text", id, ...props }) {
  const autoId = useId()
  const inputId = id || autoId
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword && showPassword ? "text" : type

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="font-semibold text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-700 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full px-4 py-4 ${isPassword ? "pr-12" : ""} rounded-2xl border-2 transition-all shadow-sm hover:shadow-md dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
            error
              ? "border-red-700 focus:border-red-700"
              : "border-gray-200 focus:border-blue-500 dark:focus:border-blue-400"
          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <span id={`${inputId}-error`} className="text-red-700 text-sm font-semibold">{error}</span>}
    </div>
  )
}
