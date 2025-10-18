export function Input({ label, error, required = false, type = "text", ...props }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-semibold text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`px-4 py-4 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
          error
            ? "border-red-500 focus:border-red-600"
            : "border-gray-200 focus:border-blue-500 dark:focus:border-blue-400"
        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
        {...props}
      />
      {error && <span className="text-red-500 text-sm animate-wiggle">{error}</span>}
    </div>
  )
}