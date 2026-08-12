import { forwardRef } from 'react'

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className = '', ...props },
  ref
) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full px-4 py-2.5 border ${
          error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-primary-500'
        } rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-sm appearance-none cursor-pointer`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Select
