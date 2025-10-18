export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  const baseStyles = "font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:scale-105 hover:shadow-lg",
    secondary: "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600",
    danger: "bg-red-500 hover:bg-red-600 text-white hover:scale-105",
    outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20",
  }

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      {...props}
    >
      {loading ? "⏳" : children}
    </button>
  )
}
