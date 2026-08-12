export default function ProgressBar({ value = 0, max = 100, label, color = 'green', size = 'md' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const colors = {
    green:  'bg-primary-600',
    blue:   'bg-blue-500',
    red:    'bg-red-500',
    yellow: 'bg-yellow-400',
  }
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} ${colors[color]} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
