import { useState, useEffect } from 'react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';

const PromoBanner = () => {
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveBanner = async () => {
      try {
        setLoading(true);
        const response = await api.get('/promo-banners/active');

        if (response.data && response.data.data) {
          // Check if this banner was previously dismissed
          const dismissedBannerId = localStorage.getItem('dismissedBannerId');
          if (dismissedBannerId === response.data.data._id) {
            setDismissed(true);
          } else {
            setBanner(response.data.data);
            setDismissed(false);
          }
        } else {
          setBanner(null);
        }
      } catch (error) {
        console.error('Error fetching promo banner:', error);
        setBanner(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveBanner();

    // Refresh banner data every 5 minutes
    const intervalId = setInterval(fetchActiveBanner, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (banner) {
      localStorage.setItem('dismissedBannerId', banner._id);
    }
  };

  // Don't render anything if loading, no banner, or banner is dismissed
  if (loading || !banner || dismissed) return null;

  // Check if banner has a valid link
  const hasLink = banner.link && banner.link.trim() !== '';

  return (
    <div style={{
      backgroundColor: banner.backgroundColor || '#4299e1',
      color: banner.textColor || '#ffffff'
    }}>
      <div
        className="relative w-full text-center py-3 px-4 text-sm font-medium max-w-7xl mx-auto"
      >
        <div className="flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-2" style={{ color: banner.textColor || '#ffffff' }} />
          {hasLink ? (
            <a href={banner.link} className="hover:underline text-sm font-medium">
              {banner.text}
            </a>
          ) : (
            <span className='text-sm font-medium'>{banner.text}</span>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
          aria-label="Dismiss banner"
        >
          <XMarkIcon className="h-4 w-4" style={{ color: banner.textColor || '#ffffff' }} />
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;