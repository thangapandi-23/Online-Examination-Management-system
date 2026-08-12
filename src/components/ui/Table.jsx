import { useState } from 'react'

export default function Table({ columns = [], data = [], emptyMessage = 'No data found.' }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (!key) return
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(key); setSortDir('asc') }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortCol) return 0
    const va = a[sortCol] ?? ''
    const vb = b[sortCol] ?? ''
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va))
  })

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-card">
      <table className="min-w-full divide-y divide-gray-100 bg-white">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key || col.label}
                className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortCol === col.key && (
                    <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors duration-100">
                {columns.map((col) => (
                  <td key={col.key || col.label} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
