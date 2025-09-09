import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from '../../utils/api';
import Button from './Button';
import Spinner from './Spinner';

const ImageUpload = ({ 
  label, 
  value, 
  onChange, 
  onImageUpload, 
  placeholder = "Choose an image...",
  className = "",
  accept = "image/*",
  maxSize = (import.meta.env.VITE_IMAGE_UPLOAD_MAX_SIZE || 50) * 1024 * 1024, // Default 5MB or from .env
  disabled = false,
  isHeroSection = false // New prop to identify hero section uploads
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const fileInputRef = useRef(null);

  // Load saved image from localStorage on component mount
  useEffect(() => {
    // If value is already provided, use that instead
    if (value) return;
    
    let savedImage;
    if (isHeroSection) {
      savedImage = localStorage.getItem('heroSectionImage');
    } else if (accept === 'image/png') {
      savedImage = localStorage.getItem('pngImage');
    } else {
      savedImage = localStorage.getItem('lastUploadedImage');
    }
    
    if (savedImage) {
      setPreview(savedImage);
      if (onChange) {
        onChange(savedImage);
      }
    }
  }, [value, onChange, isHeroSection, accept]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Determine the correct endpoint based on file type and section
      let endpoint = '/site-content/upload-image';
      
      // Check if it's a PNG file
      if (file.name.toLowerCase().endsWith('.png')) {
        console.log('Uploading PNG file to special endpoint');
        endpoint = '/site-content/upload-png';
      }
      
      // If it's for hero section, use the dedicated hero endpoint
      if (isHeroSection) {
        console.log('Uploading image for hero section');
        endpoint = '/site-content/hero/upload-image';
      }

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Use the environment variable for image URL base if available
      let imageUrl = response.data.data.url;
      const imageUrlBase = import.meta.env.VITE_IMAGE_URL_BASE;
      
      // If we have a base URL and the response URL is a relative path, prepend the base URL
      if (imageUrlBase && imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${imageUrlBase}/${imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl}`;
      }
      // Store the image URL in localStorage to persist it across page refreshes
      if (isHeroSection) {
        localStorage.setItem('heroSectionImage', imageUrl);
      } else if (endpoint === '/site-content/upload-png') {
        localStorage.setItem('pngImage', imageUrl);
      } else {
        // For promotional banners and other images
        localStorage.setItem('lastUploadedImage', imageUrl);
      }
      
      setPreview(imageUrl);
      
      if (onChange) {
        onChange(imageUrl);
      }
      
      if (onImageUpload) {
        // Pass the full response data to the parent component
        onImageUpload(response.data.data);
      }

      toast.success('Image uploaded successfully');
    } catch (error) {
      // console.error('Image upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (onChange) {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Also remove from localStorage
    if (isHeroSection) {
      localStorage.removeItem('heroSectionImage');
    } else if (accept === 'image/png') {
      localStorage.removeItem('pngImage');
    } else {
      localStorage.removeItem('lastUploadedImage');
    }
  };

  const handleClick = () => {
    if (!uploading && !disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="space-y-3">
        {/* Image Preview */}
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-32 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex items-center space-x-3">
          <Button
            type="button"
            onClick={handleClick}
            disabled={uploading || disabled}
            className="flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <Spinner size="sm" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>{preview ? 'Change Image' : 'Upload Image'}</span>
              </>
            )}
          </Button>
          
          {uploading && (
            <span className="text-sm text-gray-500">
              Please wait...
            </span>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUpload;