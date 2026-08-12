import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'MMM dd, yyyy') } catch { return dateStr }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'MMM dd, yyyy • hh:mm a') } catch { return dateStr }
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—'
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) } catch { return dateStr }
}

export function formatDuration(minutes) {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m} minutes`
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Export an array of objects as a CSV file download.
 */
export function exportCSV(data, filename = 'export.csv') {
  if (!data?.length) return
  const keys = Object.keys(data[0])
  const header = keys.join(',')
  const rows = data.map(row =>
    keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const csv = [header, ...rows].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
