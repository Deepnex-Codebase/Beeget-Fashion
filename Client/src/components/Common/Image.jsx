import { useState } from 'react'

const Image = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/image_default.png',
  onError,
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(() => {
    // Show default image immediately if src is empty, null, undefined, or just whitespace
    if (!src || src.trim() === '' || src === 'null' || src === 'undefined') {
      return fallbackSrc;
    }
    return src;
  })
  const [hasError, setHasError] = useState(false)

  const handleError = (e) => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(fallbackSrc)
      if (onError) onError(e)
    }
  }

  return (
    <img
      src={imgSrc || fallbackSrc}
      alt={alt || 'Product image'}
      className={className}
      onError={handleError}
      {...props}
    />
  )
}

export default Image 