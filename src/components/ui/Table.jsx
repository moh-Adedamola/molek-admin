"use client"

export function Table({ columns, data, loading = false, onRowClick }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow-lg">
      <table className="w-full">
        <thead>
          <tr className="bg-blue-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-gray-900 dark:text-gray-100">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
