import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, helperText, icon, className = '', ...props },
  ref
) {
  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border ${
            error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-primary-500'
          } rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-sm`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-400">{helperText}</p>}
    </div>
  )
})

export default Input
