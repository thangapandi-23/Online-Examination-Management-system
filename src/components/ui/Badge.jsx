const STATUS_COLORS = {
  Published:    'badge-green',
  Draft:        'badge-gray',
  Closed:       'badge-red',
  Active:       'badge-green',
  Submitted:    'badge-blue',
  'In Progress':'badge-yellow',
  Timeout:      'badge-red',
  Pass:         'badge-green',
  Fail:         'badge-red',
  Pending:      'badge-yellow',
  Admin:        'badge-blue',
  Teacher:      'badge-green',
  Student:      'badge-gray',
}

export default function Badge({ label, color }) {
  const cls = color
    ? `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`
    : STATUS_COLORS[label] || 'badge-gray'

  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
}
