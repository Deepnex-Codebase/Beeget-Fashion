import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const AdminOffcanvas = ({ isOpen, onClose, tabs, activeTab, setActiveTab }) => {
  // Close navbar when pressing escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);
  
  // Prevent scrolling when navbar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  // Handle tab selection
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Offcanvas panel */}
          <motion.div
            className="fixed top-0 left-0 h-full w-80 max-w-[85%] bg-white shadow-sm z-50 flex flex-col"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
          >
            {/* Header */}
            <motion.div 
              className="flex items-center justify-between p-3 border-b border-gray-100"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.h2 
                className="text-sm font-medium text-gray-500 uppercase tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Menu
              </motion.h2>
              <motion.button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.1 }}
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </motion.button>
            </motion.div>
            
            {/* Navigation Links */}
            <motion.div className="flex-grow overflow-y-auto py-2 px-3">
              <motion.nav 
                className="space-y-1"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.03,
                      delayChildren: 0.2
                    }
                  }
                }}
              >
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md flex items-center text-sm
                      ${activeTab === tab.id
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'}
                      transition-colors duration-150
                    `}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 }
                    }}
                  >
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </motion.nav>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdminOffcanvas;