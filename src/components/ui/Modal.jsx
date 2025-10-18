export function Modal({ isOpen, title, children, onClose, actions }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideIn">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">
            ✕
          </button>
        </div>
        <div className="mb-6">{children}</div>
        <div className="flex gap-3 justify-end">
          {actions?.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                action.variant === "danger"
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
