import { forwardRef } from 'react'

const Button = forwardRef(({
    children, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    disabled = false,
    loading = false,
    type = 'button',
    className = '',
    onClick,
    ...props 
  }, 
  ref
) => {
  // Base classes for all buttons
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200'
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-java-400 hover:bg-java-500 text-white focus:ring-java-400/50',
    secondary: 'bg-white border border-java-800 text-java-800 hover:bg-java-50 focus:ring-java-800/30',
    outline: 'bg-transparent border border-java-400 text-java-400 hover:bg-java-100 focus:ring-java-400/30',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/50',
    ghost: 'bg-transparent text-java-800 hover:bg-java-50 focus:ring-java-500/30'
  }
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-2.5 px-5',
    xl: 'text-lg py-3 px-6'
  }
  
  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed'
  
  // Full width class
  const widthClass = fullWidth ? 'w-full' : ''
  
  // Combine all classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    disabled ? disabledClasses : '',
    widthClass,
    className
  ].join(' ')
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
  
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button