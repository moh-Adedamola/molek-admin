/*
 * Shared admin table. Columns can set hideOnMobile: true to drop less
 * important columns on phones; the table scrolls sideways (keyboard too)
 * when it is still wider than the screen.
 */
export function Table({ columns, data, loading = false, onRowClick, label = "Table" }) {
  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    )
  }
  const cell = (col) => `px-3 py-3 md:px-6 md:py-4 ${col.hideOnMobile ? "hidden md:table-cell" : ""}`
  return (
    <div>
      {data.length > 0 && <p className="md:hidden mb-1 text-xs text-gray-600">Swipe the table sideways to see more.</p>}
      <div className="overflow-x-auto rounded-xl shadow-lg" role="region" aria-label={label} tabIndex={0}>
        <table className="w-full">
          <thead>
            <tr className="bg-blue-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
              {columns.map((col) => (
                <th key={col.key} scope="col" className={`${cell(col)} text-left font-semibold text-gray-700 dark:text-gray-300`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`${cell(col)} text-gray-900 dark:text-gray-100`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
