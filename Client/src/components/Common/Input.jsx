import { forwardRef, useEffect, useRef } from 'react'

const Input = forwardRef(({
    label,
    name,
    type = 'text',
    placeholder,
    value,
    onChange,
    onBlur,
    error,
    helperText,
    required = false,
    disabled = false,
    className = '',
    fullWidth = true,
    ...props
  }, ref) => {
  // Create internal ref if external ref is not provided
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;
  
  // Handle input changes
  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };
  
  // Base classes for the input
  const baseInputClasses = 'block rounded-md shadow-sm focus:ring-2 focus:ring-teal focus:border-teal sm:text-sm'
  
  // Error classes
  const errorClasses = error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
  
  // Disabled classes
  const disabledClasses = disabled ? 'bg-gray-100 text-gray-500' : ''
  
  // Width class
  const widthClass = fullWidth ? 'w-full' : ''
  
  // Combine all classes
  const inputClasses = [
    baseInputClasses,
    errorClasses,
    disabledClasses,
    widthClass,
    className
  ].join(' ')
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-charcoal mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={inputRef}
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500" id={`${name}-helper`}>
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input