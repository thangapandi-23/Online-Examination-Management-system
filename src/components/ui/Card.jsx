export default function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card border border-gray-100 p-6 transition-shadow duration-200 hover:shadow-card-hover ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function StatCard({ icon, title, value, subtitle, color = 'green', trend }) {
  const colors = {
    green:  { bg: 'bg-green-100',  icon: 'text-green-600' },
    blue:   { bg: 'bg-blue-100',   icon: 'text-blue-600' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
    red:    { bg: 'bg-red-100',    icon: 'text-red-600' },
    cyan:   { bg: 'bg-cyan-100',   icon: 'text-cyan-600' },
  }
  const c = colors[color] || colors.green

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex items-start gap-4 animate-fade-in hover:shadow-card-hover transition-shadow duration-200">
      <div className={`${c.bg} ${c.icon} p-3 rounded-xl`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
