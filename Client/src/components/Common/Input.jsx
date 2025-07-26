import { forwardRef, useEffect, useRef } from 'react'

const Input = forwardRef((
  {
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
  },
  ref
) => {
  // Create internal ref if external ref is not provided
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;
  
  // Custom handler for input changes that works even when disabled
  const handleInputChange = (e) => {
    if (onChange) {
      // Create a new synthetic event with the current target value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: e.target.value
        }
      };
      
      // Always call the original onChange handler regardless of disabled state
      onChange(syntheticEvent);
      
      // If input is disabled, make sure the value is updated in the DOM
      if (disabled && inputRef.current) {
        // Force update the input value to match the new value
        // This ensures the input reflects changes even when disabled
        const newValue = e.target.value;
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.value = newValue;
          }
        }, 0);
      }
    }
  };
  
  // Effect to focus and enable input when clicked
  useEffect(() => {
    const handleClick = () => {
      if (inputRef.current && disabled) {
        // Temporarily enable the input when clicked
        inputRef.current.disabled = false;
        inputRef.current.focus();
      }
    };
    
    // Add click event listener to the input element
    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('click', handleClick);
    }
    
    return () => {
      // Clean up event listener
      if (inputElement) {
        inputElement.removeEventListener('click', handleClick);
      }
    };
  }, [inputRef, disabled]);
  
  // Effect to re-attach event listener when ref changes
  useEffect(() => {
    // This ensures the event listener is properly attached after component updates
    const inputElement = inputRef.current;
    if (inputElement && disabled) {
      // Make sure the input is not actually disabled in the DOM
      // This allows typing but maintains the disabled visual appearance
      inputElement.disabled = false;
    }
  }, [value, disabled, inputRef]);
  
  // Base classes for the input
  const baseInputClasses = 'block rounded-md shadow-sm focus:ring-2 focus:ring-teal focus:border-teal sm:text-sm'
  
  // Error classes
  const errorClasses = error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
  
  // Disabled classes - make it look interactive even when disabled
  // We use data-disabled attribute to style the input as disabled
  const disabledClasses = disabled ? 'bg-white border-gray-300 hover:bg-gray-50 cursor-text opacity-75' : ''
  
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
        disabled={false} // Never actually disable the input to allow typing
        data-disabled={disabled} // Use a data attribute to track the disabled state
        required={required}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        onClick={(e) => {
          // Prevent default behavior when disabled
          if (disabled) {
            e.preventDefault();
            // Focus the input when clicked
            inputRef.current?.focus();
          }
        }}
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