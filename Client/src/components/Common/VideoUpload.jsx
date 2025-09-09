import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axios from '../../utils/api';
import Button from './Button';
import Spinner from './Spinner';

const VideoUpload = ({ 
  label, 
  value, 
  onChange, 
  onVideoUpload, 
  placeholder = "Choose a video...",
  className = "",
  accept = "video/*",
  maxSize = (import.meta.env.VITE_VIDEO_UPLOAD_MAX_SIZE || 50) * 1024 * 1024, // Default 50MB or from .env
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
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
      formData.append('video', file);

      const response = await axios.post('/site-content/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Use the environment variable for video URL base if available
      let videoUrl = response.data.data.url;
      const videoUrlBase = import.meta.env.VITE_VIDEO_URL_BASE;
      
      // If we have a base URL and the response URL is a relative path, prepend the base URL
      if (videoUrlBase && videoUrl && !videoUrl.startsWith('http')) {
        videoUrl = `${videoUrlBase}/${videoUrl.startsWith('/') ? videoUrl.substring(1) : videoUrl}`;
      }
      setPreview(videoUrl);
      
      if (onChange) {
        onChange(videoUrl);
      }
      
      if (onVideoUpload) {
        onVideoUpload(response.data.data);
      }

      toast.success('Video uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = () => {
    setPreview(null);
    if (onChange) {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        {/* Video Preview */}
        {preview && (
          <div className="relative">
            <video
              src={preview}
              controls
              className="w-full h-32 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemoveVideo}
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
                <span>{preview ? 'Change Video' : 'Upload Video'}</span>
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

export default VideoUpload;