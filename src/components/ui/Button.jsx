import Spinner from './Spinner'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary:   'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md',
    ghost:     'text-gray-600 hover:bg-gray-100',
    outline:   'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  )
}
