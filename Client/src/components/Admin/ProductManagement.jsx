import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import Input from '../Common/Input';
import { toast } from 'react-hot-toast';
import { FiUpload, FiDownload } from 'react-icons/fi';
import { PRODUCT_CONFIG, validateField, getFieldLabel, getDropdownOptions } from '../../config/productConfig';

const ProductManagement = () => {
  // Product modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  // Bulk upload state
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  
  // Bulk image upload state
  const [showBulkImageUploadModal, setShowBulkImageUploadModal] = useState(false);
  const [bulkImageFiles, setBulkImageFiles] = useState([]);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageUploadStatus, setImageUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [csvDownloadUrl, setCsvDownloadUrl] = useState('');

  // Product form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    selectedSizes: [], // Selected sizes for the product
    variants: [
      {
        sku: '',
        price: '',
        stock: '',
        attributes: {},
        images: [] // Variant-specific images
      }
    ],
    images: [], // General product images
    gstRate: '18'
  });
  
  // Image management state
  const [selectedVariantForImage, setSelectedVariantForImage] = useState(0);
  const [imagePreviewMode, setImagePreviewMode] = useState('general'); // 'general' or 'variant'
  const [selectedImageVariant, setSelectedImageVariant] = useState(null);
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const stepTitles = [
    'Basic Information',
    'Size Selection & Variants',
    'Product Images'
  ];
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Variant attributes form data
  const [attributeKeys, setAttributeKeys] = useState(['color', 'size']);
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const queryClient = useQueryClient();
  
  // New option state variables
  const [newColorOption, setNewColorOption] = useState('');
  const [newFabricOption, setNewFabricOption] = useState('');
  const [newFitOption, setNewFitOption] = useState('');
  const [newLengthOption, setNewLengthOption] = useState('');
  const [newNeckOption, setNewNeckOption] = useState('');
  const [newOccasionOption, setNewOccasionOption] = useState('');
  const [newPatternOption, setNewPatternOption] = useState('');
  const [newPrintTypeOption, setNewPrintTypeOption] = useState('');
  const [newSleeveLengthOption, setNewSleeveLengthOption] = useState('');
  const [newStitchTypeOption, setNewStitchTypeOption] = useState('');
  const [forceUpdate, setForceUpdate] = useState({});
  
  // Fetch products
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await axios.get('/products?limit=50');
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await axios.get('/categories');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Flatten category tree for dropdown
  const flattenCategories = (categories) => {
    if (!categories || !Array.isArray(categories)) return [];
    
    const result = [];
    
    categories.forEach(category => {
      result.push({
        _id: category._id,
        name: category.name,
        level: 0
      });
      
      if (category.children && Array.isArray(category.children)) {
        category.children.forEach(child => {
          result.push({
            _id: child._id,
            name: child.name,
            level: 1,
            parentName: category.name
          });
        });
      }
    });
    
    return result;
  };
  
  const flatCategories = flattenCategories(categoriesData?.data?.categories);
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData) => {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', productData.title);
      formData.append('description', productData.description);
      formData.append('category', productData.category);
      formData.append('variants', JSON.stringify(productData.variants));
      formData.append('gstRate', productData.gstRate);
      
      // Add product detail fields
      if (productData.color) formData.append('color', productData.color);
      // Handle multiple colors
      if (productData.colors && Array.isArray(productData.colors) && productData.colors.length > 0) {
        formData.append('colors', JSON.stringify(productData.colors));
      }
      if (productData.comboOf) formData.append('comboOf', productData.comboOf);
      if (productData.fabric) formData.append('fabric', productData.fabric);
      if (productData.fitShape) formData.append('fitShape', productData.fitShape);
      if (productData.length) formData.append('length', productData.length);
      if (productData.neck) formData.append('neck', productData.neck);
      if (productData.occasion) formData.append('occasion', productData.occasion);
      if (productData.pattern) formData.append('pattern', productData.pattern);
      if (productData.printType) formData.append('printType', productData.printType);
      if (productData.sleeveType) formData.append('sleeveType', productData.sleeveType);
      if (productData.stitchingType) formData.append('stitchingType', productData.stitchingType);
      if (productData.countryOfOrigin) formData.append('countryOfOrigin', productData.countryOfOrigin);
      if (productData.brand) formData.append('brand', productData.brand);
      if (productData.embellishment) formData.append('embellishment', productData.embellishment);
      
      // Add additional product detail fields
      if (productData.ornamentation) formData.append('ornamentation', productData.ornamentation);
      if (productData.sleeveStyling) formData.append('sleeveStyling', productData.sleeveStyling);
      if (productData.importerDetails) formData.append('importerDetails', productData.importerDetails);
      if (productData.sleeveLength) formData.append('sleeveLength', productData.sleeveLength);
      if (productData.stitchType) formData.append('stitchType', productData.stitchType);
      if (productData.manufacturerDetails) formData.append('manufacturerDetails', productData.manufacturerDetails);
      if (productData.packerDetails) formData.append('packerDetails', productData.packerDetails);
      
      // Add image files if any
      if (productData.imageFiles && productData.imageFiles.length > 0) {
        for (let i = 0; i < productData.imageFiles.length; i++) {
          formData.append('images', productData.imageFiles[i]);
        }
      }
      
      // Add video file if any
      if (productData.videoFile) {
        formData.append('video', productData.videoFile);
        formData.append('media_type', 'video');
      }
      
      const response = await axios.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      // Modal will be closed by the enhancedSubmit function after successful submission
      resetForm();
    }
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add text fields
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.category) formData.append('category', data.category);
      
      // Ensure all variants have a unique SKU before sending
      if (data.variants) {
        const processedVariants = data.variants.map(variant => {
          // Generate a unique SKU if empty
          if (!variant.sku || variant.sku === '') {
            const timestamp = Date.now().toString().slice(-6);
            const size = variant.attributes?.size || 'SIZE';
            const title = data.title || 'PROD';
            variant.sku = `${title.slice(0, 3).toUpperCase()}-${size}-${timestamp}`;
          }
          return variant;
        });
        formData.append('variants', JSON.stringify(processedVariants));
      }
      
      if (data.gstRate) formData.append('gstRate', data.gstRate);
      
      // Add product detail fields
      if (data.color !== undefined) formData.append('color', data.color);
      // Handle multiple colors
      if (data.colors && Array.isArray(data.colors) && data.colors.length > 0) {
        formData.append('colors', JSON.stringify(data.colors));
      }
      if (data.comboOf !== undefined) formData.append('comboOf', data.comboOf);
      if (data.fabric !== undefined) formData.append('fabric', data.fabric);
      if (data.fitShape !== undefined) formData.append('fitShape', data.fitShape);
      if (data.length !== undefined) formData.append('length', data.length);
      if (data.neck !== undefined) formData.append('neck', data.neck);
      if (data.occasion !== undefined) formData.append('occasion', data.occasion);
      if (data.pattern !== undefined) formData.append('pattern', data.pattern);
      if (data.printType !== undefined) formData.append('printType', data.printType);
      if (data.sleeveType !== undefined) formData.append('sleeveType', data.sleeveType);
      if (data.stitchingType !== undefined) formData.append('stitchingType', data.stitchingType);
      if (data.countryOfOrigin !== undefined) formData.append('countryOfOrigin', data.countryOfOrigin);
      if (data.brand !== undefined) formData.append('brand', data.brand);
      if (data.embellishment !== undefined) formData.append('embellishment', data.embellishment);
      
      // Add additional product detail fields
      if (data.ornamentation !== undefined) formData.append('ornamentation', data.ornamentation);
      if (data.sleeveStyling !== undefined) formData.append('sleeveStyling', data.sleeveStyling);
      if (data.importerDetails !== undefined) formData.append('importerDetails', data.importerDetails);
      if (data.sleeveLength !== undefined) formData.append('sleeveLength', data.sleeveLength);
      if (data.stitchType !== undefined) formData.append('stitchType', data.stitchType);
      if (data.manufacturerDetails !== undefined) formData.append('manufacturerDetails', data.manufacturerDetails);
      if (data.packerDetails !== undefined) formData.append('packerDetails', data.packerDetails);
      
      // Add image files if any
      if (data.imageFiles && data.imageFiles.length > 0) {
        for (let i = 0; i < data.imageFiles.length; i++) {
          formData.append('images', data.imageFiles[i]);
        }
      }
      
      // Add video file if any
      if (data.videoFile) {
        formData.append('video', data.videoFile);
        formData.append('media_type', 'video');
      }
      
      // Add images to remove if any
      if (data.removeImages && data.removeImages.length > 0) {
        formData.append('removeImages', JSON.stringify(data.removeImages));
      }
      
      const response = await axios.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      // Modal will be closed by the enhancedSubmit function after successful submission
      resetForm();
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowDeleteModal(false);
      setCurrentProduct(null);
    }
  });
  
  // Update product stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, variantSku, quantity }) => {
      const response = await axios.patch(`/products/${id}/stock`, { variantSku, quantity });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  });
  
  // Bulk upload products mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (file) => {
      setUploadStatus('uploading');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      return response.data;
    },
    onSuccess: (data) => {
      setUploadStatus('success');
      toast.success(`${data.message}`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setTimeout(() => {
        setShowBulkUploadModal(false);
        resetBulkUpload();
      }, 2000);
    },
    onError: (error) => {
      setUploadStatus('error');
      toast.error(error.response?.data?.message || 'Failed to upload products');
    }
  });
  
  // Bulk upload images mutation
  const bulkImageUploadMutation = useMutation({
    mutationFn: async (files) => {
      setImageUploadStatus('uploading');
      const formData = new FormData();
      
      // Add all image files
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
      
      const response = await axios.post('/products/bulk-upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setImageUploadProgress(percentCompleted);
        }
      });
      
      return response.data;
    },
    onSuccess: (data) => {
      setImageUploadStatus('success');
      toast.success(`${data.message}`);
      setUploadedImageUrls(data.data.images);
      setCsvDownloadUrl(data.data.csvUrl);
    },
    onError: (error) => {
      setImageUploadStatus('error');
      toast.error(error.response?.data?.message || 'Failed to upload images');
    }
  });
  
  // Handle basic form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle variant changes
  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[index] = {
        ...updatedVariants[index],
        [field]: value
      };
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };
  
  // Handle variant attribute changes
  const handleAttributeChange = (variantIndex, key, value) => {
    setFormData(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...updatedVariants[variantIndex],
        attributes: {
          ...updatedVariants[variantIndex].attributes,
          [key]: value
        }
      };
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };
  
  // Add a new variant
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sku: '',
          price: '',
          stock: 0, // Initialize stock to 0 as per backend requirement
          attributes: {
            color: prev.color || '' // Set color attribute from product's main color field
          },
          images: []
        }
      ]
    }));
  };
  
  // Remove a variant
  const removeVariant = (index) => {
    if (formData.variants.length <= 1) {
      toast.error('Product must have at least one variant');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };
  
  // Add a new attribute key
  const addAttributeKey = () => {
    if (!newAttributeKey.trim()) {
      toast.error('Please enter an attribute name');
      return;
    }
    
    if (attributeKeys.includes(newAttributeKey.trim())) {
      toast.error('This attribute already exists');
      return;
    }
    
    setAttributeKeys(prev => [...prev, newAttributeKey.trim()]);
    setNewAttributeKey('');
  };
  
  // Handle video file selection
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('video/')) {
      toast.error(`File "${file.name}" is not a supported video format`);
      return;
    }
    
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error(`File "${file.name}" exceeds 50MB size limit`);
      return;
    }
    
    // Create a preview URL for the video
    const videoPreviewUrl = URL.createObjectURL(file);
    
    setFormData(prev => ({
      ...prev,
      videoFile: file,
      videoPreviewUrl: videoPreviewUrl,
      media_type: 'video' // Set media type to video when video is uploaded
    }));
    
    toast.success(`Video "${file.name}" selected`);
    
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };
  
  // Handle removing video
  const handleVideoRemove = () => {
    // Revoke the object URL to avoid memory leaks
    if (formData.videoPreviewUrl) {
      URL.revokeObjectURL(formData.videoPreviewUrl);
    }
    
    setFormData(prev => {
      const updatedData = { ...prev };
      delete updatedData.videoFile;
      delete updatedData.videoPreviewUrl;
      updatedData.media_type = 'image'; // Reset to image type
      return updatedData;
    });
    
    toast.success('Video removed');
  };
  
  // Handle image file selection with multiple file support
  const handleImageFilesChange = (e, targetType = 'general', variantIndex = null) => {
    const newFiles = Array.from(e.target.files || []);
    
    if (newFiles.length === 0) return;
    
    // Show loading toast for large number of files
    let loadingToastId;
    if (newFiles.length > 3) {
      loadingToastId = toast.loading(`Processing ${newFiles.length} images...`);
    }
    
    // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error(`File "${file.name}" is not a supported image format`);
        return false;
      }
      
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds 5MB size limit`);
        return false;
      }
      
      return true;
    });
    
    // Add new files to existing ones
    setFormData(prev => {
      let updatedData = { ...prev };
      
      if (targetType === 'variant' && variantIndex !== null) {
        // Add to specific variant
        const updatedVariants = [...prev.variants];
        updatedVariants[variantIndex] = {
          ...updatedVariants[variantIndex],
          imageFiles: [...(updatedVariants[variantIndex].imageFiles || []), ...validFiles]
        };
        updatedData.variants = updatedVariants;
      } else {
        // Add to general product images
        updatedData.imageFiles = [...(prev.imageFiles || []), ...validFiles];
      }
      
      // Show success toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      
      if (validFiles.length > 0) {
        const location = targetType === 'variant' ? `variant ${variantIndex + 1}` : 'product';
        toast.success(`Added ${validFiles.length} image${validFiles.length !== 1 ? 's' : ''} to ${location}`);
      }
      
      return updatedData;
    });
    
    // Reset the input value to allow selecting the same files again
    e.target.value = '';
  };
  
  // Handle drag and drop for images
  const handleImageDrop = (e, targetType = 'general', variantIndex = null) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('bg-teal-50', 'border-teal-500');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFilesChange({ target: { files: e.dataTransfer.files } }, targetType, variantIndex);
    }
  };
  
  // Handle drag and drop for bulk images
  const handleBulkImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('bg-teal-50', 'border-teal-500');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleBulkImageFilesChange({ target: { files: e.dataTransfer.files } });
    }
  };
  
  // Handle removing a file from the selected files
  const handleImageFileRemove = (indexToRemove, targetType = 'general', variantIndex = null) => {
    setFormData(prev => {
      let updatedData = { ...prev };
      
      if (targetType === 'variant' && variantIndex !== null) {
        // Remove from specific variant
        const updatedVariants = [...prev.variants];
        updatedVariants[variantIndex] = {
          ...updatedVariants[variantIndex],
          imageFiles: Array.from(updatedVariants[variantIndex].imageFiles || []).filter((_, index) => index !== indexToRemove)
        };
        updatedData.variants = updatedVariants;
        toast.success(`Image removed from variant ${variantIndex + 1}`);
      } else {
        // Remove from general product images
        updatedData.imageFiles = Array.from(prev.imageFiles || []).filter((_, index) => index !== indexToRemove);
        toast.success('Image removed from product');
      }
      
      return updatedData;
    });
  };
  
  // Handle image removal from existing images
  const handleImageRemove = (imageUrl) => {
    setFormData(prev => {
      toast.success('Image removed from product');
      return {
        ...prev,
        removeImages: [...(prev.removeImages || []), imageUrl],
        images: prev.images.filter(url => url !== imageUrl)
      };
    });
  };
  
  // Reset form data
  const resetForm = () => {
    // Generate a unique SKU for the default variant
    const timestamp = Date.now().toString().slice(-6);
    // Always ensure we have a unique SKU, never empty
    const generatedSku = `PROD-DEFAULT-${timestamp}`;
    
    setFormData({
      title: '',
      description: '',
      category: '',
      videoFile: null,
      videoPreviewUrl: null,
      media_type: 'image', // Default to image
      selectedSizes: [], // Reset selected sizes
      variants: [
        {
          sku: generatedSku,
          price: '',
          stock: 0, // Initialize stock to 0 as per backend requirement
          meeshoPrice: '',
          wrongDefectivePrice: '',
          mrp: '',
          bustSize: '',
          shoulderSize: '',
          waistSize: '',
          sizeLength: '',
          hipSize: '',
          attributes: {
            color: '' // Initialize with empty color attribute
          },
          images: [],
          imageFiles: []
        }
      ],
      images: [],
      imageFiles: [],
      removeImages: [],
      gstRate: '18',
      // Add product detail fields
      color: '',
      colors: [], // Initialize with empty colors array
      comboOf: '',
      fabric: '',
      fitShape: '',
      length: '',
      neck: '',
      occasion: '',
      pattern: '',
      printType: '',
      sleeveType: '',
      stitchingType: '',
      countryOfOrigin: '',
      brand: '',
      embellishment: '',
      // Add new product detail fields
      ornamentation: '',
      sleeveStyling: '',
      importerDetails: '',
      sleeveLength: '',
      stitchType: '',
      manufacturerDetails: '',
      packerDetails: ''
    });
    setSelectedVariantForImage(0);
    setImagePreviewMode('general');
    setSelectedImageVariant(null);
  };
  
  // Open edit modal with product data
  const handleEditClick = (product) => {
    setCurrentProduct(product);
    setCurrentStep(1); // Always start at step 1
    
    // Extract selected sizes from existing variants
    const existingSizes = product.variants?.map(variant => variant.attributes?.size).filter(Boolean) || [];
    
    // Generate a unique SKU for the default variant if needed
    const timestamp = Date.now().toString().slice(-6);
    // Ensure we have a valid title to use for SKU generation
    const title = product.title || 'PROD';
    const generatedSku = `${title.slice(0, 3).toUpperCase()}-DEFAULT-${timestamp}`;
    
    setFormData({
      title: product.title,
      description: product.description,
      category: product.category?._id || product.category,
      videoFile: null,
      videoPreviewUrl: product.video || null,
      media_type: product.video ? 'video' : 'image',
      selectedSizes: existingSizes, // Set selected sizes from existing variants
      variants: product.variants?.map(variant => {
        // Generate a unique timestamp for each variant to ensure uniqueness
        const timestamp = Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
        // Ensure we have a valid title to use for SKU generation
        const title = product.title || 'PROD';
        // Ensure SKU is not empty
        const generatedSku = `${title.slice(0, 3).toUpperCase()}-${variant.attributes?.size || 'SIZE'}-${timestamp}`;
        
        return {
          ...variant,
          sku: variant.sku || generatedSku, // Use existing SKU if available, otherwise generate a new one
          price: variant.price || '',
          meeshoPrice: variant.meeshoPrice || '',
          wrongDefectivePrice: variant.wrongDefectivePrice || '',
          mrp: variant.mrp || '',
          bustSize: variant.bustSize || '',
          shoulderSize: variant.shoulderSize || '',
          waistSize: variant.waistSize || '',
          sizeLength: variant.sizeLength || '',
          hipSize: variant.hipSize || '',
          images: variant.images || [],
          imageFiles: []
        };
      }) || [
        {
          sku: generatedSku,
          price: '',
          stock: '',
          meeshoPrice: '',
          wrongDefectivePrice: '',
          mrp: '',
          bustSize: '',
          shoulderSize: '',
          waistSize: '',
          sizeLength: '',
          hipSize: '',
          attributes: {
            color: product.color || '' // Set color attribute from product's main color field
          },
          images: [],
          imageFiles: []
        }
      ],
      images: product.images || [],
      imageFiles: [],
      removeImages: [],
      gstRate: product.gstRate?.toString() || '18',
      // Add product detail fields with existing values or defaults
      color: product.color || '',
      // Handle multiple colors if they exist, otherwise initialize with single color in array
      colors: product.colors && Array.isArray(product.colors) ? product.colors : 
              (product.color ? [product.color] : []),
      comboOf: product.comboOf || '',
      fabric: product.fabric || '',
      fitShape: product.fitShape || '',
      length: product.length || '',
      neck: product.neck || '',
      occasion: product.occasion || '',
      pattern: product.pattern || '',
      printType: product.printType || '',
      sleeveType: product.sleeveType || '',
      stitchingType: product.stitchingType || '',
      countryOfOrigin: product.countryOfOrigin || '',
      brand: product.brand || '',
      embellishment: product.embellishment || '',
      // Add new product detail fields with existing values or defaults
      ornamentation: product.ornamentation || '',
      sleeveStyling: product.sleeveStyling || '',
      importerDetails: product.importerDetails || '',
      sleeveLength: product.sleeveLength || '',
      stitchType: product.stitchType || '',
      manufacturerDetails: product.manufacturerDetails || '',
      packerDetails: product.packerDetails || ''
    });
    setSelectedVariantForImage(0);
    setImagePreviewMode('general');
    setSelectedImageVariant(null);
    setShowEditModal(true);
  };
  
  // Open view product modal
  const handleViewClick = (product) => {
    setCurrentProduct(product);
    setShowViewModal(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (product) => {
    setCurrentProduct(product);
    setShowDeleteModal(true);
  };
  
  // Handle form submission for creating/updating product
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // The validateForm function in renderProductForm now handles validation
    // This function is now primarily focused on submission
    
    // Convert numeric values for all variants
    for (let i = 0; i < formData.variants.length; i++) {
      const variant = formData.variants[i];
      variant.price = Number(variant.price);
      variant.stock = Number(variant.stock);
    }
    
    // Show loading toast
    const loadingToastId = toast.loading(currentProduct ? 'Updating product...' : 'Creating product...');
    
    try {
      if (currentProduct) {
        // Update existing product
        updateProductMutation.mutate({ id: currentProduct._id, data: formData }, {
          onSuccess: () => {
            toast.dismiss(loadingToastId);
            toast.success('Product updated successfully');
            // Close the modal after successful submission
            setShowEditModal(false);
          },
          onError: (error) => {
            toast.dismiss(loadingToastId);
            toast.error(error.response?.data?.message || 'Failed to update product');
          }
        });
      } else {
        // Create new product
        createProductMutation.mutate(formData, {
          onSuccess: () => {
            toast.dismiss(loadingToastId);
            toast.success('Product created successfully');
            // Close the modal after successful submission
            setShowAddModal(false);
          },
          onError: (error) => {
            toast.dismiss(loadingToastId);
            toast.error(error.response?.data?.message || 'Failed to create product');
          }
        });
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error('An unexpected error occurred');
      console.error('Form submission error:', error);
    }
  };
  
  // Handle stock update
  const handleStockUpdate = (productId, variantSku, newStock) => {
    // Validate stock value
    const stockValue = Number(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
      toast.error('Stock must be a valid non-negative number');
      return;
    }
    
    // Show loading toast
    const loadingToastId = toast.loading('Updating stock...');
    
    updateStockMutation.mutate({
      id: productId,
      variantSku,
      quantity: stockValue
    }, {
      onSuccess: () => {
        toast.dismiss(loadingToastId);
        toast.success('Stock updated successfully');
      },
      onError: (error) => {
        toast.dismiss(loadingToastId);
        toast.error(error.response?.data?.message || 'Failed to update stock');
      }
    });
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };
  
  // Handle bulk upload file change
  const handleBulkFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const fileType = file.name.split('.').pop().toLowerCase();
      if (fileType !== 'csv' && fileType !== 'json') {
        toast.error('Please upload a CSV or JSON file');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }
      
      setBulkUploadFile(file);
    }
  };
  
  // Handle bulk upload submit
  const handleBulkUpload = () => {
    if (!bulkUploadFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    bulkUploadMutation.mutate(bulkUploadFile);
  };
  
  // Reset bulk upload state
  const resetBulkUpload = () => {
    setBulkUploadFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
  };
  
  // Reset bulk image upload state
  const resetBulkImageUpload = () => {
    setBulkImageFiles([]);
    setImageUploadProgress(0);
    setImageUploadStatus('idle');
    setUploadedImageUrls([]);
    setCsvDownloadUrl('');
  };
  
  // Generate sample CSV
  const generateSampleCSV = () => {
    const headers = 'title,description,category,sku,price,stock,color,size,images,gstRate';
    
    // Get first category ID from the available categories
    let categoryId = '';
    if (flatCategories && flatCategories.length > 0) {
      categoryId = flatCategories[0]._id;
    }
    
    // Sample data with multiple variants of the same product
    const sampleData = [
      `Mens Cotton T-Shirt,Cotton T-Shirt,${categoryId},TSHIRT-RED-L,499,100,Red,L,"https://example.com/img1.jpg,https://example.com/img2.jpg",5`,
      `Mens Cotton T-Shirt,Cotton T-Shirt,${categoryId},TSHIRT-RED-M,499,150,Red,M,"https://example.com/img1.jpg,https://example.com/img2.jpg",5`,
      `Mens Cotton T-Shirt,Cotton T-Shirt,${categoryId},TSHIRT-BLUE-L,499,80,Blue,L,"https://example.com/img3.jpg,https://example.com/img4.jpg",5`,
      `Mens Cotton T-Shirt,Cotton T-Shirt,${categoryId},TSHIRT-BLUE-M,499,120,Blue,M,"https://example.com/img3.jpg,https://example.com/img4.jpg",5`
    ].join('\n');
    
    const csvContent = `${headers}\n${sampleData}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'product_upload_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Generate sample JSON
  const generateSampleJSON = () => {
    // Get first category ID from the available categories
    let categoryId = '';
    if (flatCategories && flatCategories.length > 0) {
      categoryId = flatCategories[0]._id;
    }
    
    // Sample data with multiple variants for the same product
    const sampleData = [
      {
        title: 'मेन्स कॉटन टी-शर्ट',
        description: 'Cotton T-Shirt',
        category: categoryId, // Use category ID instead of name
        gstRate: 5,
        images: [
          'https://example.com/img1.jpg',
          'https://example.com/img2.jpg'
        ],
        variants: [
          {
            sku: 'TSHIRT-RED-L',
            price: 499,
            stock: 100,
            attributes: {
              Color: 'Red',
              Size: 'L'
            }
          },
          {
            sku: 'TSHIRT-RED-M',
            price: 499,
            stock: 150,
            attributes: {
              Color: 'Red',
              Size: 'M'
            }
          },
          {
            sku: 'TSHIRT-BLUE-L',
            price: 499,
            stock: 80,
            attributes: {
              Color: 'Blue',
              Size: 'L'
            }
          },
          {
            sku: 'TSHIRT-BLUE-M',
            price: 499,
            stock: 120,
            attributes: {
              Color: 'Blue',
              Size: 'M'
            }
          }
        ]
      }
    ];
    
    const jsonContent = JSON.stringify(sampleData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'product_upload_sample.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle bulk image file change
  const handleBulkImageFilesChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    
    if (newFiles.length === 0) return;
    
    // Show loading toast for large number of files
    let loadingToastId;
    if (newFiles.length > 10) {
      loadingToastId = toast.loading(`Processing ${newFiles.length} images...`);
    }
    
    // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error(`File "${file.name}" is not a supported image format`);
        return false;
      }
      
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds 5MB size limit`);
        return false;
      }
      
      return true;
    });
    
    // Add new files to existing ones
    setBulkImageFiles(prev => {
      const updatedImageFiles = [...prev, ...validFiles];
      
      // Show success toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      
      if (validFiles.length > 0) {
        toast.success(`Added ${validFiles.length} image${validFiles.length !== 1 ? 's' : ''}`);
      }
      
      return updatedImageFiles;
    });
    
    // Reset the input value to allow selecting the same files again
    e.target.value = '';
  };
  
  // Handle bulk image upload
  const handleBulkImageUpload = () => {
    if (!bulkImageFiles.length) {
      toast.error('Please select images to upload');
      return;
    }
    
    bulkImageUploadMutation.mutate(bulkImageFiles);
  };
  
  // Handle removing a file from the selected bulk image files
  const handleBulkImageFileRemove = (indexToRemove) => {
    setBulkImageFiles(prev => {
      const updatedImageFiles = prev.filter((_, index) => index !== indexToRemove);
      toast.success('Image removed from selection');
      return updatedImageFiles;
    });
  };
  
  // Download CSV with image URLs
  const downloadImageUrlsCsv = () => {
    if (!csvDownloadUrl) {
      toast.error('No CSV file available for download');
      return;
    }
    
    const link = document.createElement('a');
    link.href = csvDownloadUrl;
    link.setAttribute('download', 'image_urls.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filter products based on search term and category filter
  const getFilteredProducts = () => {
    if (!productsData?.data?.products) return [];
    
    return productsData.data.products.filter(product => {
      // Filter by search term
      const matchesSearch = searchTerm === '' || 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.variants.some(variant => variant.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by category
      const matchesCategory = categoryFilter === '' || 
        product.category?._id === categoryFilter ||
        product.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  };
  
  // Render product list
  const renderProductList = () => {
    if (productsLoading) {
      return (
        <div className="flex flex-col justify-center items-center py-12 bg-white rounded-lg shadow-sm">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-gray-600 text-lg font-medium">Loading products...</span>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch the product data</p>
        </div>
      );
    }
    
    if (productsError) {
      return (
        <div className="text-center py-8 bg-red-50 rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-500 text-lg">Error loading products</p>
          <p className="text-red-400 text-sm mt-1">Please try refreshing the page or try again later</p>
          <button 
            onClick={() => queryClient.invalidateQueries(['products'])}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    
    const filteredProducts = getFilteredProducts();
    
    if (!filteredProducts.length) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
        </div>
      );
    }
    
    // Helper function to handle image errors
    const handleImageError = (e, imageUrl) => {
      try {
        const url = new URL(imageUrl);
        e.target.src = url.pathname;
      } catch (error) {
        console.error('Invalid image URL:', error);
      }
    };
    
    return (
      <div className="overflow-visible shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Variants</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">GST Rate</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 mr-3">
                      {product.images && product.images[0] ? (
                        <img 
                          className="h-10 w-10 rounded-md object-cover" 
                          src={product.images[0]} 
                          alt={product.title} 
                          onError={(e) => handleImageError(e, product.images[0])}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900 truncate">{product.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {product.category?.name || 
                     flatCategories.find(cat => cat._id === product.category)?.name || 
                     'Uncategorized'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="max-h-20 overflow-y-auto pr-2 scrollbar-thin">
                    {product.variants?.slice(0, 3).map((variant, index) => (
                      <div key={variant.sku || index} className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium truncate max-w-[100px]">{variant.sku}</span>
                        <span className="text-xs text-gray-500">{formatCurrency(variant.mrp || variant.price)}</span>
                      </div>
                    ))}
                    {product.variants?.length > 3 && (
                      <div className="text-xs text-gray-500 italic">+{product.variants.length - 3} more variants</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="max-h-20 overflow-y-auto pr-2 scrollbar-thin">
                    {product.variants?.slice(0, 3).map((variant, index) => (
                      <div key={variant.sku || index} className="mb-1">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${variant.stock > 10 ? 'bg-green-100 text-green-800' : variant.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {variant.stock > 0 ? `${variant.stock}` : 'Out of stock'}
                        </span>
                      </div>
                    ))}
                    {product.variants?.length > 3 && (
                      <div className="text-xs text-gray-500 italic">+{product.variants.length - 3} more</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {product.gstRate || 18}%
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="primary" 
                      size="xs" 
                      onClick={() => handleViewClick(product)}
                      className="flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => handleEditClick(product)}
                      className="flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Button>
                    <Button 
                      variant="danger" 
                      size="xs" 
                      onClick={() => handleDeleteClick(product)}
                      className="flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render product form (for add/edit modals)
  const renderProductForm = () => {
    // Form validation errors state
    const [errors, setErrors] = useState({});
    
    // Validate specific step
    const validateStep = (step) => {
      const newErrors = {};
      
      if (step === 1) {
        // Use dynamic validation for all fields
        // Validate required fields for step 1
        const step1Fields = ['title', 'description', 'category', 'gstRate'];
        step1Fields.forEach(fieldName => {
          const validation = validateField(fieldName, formData[fieldName]);
          if (!validation.isValid) {
            newErrors[fieldName] = validation.message;
          }
        });
        
        // Validate colors (either single color or multiple colors must be selected)
        if ((!formData.color || formData.color === '') && 
            (!formData.colors || !Array.isArray(formData.colors) || formData.colors.length === 0)) {
          newErrors.colors = 'At least one color must be selected';
        }
      } else if (step === 2) {
        // Validate size selection
        if (!formData.selectedSizes || formData.selectedSizes.length === 0) {
          newErrors.selectedSizes = 'At least one size must be selected';
        }
        // Validate variants
        if (formData.variants.length === 0) {
          newErrors.variants = 'At least one variant is required';
        } else {
          let hasVariantErrors = false;
          formData.variants.forEach((variant, index) => {
            // Ensure variant has all required fields with proper types
            if (!variant) {
              newErrors[`variant_${index}`] = 'Variant is missing';
              hasVariantErrors = true;
              return;
            }
            
            // First, ensure all required fields exist with proper values
            const numericFields = ['meeshoPrice', 'mrp', 'stock', 'bustSize', 'shoulderSize', 'waistSize', 'sizeLength'];
            
            // Set default values for all numeric fields
            numericFields.forEach(fieldName => {
              // Ensure the field exists and is a valid number
              if (variant[fieldName] === undefined || variant[fieldName] === null || variant[fieldName] === '') {
                variant[fieldName] = 0; // Set default value
              } else if (typeof variant[fieldName] === 'string') {
                // Convert string to number
                const numValue = parseFloat(variant[fieldName]);
                variant[fieldName] = isNaN(numValue) ? 0 : numValue;
              }
            });
            
            // Ensure attributes object exists with size property
            if (!variant.attributes || typeof variant.attributes !== 'object') {
              variant.attributes = { size: variant.size || formData.selectedSizes[index] || '' };
            } else if (!variant.attributes.size) {
              // Ensure size property exists in attributes
              variant.attributes.size = formData.selectedSizes[index] || '';
            }
            
            // Now validate each required field
            PRODUCT_CONFIG.VARIANT_FIELDS.REQUIRED.forEach(fieldName => {
              // Skip attributes validation since we've already handled it
              if (fieldName === 'attributes') return;
              
              const validation = validateField(fieldName, variant[fieldName]);
              if (!validation.isValid) {
                newErrors[`variant_${index}_${fieldName}`] = validation.message;
                hasVariantErrors = true;
              }
            });
            
            // Validate optional fields if they have values
            PRODUCT_CONFIG.VARIANT_FIELDS.OPTIONAL.forEach(fieldName => {
              if (variant[fieldName] !== undefined && variant[fieldName] !== null && variant[fieldName] !== '') {
                // Convert numeric fields to numbers
                if (numericFields.includes(fieldName) && typeof variant[fieldName] === 'string') {
                  const numValue = parseFloat(variant[fieldName]);
                  variant[fieldName] = isNaN(numValue) ? 0 : numValue;
                }
                
                const validation = validateField(fieldName, variant[fieldName]);
                if (!validation.isValid) {
                  newErrors[`variant_${index}_${fieldName}`] = validation.message;
                  hasVariantErrors = true;
                }
              }
            });
          });
          
          if (hasVariantErrors) {
            newErrors.variants = 'Please fix errors in variant details';
          }
        }
      } else if (step === 3) {
        // Validate images
        const hasExistingImages = formData.images && formData.images.length > 0;
        const hasNewImages = formData.imageFiles && formData.imageFiles.length > 0;
        
        // Only validate if this is a new product (for edit, images are optional)
        if (!currentProduct && !hasExistingImages && !hasNewImages) {
          newErrors.images = 'At least one product image is required';
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    // Initialize form with no validation errors
    useEffect(() => {
      // Reset errors when modal opens
      setErrors({});
    }, [showAddModal, showEditModal]);
    
    // Check if current step is valid (to avoid infinite renders)
    const [isCurrentStepValid, setIsCurrentStepValid] = useState(true);
    
    // Update validation state when step or form data changes
    useEffect(() => {
      // Only validate after user interaction (form submission attempt or next button click)
      // This prevents showing errors when the form first loads
      const shouldValidate = Object.keys(errors).length > 0;
      
      if (!shouldValidate) {
        setIsCurrentStepValid(true);
        return;
      }
      
      const newErrors = {};
      
      if (currentStep === 1) {
        // Use dynamic validation for all fields
        const step1Fields = ['title', 'description', 'category', 'gstRate'];
        step1Fields.forEach(fieldName => {
          const validation = validateField(fieldName, formData[fieldName]);
          if (!validation.isValid) {
            newErrors[fieldName] = validation.message;
          }
        });
      } else if (currentStep === 2) {
        // Validate size selection
        if (!formData.selectedSizes || formData.selectedSizes.length === 0) {
          newErrors.selectedSizes = 'At least one size must be selected';
        }
        
        // Ensure all variants have proper number values for required fields
        if (formData.variants && formData.variants.length > 0) {
          formData.variants.forEach((variant, index) => {
            if (variant) {
              // Define all numeric fields
              const numericFields = ['meeshoPrice', 'mrp', 'stock', 'bustSize', 'shoulderSize', 'waistSize', 'sizeLength', 'netWeight', 'hipSize', 'wrongDefectivePrice'];
              
              // Convert string values to numbers for numeric fields
              numericFields.forEach(field => {
                if (variant[field] === undefined || variant[field] === null || variant[field] === '') {
                  // Set default values for required fields
                  if (['meeshoPrice', 'mrp', 'stock', 'bustSize', 'shoulderSize', 'waistSize', 'sizeLength'].includes(field)) {
                    variant[field] = field === 'netWeight' ? 0.1 : 0;
                  }
                } else if (typeof variant[field] === 'string') {
                  // Convert string to number, handling invalid inputs
                  const numValue = parseFloat(variant[field]);
                  variant[field] = isNaN(numValue) ? (field === 'netWeight' ? 0.1 : 0) : numValue;
                }
              });
              
              // Ensure attributes object exists with proper size value
              if (!variant.attributes || typeof variant.attributes !== 'object') {
                variant.attributes = { size: variant.size || formData.selectedSizes[index] || '' };
              } else if (!variant.attributes.size) {
                const sizeFromIndex = formData.selectedSizes[index];
                variant.attributes.size = sizeFromIndex || '';
              }
            }
          });
        }
        
        // Validate variants
        if (formData.variants.length === 0) {
          newErrors.variants = 'At least one variant is required';
        } else {
          let hasVariantErrors = false;
          formData.variants.forEach((variant, index) => {
            // Use dynamic validation for required variant fields
            PRODUCT_CONFIG.VARIANT_FIELDS.REQUIRED.forEach(fieldName => {
              const validation = validateField(fieldName, variant[fieldName]);
              if (!validation.isValid) {
                newErrors[`variant_${index}_${fieldName}`] = validation.message;
                hasVariantErrors = true;
              }
            });
            
            // Use dynamic validation for optional variant fields
            PRODUCT_CONFIG.VARIANT_FIELDS.OPTIONAL.forEach(fieldName => {
              // Only validate if field has a value
              if (variant[fieldName] !== undefined && variant[fieldName] !== null && variant[fieldName] !== '') {
                const validation = validateField(fieldName, variant[fieldName]);
                if (!validation.isValid) {
                  newErrors[`variant_${index}_${fieldName}`] = validation.message;
                  hasVariantErrors = true;
                }
              }
            });
          });

          
          if (hasVariantErrors) {
            newErrors.variants = 'Please fix errors in variant details';
          }
        }
      } else if (currentStep === 3) {
        // Validate images
        const hasExistingImages = formData.images && formData.images.length > 0;
        const hasNewImages = formData.imageFiles && formData.imageFiles.length > 0;
        
        // Only validate if this is a new product (for edit, images are optional)
        if (!currentProduct && !hasExistingImages && !hasNewImages) {
          newErrors.images = 'At least one product image is required';
        }
      }
      
      setErrors(newErrors);
      setIsCurrentStepValid(Object.keys(newErrors).length === 0);
    }, [currentStep, formData]); // Removed 'errors' from dependency array to prevent infinite loop
    
    // Validate all steps for final submission
    const validateForm = () => {
      // Validate all steps
      const step1Valid = validateStep(1);
      const step2Valid = validateStep(2);
      const step3Valid = validateStep(3);
      
      return step1Valid && step2Valid && step3Valid;
    };
    
    // Handle next step
    const handleNextStep = () => {
      // Explicitly validate the current step before proceeding
      if (validateStep(currentStep)) {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      } else {
        // Scroll to the first error
        const firstErrorField = document.querySelector('.error-field');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };
    
    // Handle previous step
    const handlePrevStep = () => {
      // Use setTimeout to ensure state updates properly
      setTimeout(() => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
      }, 10);
    };
    
    // Enhanced submit handler with validation
    const enhancedSubmit = (e) => {
      e.preventDefault();
      if (validateForm()) {
        handleSubmit(e);
      } else {
        // Scroll to the first error
        const firstErrorField = document.querySelector('.error-field');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };
    
    return (
    <form onSubmit={enhancedSubmit} className="space-y-6">
      {/* Enhanced Form Header with Title and Steps */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-xl border border-teal-200 mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {currentProduct ? '✏️ Edit Product Details' : '➕ Add New Product'}
            </h3>
            <p className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </div>
          </div>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 shadow-inner">
          <div 
            className="bg-gradient-to-r from-teal-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex justify-between items-center mb-3">
          {stepTitles.map((title, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                index + 1 < currentStep 
                  ? 'bg-green-500 text-white shadow-md' 
                  : index + 1 === currentStep 
                  ? 'bg-teal-500 text-white shadow-md ring-2 ring-teal-200' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {index + 1 < currentStep ? '✓' : index + 1}
              </div>
              {index < stepTitles.length - 1 && (
                <div className={`w-12 h-1 mx-2 rounded transition-all duration-300 ${
                  index + 1 < currentStep ? 'bg-green-400' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Fields marked with * are required
        </div>
      </div>
      
      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800">📝 Basic Information</h4>
              <p className="text-sm text-gray-600">Enter the fundamental details about your product</p>
            </div>
          </div>
          
          {/* Basic Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className={errors.title ? 'error-field' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                onBlur={() => {
                  if (!formData.title.trim()) {
                    setErrors(prev => ({ ...prev, title: 'Product name is required' }));
                  } else {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.title;
                      return newErrors;
                    });
                  }
                }}
                placeholder="Enter Product Name"
                className={`w-full focus:border-teal-500 ${errors.title ? 'border-red-500 bg-red-50' : ''}`}
              />
              {errors.title ? (
                <p className="text-xs text-red-600 mt-1">{errors.title}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Product name as it will appear to customers</p>
              )}
            </div>
            
            <div className={errors.styleCode ? 'error-field' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Code (optional)</label>
              <Input
                type="text"
                name="styleCode"
                value={formData.styleCode || ''}
                onChange={handleInputChange}
                placeholder="Enter Product Code (optional)"
                className="w-full focus:border-teal-500"
              />
              <p className="text-xs text-gray-500 mt-1">Internal product identifier or style code</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className={errors.category ? 'error-field' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                onBlur={() => {
                  if (!formData.category) {
                    setErrors(prev => ({ ...prev, category: 'Category is required' }));
                  } else {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.category;
                      return newErrors;
                    });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="">Select</option>
                {flatCategories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.level > 0 ? `↳ ${category.name} (${category.parentName})` : category.name}
                  </option>
                ))}
              </select>
              {errors.category ? (
                <p className="text-xs text-red-600 mt-1">{errors.category}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Choose the most appropriate category</p>
              )}
            </div>
          </div>
          
          {/* Product Details Section */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h5 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">📋</span>
              </span>
              Product Details
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className={errors.colors ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colors *</label>
                <div className="relative">
                  <div className="flex flex-col space-y-2">
                    <select
                      name="colors"
                      multiple
                      value={formData.colors || []}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                        setFormData(prev => ({
                          ...prev,
                          colors: selectedOptions,
                          // Also set the single color field for backward compatibility
                          color: selectedOptions.length > 0 ? selectedOptions[0] : ''
                        }));
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.colors ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      size="4"
                    >
                      {getDropdownOptions('colors').map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        placeholder="Add new color"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newColorOption || ''}
                        onChange={(e) => setNewColorOption(e.target.value)}
                      />
                      <button
                        type="button"
                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => {
                          if (newColorOption && newColorOption.trim() !== '') {
                            // Add to PRODUCT_CONFIG in memory
                            const updatedColors = [...PRODUCT_CONFIG.COLORS, newColorOption.trim()];
                            PRODUCT_CONFIG.COLORS = updatedColors;
                            
                            // Clear the input
                            setNewColorOption('');
                            
                            // Force re-render
                            setForceUpdate({});
                            
                            toast.success(`Added new color: ${newColorOption.trim()}`);
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                {errors.colors && <p className="text-xs text-red-600 mt-1">{errors.colors}</p>}
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd key to select multiple colors</p>
              </div>
              
              <div className={errors.comboOf ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Combo Pack *</label>
                <select
                  name="comboOf"
                  value={formData.comboOf || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.comboOf ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select</option>
                  {getDropdownOptions('comboPacks').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.comboOf && <p className="text-xs text-red-600 mt-1">{errors.comboOf}</p>}
              </div>
              
              <div className={errors.fabric ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fabric *</label>
                <div className="flex flex-col space-y-2">
                  <select
                    name="fabric"
                    value={formData.fabric || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fabric ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    {getDropdownOptions('fabrics').map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Add new fabric"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newFabricOption || ''}
                      onChange={(e) => setNewFabricOption(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => {
                        if (newFabricOption && newFabricOption.trim() !== '') {
                          // Add to PRODUCT_CONFIG in memory
                          const updatedFabrics = [...PRODUCT_CONFIG.FABRICS, newFabricOption.trim()];
                          PRODUCT_CONFIG.FABRICS = updatedFabrics;
                          
                          // Clear the input
                          setNewFabricOption('');
                          
                          // Force re-render
                          setForceUpdate({});
                          
                          toast.success(`Added new fabric: ${newFabricOption.trim()}`);
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {errors.fabric && <p className="text-xs text-red-600 mt-1">{errors.fabric}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className={errors.fitShape ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fit *</label>
                <div className="flex flex-col space-y-2">
                  <select
                    name="fitShape"
                    value={formData.fitShape || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fitShape ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    {getDropdownOptions('fitShapes').map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Add new fit"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newFitOption || ''}
                      onChange={(e) => setNewFitOption(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => {
                        if (newFitOption && newFitOption.trim() !== '') {
                          // Add to PRODUCT_CONFIG in memory
                          const updatedFits = [...PRODUCT_CONFIG.FIT_SHAPES, newFitOption.trim()];
                          PRODUCT_CONFIG.FIT_SHAPES = updatedFits;
                          
                          // Clear the input
                          setNewFitOption('');
                          
                          // Force re-render
                          setForceUpdate({});
                          
                          toast.success(`Added new fit: ${newFitOption.trim()}`);
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {errors.fitShape && <p className="text-xs text-red-600 mt-1">{errors.fitShape}</p>}
              </div>
              
              <div className={errors.length ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length *</label>
                <div className="flex flex-col space-y-2">
                  <select
                    name="length"
                    value={formData.length || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.length ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    {getDropdownOptions('lengths').map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Add new length"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newLengthOption || ''}
                      onChange={(e) => setNewLengthOption(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => {
                        if (newLengthOption && newLengthOption.trim() !== '') {
                          // Add to PRODUCT_CONFIG in memory
                          const updatedLengths = [...PRODUCT_CONFIG.LENGTHS, newLengthOption.trim()];
                          PRODUCT_CONFIG.LENGTHS = updatedLengths;
                          
                          // Clear the input
                          setNewLengthOption('');
                          
                          // Force re-render
                          setForceUpdate({});
                          
                          toast.success(`Added new length: ${newLengthOption.trim()}`);
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {errors.length && <p className="text-xs text-red-600 mt-1">{errors.length}</p>}
              </div>
              
              <div className={errors.neck ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neck *</label>
                <div className="flex flex-col space-y-2">
                  <select
                    name="neck"
                    value={formData.neck || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.neck ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    {getDropdownOptions('neckTypes').map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Add new neck type"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newNeckOption || ''}
                      onChange={(e) => setNewNeckOption(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => {
                        if (newNeckOption && newNeckOption.trim() !== '') {
                          // Add to PRODUCT_CONFIG in memory
                          const updatedNecks = [...PRODUCT_CONFIG.NECK_TYPES, newNeckOption.trim()];
                          PRODUCT_CONFIG.NECK_TYPES = updatedNecks;
                          
                          // Clear the input
                          setNewNeckOption('');
                          
                          // Force re-render
                          setForceUpdate({});
                          
                          toast.success(`Added new neck type: ${newNeckOption.trim()}`);
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {errors.neck && <p className="text-xs text-red-600 mt-1">{errors.neck}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={errors.occasion ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occasion *</label>
                <div className="flex flex-col space-y-2">
                  <select
                    name="occasion"
                    value={formData.occasion || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.occasion ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    {getDropdownOptions('occasions').map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Add new occasion"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newOccasionOption || ''}
                      onChange={(e) => setNewOccasionOption(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => {
                        if (newOccasionOption && newOccasionOption.trim() !== '') {
                          // Add to PRODUCT_CONFIG in memory
                          const updatedOccasions = [...PRODUCT_CONFIG.OCCASIONS, newOccasionOption.trim()];
                          PRODUCT_CONFIG.OCCASIONS = updatedOccasions;
                          
                          // Clear the input
                          setNewOccasionOption('');
                          
                          // Force re-render
                          setForceUpdate({});
                          
                          toast.success(`Added new occasion: ${newOccasionOption.trim()}`);
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {errors.occasion && <p className="text-xs text-red-600 mt-1">{errors.occasion}</p>}
              </div>
              
              <div className={errors.pattern ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pattern *</label>
                <div className="flex flex-col space-y-2">
                  <select
                    name="pattern"
                    value={formData.pattern || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.pattern ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    {getDropdownOptions('patterns').map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Add new pattern"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newPatternOption || ''}
                      onChange={(e) => setNewPatternOption(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => {
                        if (newPatternOption && newPatternOption.trim() !== '') {
                          // Add to PRODUCT_CONFIG in memory
                          const updatedPatterns = [...PRODUCT_CONFIG.PATTERNS, newPatternOption.trim()];
                          PRODUCT_CONFIG.PATTERNS = updatedPatterns;
                          
                          // Clear the input
                          setNewPatternOption('');
                          
                          // Force re-render
                          setForceUpdate({});
                          
                          toast.success(`Added new pattern: ${newPatternOption.trim()}`);
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {errors.pattern && <p className="text-xs text-red-600 mt-1">{errors.pattern}</p>}
              </div>
              
              <div className={errors.printPatternType ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Print Type *</label>
                <div className="flex flex-col space-y-2">
                  <select
                    name="printPatternType"
                    value={formData.printPatternType || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.printPatternType ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    {getDropdownOptions('printTypes').map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Add new print type"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newPrintTypeOption || ''}
                      onChange={(e) => setNewPrintTypeOption(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => {
                        if (newPrintTypeOption && newPrintTypeOption.trim() !== '') {
                          // Add to PRODUCT_CONFIG in memory
                          const updatedPrintTypes = [...PRODUCT_CONFIG.PRINT_TYPES, newPrintTypeOption.trim()];
                          PRODUCT_CONFIG.PRINT_TYPES = updatedPrintTypes;
                          
                          // Clear the input
                          setNewPrintTypeOption('');
                          
                          // Force re-render
                          setForceUpdate({});
                          
                          toast.success(`Added new print type: ${newPrintTypeOption.trim()}`);
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {errors.printPatternType && <p className="text-xs text-red-600 mt-1">{errors.printPatternType}</p>}
              </div>
            </div>
          </div>
          
          {/* Additional Required Fields */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h5 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">⚙️</span>
              </span>
              Additional Details
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className={errors.sleeveLength ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sleeve Length *</label>
                <div className="flex flex-col space-y-2">
                  <select
                    name="sleeveLength"
                    value={formData.sleeveLength || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.sleeveLength ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    {getDropdownOptions('sleeveLengths').map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Add new sleeve length"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newSleeveLengthOption || ''}
                      onChange={(e) => setNewSleeveLengthOption(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => {
                        if (newSleeveLengthOption && newSleeveLengthOption.trim() !== '') {
                          // Add to PRODUCT_CONFIG in memory
                          const updatedSleeveLengths = [...PRODUCT_CONFIG.SLEEVE_LENGTHS, newSleeveLengthOption.trim()];
                          PRODUCT_CONFIG.SLEEVE_LENGTHS = updatedSleeveLengths;
                          
                          // Clear the input
                          setNewSleeveLengthOption('');
                          
                          // Force re-render
                          setForceUpdate({});
                          
                          toast.success(`Added new sleeve length: ${newSleeveLengthOption.trim()}`);
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {errors.sleeveLength && <p className="text-xs text-red-600 mt-1">{errors.sleeveLength}</p>}
              </div>
              
              <div className={errors.stitchType ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stitch Type *</label>
                <div className="flex flex-col space-y-2">
                  <select
                    name="stitchType"
                    value={formData.stitchType || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.stitchType ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    {getDropdownOptions('stitchTypes').map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Add new stitch type"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStitchTypeOption || ''}
                      onChange={(e) => setNewStitchTypeOption(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => {
                        if (newStitchTypeOption && newStitchTypeOption.trim() !== '') {
                          // Add to PRODUCT_CONFIG in memory
                          const updatedStitchTypes = [...PRODUCT_CONFIG.STITCHING_TYPES, newStitchTypeOption.trim()];
                          PRODUCT_CONFIG.STITCHING_TYPES = updatedStitchTypes;
                          
                          // Clear the input
                          setNewStitchTypeOption('');
                          
                          // Force re-render
                          setForceUpdate({});
                          
                          toast.success(`Added new stitch type: ${newStitchTypeOption.trim()}`);
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {errors.stitchType && <p className="text-xs text-red-600 mt-1">{errors.stitchType}</p>}
              </div>
              
              <div className={errors.countryOfOrigin ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin *</label>
                <select
                  name="countryOfOrigin"
                  value={formData.countryOfOrigin || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.countryOfOrigin ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select</option>
                  {getDropdownOptions('countries').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.countryOfOrigin && <p className="text-xs text-red-600 mt-1">{errors.countryOfOrigin}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={errors.manufacturerDetails ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer Info *</label>
                <textarea
                  name="manufacturerDetails"
                  value={formData.manufacturerDetails || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter Manufacturer Information"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.manufacturerDetails ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                ></textarea>
                {errors.manufacturerDetails && <p className="text-xs text-red-600 mt-1">{errors.manufacturerDetails}</p>}
              </div>
              
              <div className={errors.packerDetails ? 'error-field' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Packer Info *</label>
                <div className="mb-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sameAsManufacturer || false}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          sameAsManufacturer: isChecked,
                          packerDetails: isChecked ? prev.manufacturerDetails : ''
                        }));
                      }}
                      className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">Same as Manufacturer Info</span>
                  </label>
                </div>
                <textarea
                  name="packerDetails"
                  value={formData.packerDetails || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter Packer Information"
                  disabled={formData.sameAsManufacturer}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.packerDetails ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${formData.sameAsManufacturer ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                ></textarea>
                {errors.packerDetails && <p className="text-xs text-red-600 mt-1">{errors.packerDetails}</p>}
              </div>
            </div>
          </div>
          
          {/* Other Attributes Section */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <h5 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">🏷️</span>
              </span>
              Other Attributes
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  name="brand"
                  value={formData.brand || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select</option>
                  {getDropdownOptions('brands').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ornamentation</label>
                <select
                  name="ornamentation"
                  value={formData.ornamentation || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select</option>
                  {getDropdownOptions('ornamentations').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              

              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sleeve Styling</label>
                <select
                  name="sleeveStyling"
                  value={formData.sleeveStyling || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select</option>
                  {getDropdownOptions('sleeveStylings').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stitch Type</label>
                <select
                  name="stitchType"
                  value={formData.stitchType || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select</option>
                  {getDropdownOptions('stitchTypes').map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Importer Details</label>
                <textarea
                  name="importerDetails"
                  value={formData.importerDetails || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter Importer Details (if applicable)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer Info</label>
                <textarea
                  name="manufacturerDetails"
                  value={formData.manufacturerDetails || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter Manufacturer Information"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Packer Info</label>
              <textarea
                name="packerDetails"
                value={formData.packerDetails || ''}
                onChange={handleInputChange}
                rows="3"
                placeholder="Enter Packer Information"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              ></textarea>
            </div>
          </div>
          
          <div className={`mb-6 ${errors.description ? 'error-field' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Enter Description"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            ></textarea>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">Provide a detailed description of your product</p>
              <span className="text-xs text-gray-400">{formData.description?.length || 0}/6000</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
            <select
              name="gstRate"
              value={formData.gstRate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            >
              <option value="">Select GST Rate</option>
              {getDropdownOptions('gstRates').map(option => (
                <option key={option} value={option}>{option}%</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Select the applicable GST rate for this product</p>
          </div>
        </div>
      )}
      
      {/* Step 2: Size Selection & Variants */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800">📏 Size Selection & Variants</h4>
              <p className="text-sm text-gray-600">Configure sizes, pricing, and measurements for your product</p>
            </div>
          </div>
          
          {/* Enhanced Size Selection Section */}
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-base font-semibold text-blue-800">👕 Size *</h5>
                  <p className="text-xs text-blue-600">Select all sizes available for this product</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                  {formData.selectedSizes?.length || 0} sizes selected
                </span>
                {formData.selectedSizes?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, selectedSizes: [] }))}
                    className="text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-full transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            
            {errors.selectedSizes && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-600">{errors.selectedSizes}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-4">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'].map(size => (
                <label key={size} className={`relative flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  formData.selectedSizes?.includes(size) 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.selectedSizes?.includes(size) || false}
                    onChange={(e) => {
                      const selectedSizes = formData.selectedSizes || [];
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          selectedSizes: [...selectedSizes, size]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          selectedSizes: selectedSizes.filter(s => s !== size)
                        }));
                      }
                    }}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center">
                    <span className={`text-sm font-bold transition-colors ${
                      formData.selectedSizes?.includes(size) 
                        ? 'text-blue-700' 
                        : 'text-gray-700'
                    }`}>{size}</span>
                    {formData.selectedSizes?.includes(size) && (
                      <svg className="w-4 h-4 text-blue-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </label>
              ))}
            </div>
            
            <p className="text-xs text-blue-600">Select the sizes available for this product</p>
          </div>
          
          {/* Enhanced Size-wise Variants Table */}
          {formData.selectedSizes && formData.selectedSizes.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-base font-semibold text-gray-800">📊 Size-wise Product Details</h5>
                    <p className="text-sm text-gray-600 mt-1">Configure pricing, inventory and measurements for each selected size</p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Size</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Selling Price *</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Return Price</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">MRP *</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Inventory *</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Product SKU (optional)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Bust * (inches)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">Shoulder * (inches)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Waist * (inches)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">Length * (inches)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Hip (inches)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">HSN Code</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Weight (g)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Dimensions (LxWxH cm)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.selectedSizes.map((size, index) => {
                      // Generate a unique SKU for this size if needed
                      const timestamp = Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
                      // Ensure we have a valid title to use for SKU generation
                      const title = formData.title || 'PROD';
                      const generatedSku = `${title.slice(0, 3).toUpperCase()}-${size}-${timestamp}`;
                      
                      const variant = formData.variants.find(v => v.attributes && v.attributes.size === size) || 
                                    { 
                                      sku: generatedSku, // Always use a generated SKU, never empty
                                      price: 0, 
                                      stock: 0, 
                                      meeshoPrice: 0.01,
                                      wrongDefectivePrice: 0,
                                      mrp: 0.01,
                                      bustSize: 0.01,
                                      shoulderSize: 0.01,
                                      waistSize: 0.01,
                                      sizeLength: 0.01,
                                      hipSize: 0,
                                      hsn: '6204',
                                      weight: 0.3,
                                      dimensions: {length: 30, breadth: 25, height: 2},
                                      attributes: { size },
                                      images: [],
                                      imageFiles: []
                                    };
                      const variantIndex = formData.variants.findIndex(v => v.attributes && v.attributes.size === size);
                      
                      const updateVariant = (field, value) => {
                        const newVariants = [...formData.variants];
                        if (variantIndex >= 0) {
                          // Ensure attributes object exists and has size property
                          const currentVariant = newVariants[variantIndex];
                          // Make sure attributes is always an object
                          if (!currentVariant.attributes || typeof currentVariant.attributes !== 'object') {
                            currentVariant.attributes = {};
                          }
                          // Make sure size property exists
                          if (!currentVariant.attributes.size) {
                            currentVariant.attributes.size = size;
                          }
                          
                          // Generate a unique SKU if it's empty and we're not currently editing the SKU field
                          if (field !== 'sku' && (!currentVariant.sku || currentVariant.sku === '')) {
                            // Generate a unique SKU based on product title and size
                            const timestamp = Date.now().toString().slice(-6);
                            currentVariant.sku = `${formData.title.slice(0, 3).toUpperCase()}-${size}-${timestamp}`;
                          }
                          
                          // Convert empty string values to appropriate types for number fields
                          let processedValue = value;
                          if (field === 'meeshoPrice' || field === 'mrp' || field === 'stock' || 
                              field === 'bustSize' || field === 'shoulderSize' || field === 'waistSize' || 
                              field === 'sizeLength' || field === 'hipSize' || field === 'netWeight') {
                            // If value is empty string and field is required, set to 0
                            if (value === '') {
                              processedValue = field === 'netWeight' ? 0.1 : 0;
                            } else if (typeof value === 'string') {
                              // Convert string to number
                              processedValue = parseFloat(value) || (field === 'netWeight' ? 0.1 : 0);
                            }
                          }
                          
                          newVariants[variantIndex] = { 
                            ...currentVariant, 
                            [field]: processedValue
                          };
                        } else {
                          // Convert empty string values to appropriate types for number fields
                          let processedValue = value;
                          if (field === 'meeshoPrice' || field === 'mrp' || field === 'stock' || 
                              field === 'bustSize' || field === 'shoulderSize' || field === 'waistSize' || 
                              field === 'sizeLength' || field === 'hipSize' || field === 'netWeight') {
                            // If value is empty string and field is required, set to 0
                            if (value === '') {
                              processedValue = field === 'netWeight' ? 0.1 : 0;
                            } else if (typeof value === 'string') {
                              // Convert string to number
                              processedValue = parseFloat(value) || (field === 'netWeight' ? 0.1 : 0);
                            }
                          }
                          
                          // Generate a unique SKU for the new variant
                          const timestamp = Date.now().toString().slice(-6);
                          // Ensure we have a valid title to use for SKU generation
                          const title = formData.title || 'PROD';
                          const generatedSku = `${title.slice(0, 3).toUpperCase()}-${size}-${timestamp}`;
                          
                          const newVariant = { 
                            sku: generatedSku, // Always use a generated SKU for new variants
                            price: 0, 
                            stock: 0, 
                            meeshoPrice: 0.01,
                            wrongDefectivePrice: 0,
                            mrp: 0.01,
                            bustSize: 0.01,
                            shoulderSize: 0.01,
                            waistSize: 0.01,
                            sizeLength: 0.01,
                            hipSize: 0,
                            hsn: '6204',
                            weight: 0.3,
                            netWeight: 0.1,
                            dimensions: {length: 30, breadth: 25, height: 2},
                            attributes: { size },
                            images: [],
                            imageFiles: [],
                            [field]: processedValue
                          };
                          newVariants.push(newVariant);
                        }
                        setFormData(prev => ({ ...prev, variants: newVariants }));
                      };
                      
                      return (
                        <tr key={size} className="hover:bg-gray-50">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {size}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-xs">₹</span>
                              </div>
                              <input
                                type="number"
                                value={variant.meeshoPrice || ''}
                                onChange={(e) => updateVariant('meeshoPrice', e.target.value)}
                                placeholder="0.00"
                                className="w-full border border-gray-300 rounded-md pl-6 pr-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-xs">₹</span>
                              </div>
                              <input
                                type="number"
                                value={variant.wrongDefectivePrice || ''}
                                onChange={(e) => updateVariant('wrongDefectivePrice', e.target.value)}
                                placeholder="0.00"
                                className="w-full border border-gray-300 rounded-md pl-6 pr-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-xs">₹</span>
                              </div>
                              <input
                                type="number"
                                value={variant.mrp || ''}
                                onChange={(e) => updateVariant('mrp', e.target.value)}
                                placeholder="0.00"
                                className="w-full border border-gray-300 rounded-md pl-6 pr-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={variant.stock || ''}
                              onChange={(e) => updateVariant('stock', e.target.value)}
                              placeholder="Qty"
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="text"
                              value={variant.sku || ''}
                              onChange={(e) => updateVariant('sku', e.target.value)}
                              placeholder={`${size}-SKU`}
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={variant.bustSize || ''}
                              onChange={(e) => updateVariant('bustSize', e.target.value)}
                              placeholder="0.0"
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={variant.shoulderSize || ''}
                              onChange={(e) => updateVariant('shoulderSize', e.target.value)}
                              placeholder="0.0"
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={variant.waistSize || ''}
                              onChange={(e) => updateVariant('waistSize', e.target.value)}
                              placeholder="0.0"
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={variant.sizeLength || ''}
                              onChange={(e) => updateVariant('sizeLength', e.target.value)}
                              placeholder="0.0"
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={variant.hipSize || ''}
                              onChange={(e) => updateVariant('hipSize', e.target.value)}
                              placeholder="0.0"
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="text"
                              value={variant.hsn || ''}
                              onChange={(e) => updateVariant('hsn', e.target.value)}
                              placeholder="6204"
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              value={variant.weight || ''}
                              onChange={(e) => updateVariant('weight', e.target.value)}
                              placeholder="0.3"
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                            />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex space-x-1">
                              <input
                                type="number"
                                value={variant.dimensions?.length || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateVariant('dimensions', {
                                    ...variant.dimensions,
                                    length: value ? parseFloat(value) : 30
                                  });
                                }}
                                placeholder="30"
                                className="w-8 border border-gray-300 rounded-md px-1 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="1"
                              />
                              <span className="text-xs text-gray-500">x</span>
                              <input
                                type="number"
                                value={variant.dimensions?.breadth || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateVariant('dimensions', {
                                    ...variant.dimensions,
                                    breadth: value ? parseFloat(value) : 25
                                  });
                                }}
                                placeholder="25"
                                className="w-8 border border-gray-300 rounded-md px-1 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="1"
                              />
                              <span className="text-xs text-gray-500">x</span>
                              <input
                                type="number"
                                value={variant.dimensions?.height || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateVariant('dimensions', {
                                    ...variant.dimensions,
                                    height: value ? parseFloat(value) : 2
                                  });
                                }}
                                placeholder="2"
                                className="w-8 border border-gray-300 rounded-md px-1 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="1"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                const newSizes = formData.selectedSizes.filter(s => s !== size);
                                const newVariants = formData.variants.filter(v => v.attributes?.size !== size);
                                setFormData(prev => ({ 
                                  ...prev, 
                                  selectedSizes: newSizes,
                                  variants: newVariants 
                                }));
                              }}
                              className="text-red-600 hover:text-red-800 text-sm p-1 hover:bg-red-50 rounded"
                              title="Remove this size"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* No sizes selected message */}
          {(!formData.selectedSizes || formData.selectedSizes.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">Please select at least one size to configure product variants</p>
            </div>
          )}
          
          {/* Variant Error Message */}
          {errors.variants && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errors.variants}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Step 3: Images Section */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">🖼️ Product Images</h4>
                <p className="text-sm text-gray-600">Upload high-quality images to showcase your product</p>
              </div>
            </div>
            
            {/* Enhanced Image Preview Mode Selector */}
            <div className="flex bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setImagePreviewMode('general')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  imagePreviewMode === 'general'
                    ? 'bg-white text-orange-700 shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>General Images</span>
              </button>
              <button
                type="button"
                onClick={() => setImagePreviewMode('variant')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  imagePreviewMode === 'variant'
                    ? 'bg-white text-orange-700 shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Variant Images</span>
              </button>
            </div>
          </div>
          
          {/* General Images View */}
          {imagePreviewMode === 'general' && (
            <>
              {/* Enhanced Current General Images */}
              {formData.images && formData.images.length > 0 ? (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h5 className="text-base font-semibold text-gray-800">📸 General Product Images</h5>
                    </div>
                    <span className="text-sm bg-white text-orange-700 px-3 py-1 rounded-full font-medium shadow-sm">
                      {formData.images.length} image{formData.images.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-gray-50">
                          <img 
                            src={image} 
                            alt={`Product ${index + 1}`} 
                            className="h-full w-full object-cover" 
                            onError={(e) => handleImageError(e, image)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleImageRemove(image)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded-b-lg">
                          Image #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-10 border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h6 className="text-gray-700 text-base font-semibold mb-2">📷 No General Images Yet</h6>
                  <p className="text-gray-500 text-sm mb-1">Upload beautiful product images to showcase your item</p>
                  <p className="text-gray-400 text-xs">Use the upload section below to add images</p>
                </div>
              )}
            </>
          )}
          
          {/* Enhanced Variant Images View */}
          {imagePreviewMode === 'variant' && (
            <div className="mb-6">
              {/* Enhanced Variant Selector */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <label className="text-base font-semibold text-gray-800">🎯 Select Variant to View Images</label>
                </div>
                <select
                  value={selectedVariantForImage}
                  onChange={(e) => setSelectedVariantForImage(parseInt(e.target.value))}
                  className="block w-full border border-blue-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {formData.variants.map((variant, index) => (
                    <option key={index} value={index}>
                      Variant {index + 1} {variant.sku ? `(${variant.sku})` : ''}
                      {Object.keys(variant.attributes).length > 0 && 
                        ` - ${Object.entries(variant.attributes)
                          .filter(([key, value]) => value)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}`
                      }
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Enhanced Selected Variant Images */}
              {formData.variants[selectedVariantForImage] && (
                <div>
                  <div className="flex items-center mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h5 className="text-base font-semibold text-gray-800">
                      🖼️ Images for Variant {selectedVariantForImage + 1}
                    </h5>
                  </div>
                  
                  {/* Current Variant Images */}
                  {formData.variants[selectedVariantForImage].images && 
                   formData.variants[selectedVariantForImage].images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                      {formData.variants[selectedVariantForImage].images.map((image, imgIndex) => (
                        <div key={imgIndex} className="relative group">
                          <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-gray-50">
                            <img 
                              src={image} 
                              alt={`Variant ${selectedVariantForImage + 1} Image ${imgIndex + 1}`} 
                              className="h-full w-full object-cover" 
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleImageFileRemove(imgIndex, 'variant', selectedVariantForImage)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded-b-lg">
                            Image #{imgIndex + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-purple-300 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h6 className="text-gray-700 text-base font-semibold mb-2">🎨 No Variant Images Yet</h6>
                      <p className="text-gray-500 text-sm mb-1">No images uploaded for this variant</p>
                      <p className="text-gray-400 text-xs">Upload variant-specific images using the section below</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Enhanced Upload New Images - Drag & Drop */}
          {imagePreviewMode === 'general' && (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h5 className="text-base font-semibold text-gray-800">📤 Upload General Product Images</h5>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-white text-blue-700 px-3 py-1 rounded-full font-medium shadow-sm">
                    {formData.images?.length || 0} existing
                  </span>
                  <span className="text-sm bg-white text-teal-700 px-3 py-1 rounded-full font-medium shadow-sm">
                    {formData.imageFiles?.length || 0} new
                  </span>
                </div>
              </div>
              
              <div 
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 bg-white transition-all duration-300 ${errors.images ? 'border-red-300 bg-red-50' : 'border-teal-400 hover:bg-teal-50 hover:border-teal-500 hover:shadow-lg'}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('bg-teal-100', 'border-teal-600', 'scale-105');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('bg-teal-100', 'border-teal-600', 'scale-105');
                }}
                onDrop={(e) => handleImageDrop(e, 'general')}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h6 className="text-base font-semibold text-gray-800 mb-2">🖱️ Drag & Drop Images Here</h6>
                <p className="text-sm text-gray-600 mb-1">Or click to browse and select multiple files</p>
                <p className="text-xs text-gray-500 mb-6">Supports: JPG, PNG, GIF, WebP (Max 5MB each)</p>
                
                {errors.images && (
                  <div className="flex items-center justify-center mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600 font-medium">{errors.images}</p>
                  </div>
                )}
                
                <label className="relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white text-base font-semibold rounded-xl shadow-lg hover:from-teal-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-teal-300 cursor-pointer transition-all duration-200 transform hover:scale-105">
                  <svg className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                  </svg>
                  📁 Browse & Select Files
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handleImageFilesChange(e, 'general')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
          
          {/* Video Upload Section */}
          {imagePreviewMode === 'general' && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200 shadow-sm mt-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h5 className="text-base font-semibold text-gray-800">🎬 Upload Product Video</h5>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm bg-white text-purple-700 px-3 py-1 rounded-full font-medium shadow-sm">
                    {formData.videoFile ? '1 video selected' : 'No video'}
                  </span>
                </div>
              </div>
              
              {/* Video Preview */}
              {formData.videoPreviewUrl && (
                <div className="mb-4 relative">
                  <div className="aspect-video overflow-hidden rounded-lg border border-purple-200 shadow-sm bg-black">
                    <video 
                      src={formData.videoPreviewUrl} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVideoRemove}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                    title="Remove video"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* Video Upload Area */}
              {!formData.videoFile && (
                <div 
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 bg-white transition-all duration-300 ${errors.videoFile ? 'border-red-300 bg-red-50' : 'border-purple-400 hover:bg-purple-50 hover:border-purple-500 hover:shadow-lg'}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.add('bg-purple-100', 'border-purple-600', 'scale-105');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('bg-purple-100', 'border-purple-600', 'scale-105');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('bg-purple-100', 'border-purple-600', 'scale-105');
                    
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      const file = files[0]; // Only take the first file
                      handleVideoFileChange({ target: { files: [file] } });
                    }
                  }}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h6 className="text-base font-semibold text-gray-800 mb-2">🖱️ Drag & Drop Video Here</h6>
                  <p className="text-sm text-gray-600 mb-1">Or click to browse and select a video file</p>
                  <p className="text-xs text-gray-500 mb-6">Supports: MP4, WEBM, OGG, MOV, AVI (Max 50MB)</p>
                  
                  {errors.videoFile && (
                    <div className="flex items-center justify-center mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-600 font-medium">{errors.videoFile}</p>
                    </div>
                  )}
                  
                  <label className="relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-base font-semibold rounded-xl shadow-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-purple-300 cursor-pointer transition-all duration-200 transform hover:scale-105">
                    <svg className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    📹 Browse & Select Video
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                      onChange={handleVideoFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              )}
            </div>
          )}
          
          {/* Variant Image Upload */}
          {imagePreviewMode === 'variant' && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-sm font-medium text-gray-700">
                  Upload Images for Variant {selectedVariantForImage + 1}
                </h5>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {formData.variants[selectedVariantForImage]?.images?.length || 0} existing
                  </span>
                  <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                    {formData.variants[selectedVariantForImage]?.imageFiles?.length || 0} new
                  </span>
                </div>
              </div>
              
              <div 
                className="relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 bg-white transition-colors border-teal-300 hover:bg-teal-50"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('bg-teal-50', 'border-teal-500');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('bg-teal-50', 'border-teal-500');
                }}
                onDrop={(e) => handleImageDrop(e, 'variant', selectedVariantForImage)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-teal-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-gray-700 mb-1">Drag and drop variant images here</p>
                <p className="text-xs text-gray-500 mb-4">Supports: JPG, PNG, GIF, WebP (Max 5MB each)</p>
                
                <label className="relative inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 cursor-pointer transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                  </svg>
                  Browse Files
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handleImageFilesChange(e, 'variant', selectedVariantForImage)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
                
                <p className="text-xs text-gray-500 mt-3">Or click the button to select multiple files</p>
              </div>
            </div>
          )}
            
            {/* Preview of Selected General Images */}
            {imagePreviewMode === 'general' && formData.imageFiles && formData.imageFiles.length > 0 && (
              <div className="mt-6 bg-white p-4 rounded-lg border border-teal-200">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-teal-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    New General Images to Upload
                  </h5>
                  <div className="flex items-center">
                    <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                      {formData.imageFiles.length} file{formData.imageFiles.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Array.from(formData.imageFiles).map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-gray-50">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Upload Preview ${index + 1}`} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImageFileRemove(index, 'general')}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded-b-lg flex justify-between">
                        <span>#{index + 1}</span>
                        <span className="truncate max-w-[80px]" title={file.name}>{file.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Preview of Selected Variant Images */}
            {imagePreviewMode === 'variant' && 
             formData.variants[selectedVariantForImage] && 
             formData.variants[selectedVariantForImage].imageFiles && 
             formData.variants[selectedVariantForImage].imageFiles.length > 0 && (
              <div className="mt-6 bg-white p-4 rounded-lg border border-teal-200">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-teal-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    New Variant Images to Upload
                  </h5>
                  <div className="flex items-center">
                    <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                      {formData.variants[selectedVariantForImage].imageFiles.length} file{formData.variants[selectedVariantForImage].imageFiles.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Array.from(formData.variants[selectedVariantForImage].imageFiles).map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-gray-50">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Variant ${selectedVariantForImage + 1} Upload Preview ${index + 1}`} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImageFileRemove(index, 'variant', selectedVariantForImage)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded-b-lg flex justify-between">
                        <span>#{index + 1}</span>
                        <span className="truncate max-w-[80px]" title={file.name}>{file.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
      
      {/* Form Actions */}
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
          {/* Left side - Previous button (hidden on first step) */}
          <div className="flex-1 flex justify-start">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Use setTimeout to ensure state updates properly
                  setTimeout(() => {
                    setCurrentStep(prev => Math.max(prev - 1, 1));
                  }, 10);
                }}
                className="w-full sm:w-auto px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </div>
              </Button>
            )}
          </div>
          
          {/* Center - Cancel button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setShowAddModal(false);
                setShowEditModal(false);
              }}
              disabled={createProductMutation.isLoading || updateProductMutation.isLoading}
              className="w-full sm:w-auto px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </Button>
          </div>
          
          {/* Right side - Next/Submit button */}
          <div className="flex-1 flex justify-end">
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={() => {
                  // Explicitly validate current step before proceeding
                  if (validateStep(currentStep)) {
                    // Use setTimeout to ensure state updates properly
                    setTimeout(() => {
                      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
                    }, 10);
                  } else {
                    // Scroll to the first error
                    const firstErrorField = document.querySelector('.error-field');
                    if (firstErrorField) {
                      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }}
                disabled={!isCurrentStepValid}
                className={`w-full sm:w-auto px-6 py-2 transition-colors shadow-sm ${!isCurrentStepValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
              >
                <div className="flex items-center">
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={createProductMutation.isLoading || updateProductMutation.isLoading}
                className="relative w-full sm:w-auto px-6 py-2 bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
              >
                {createProductMutation.isLoading || updateProductMutation.isLoading ? (
                  <>
                    <span className="opacity-0">{currentProduct ? 'Update Product' : 'Add Product'}</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="ml-2">Saving...</span>
                    </span>
                  </>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {currentProduct ? 'Update Product' : 'Add Product'}
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          {currentStep < totalSteps ? 
            `Complete step ${currentStep} of ${totalSteps} to continue.` : 
            (currentProduct ? 
              'Review all information and click "Update Product" to save changes.' : 
              'Review all information and click "Add Product" to create a new product.')}
        </div>
      </div>
    </form>
    )}
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Products Management</h3>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center gap-2"
          >
            <FiUpload className="h-4 w-4" />
            Bulk Upload Products
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowBulkImageUploadModal(true)}
            className="flex items-center gap-2"
          >
            <FiUpload className="h-4 w-4" />
            Bulk Upload Images
          </Button>
          <Button onClick={() => {
            setCurrentStep(1); // Always start at step 1
            setShowAddModal(true);
          }}>Add New Product</Button>
        </div>
      </div>
      
      {/* Product Summary Cards */}
      {!productsLoading && !productsError && productsData?.data?.products && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Total Products</h4>
            <p className="text-2xl font-bold text-blue-900">{productsData.data.products.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-green-800 mb-2">Categories</h4>
            <p className="text-2xl font-bold text-green-900">
              {flatCategories ? flatCategories.length : 0}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-purple-800 mb-2">Total Variants</h4>
            <p className="text-2xl font-bold text-purple-900">
              {productsData.data.products.reduce((total, product) => {
                return total + (product.variants?.length || 0);
              }, 0)}
            </p>
          </div>
        </div>
      )}
      
      {/* Search and Filter */}
      {!productsLoading && !productsError && productsData?.data?.products && (
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
              <input
                type="text"
                id="search"
                placeholder="Search by title, description or SKU"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:w-1/3">
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
              <select
                id="category-filter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {flatCategories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.level > 0 ? `↳ ${category.name} (${category.parentName})` : category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Filter status and clear button */}
          {(searchTerm || categoryFilter) && (
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-600">
                Showing {getFilteredProducts().length} of {productsData.data.products.length} products
              </div>
              <button
                className="text-sm text-teal-600 hover:text-teal-800"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
      
      {renderProductList()}
      
      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          // First reset the step, then close the modal to prevent UI flicker
          setCurrentStep(1); // Reset to first step when closing
          resetForm();
          setTimeout(() => {
            setShowAddModal(false);
          }, 50); // Small delay to ensure state updates before modal closes
        }}
        title={`${currentProduct ? 'Edit' : 'Add New'} Product - ${stepTitles[currentStep - 1]}`}
        size="xxl"
      >
        {renderProductForm()}
      </Modal>
      
      {/* Edit Product Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          // First reset the step, then close the modal to prevent UI flicker
          setCurrentStep(1); // Reset to first step when closing
          resetForm();
          setCurrentProduct(null);
          setTimeout(() => {
            setShowEditModal(false);
          }, 50); // Small delay to ensure state updates before modal closes
        }}
        title={`Edit Product - ${stepTitles[currentStep - 1]}`}
        size="xxl"
      >
        {renderProductForm()}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCurrentProduct(null);
        }}
        title="Confirm Delete"
        size="md"
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-6 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-center mb-2">Delete Product</h3>
          <p className="text-center text-gray-600 mb-6">
            Are you sure you want to delete the product <span className="font-semibold text-gray-800">"{currentProduct?.title}"</span>?
            <br />
            <span className="text-sm text-red-500">This action cannot be undone.</span>
          </p>
          
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const loadingToastId = toast.loading('Deleting product...');
                deleteProductMutation.mutate(currentProduct._id, {
                  onSuccess: () => {
                    toast.dismiss(loadingToastId);
                    toast.success('Product deleted successfully');
                    setShowDeleteModal(false);
                  },
                  onError: (error) => {
                    toast.dismiss(loadingToastId);
                    toast.error(error.response?.data?.message || 'Failed to delete product');
                  }
                });
              }}
              disabled={deleteProductMutation.isLoading}
              className="px-6"
            >
              <div className="flex items-center">
                {deleteProductMutation.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </>
                )}
              </div>
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Product Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setCurrentProduct(null);
        }}
        title={currentProduct?.title || 'Product Details'}
        size="xl"
      >
        {currentProduct && (
          <div className="p-6">
            {/* Product Header with Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-800">{currentProduct.title}</h3>
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentProduct.category?.name || 
                   flatCategories.find(cat => cat._id === currentProduct.category)?.name || 
                   'Uncategorized'}
                </span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                GST: {currentProduct.gstRate || 18}%
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Video (if available) */}
              {currentProduct.video && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Product Video
                  </h4>
                  <div className="relative overflow-hidden rounded-lg shadow-sm border border-gray-200">
                    <video 
                      src={currentProduct.video} 
                      controls 
                      loop
                      autoPlay
                      muted
                      className="w-full h-auto" 
                      controlsList="nodownload"
                    />
                  </div>
                </div>
              )}
              
              {/* Product Images */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Product Images
                </h4>
                {currentProduct.images && currentProduct.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {currentProduct.images.map((image, index) => (
                      <div key={index} className="relative group overflow-hidden rounded-lg shadow-sm border border-gray-200">
                        <img 
                          src={image} 
                          alt={`Product ${index}`} 
                          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" 
                          onError={(e) => handleImageError(e, image)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 w-full rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm">No images available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Product Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Product Details
                </h4>
                
                <div className="mb-4 bg-white p-3 rounded-md shadow-sm">
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Description</h5>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{currentProduct.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">Category</h5>
                    <p className="text-sm text-gray-700">
                      {currentProduct.category?.name || 
                       flatCategories.find(cat => cat._id === currentProduct.category)?.name || 
                       'Uncategorized'}
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">GST Rate</h5>
                    <p className="text-sm text-gray-700">{currentProduct.gstRate || 18}%</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Variants */}
            <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Product Variants ({currentProduct.variants?.length || 0})
              </h4>
              
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attributes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentProduct.variants?.map((variant, index) => (
                        <tr key={variant.sku || index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{variant.sku}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">{formatCurrency(variant.mrp)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${variant.stock > 10 ? 'bg-green-100 text-green-800' : variant.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(variant.attributes || {}).map(([key, value]) => (
                                value && (
                                  <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    <span className="text-blue-500 mr-1">{key}:</span> {value}
                                  </span>
                                )
                              ))}
                              {Object.keys(variant.attributes || {}).length === 0 && (
                                <span className="text-xs text-gray-400 italic">No attributes</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      
                      {(!currentProduct.variants || currentProduct.variants.length === 0) && (
                        <tr>
                          <td colSpan="4" className="px-4 py-6 text-center text-sm text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p>No variants available for this product</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-8">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
                className="mr-3"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(currentProduct);
                }}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Product
                </div>
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Bulk Upload Modal */}
      <Modal
        isOpen={showBulkUploadModal}
        onClose={() => {
          if (uploadStatus !== 'loading') {
            setShowBulkUploadModal(false);
            resetBulkUpload();
          }
        }}
        title="Bulk Upload Products"
        size="lg"
      >
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV or JSON file containing product data. Download the sample template below for reference.
            </p>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Multiple Variants Support</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>You can now upload products with multiple variants:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>For CSV: Use the same title, description, and category for all variants of the same product, but with unique SKUs.</li>
                      <li>For JSON: Group variants under a single product object in an array format.</li>
                      <li>Each SKU must be unique across all products.</li>
                      <li><strong>Important:</strong> Use category name directly (e.g., "मेन्स वियर") instead of category ID.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateSampleCSV}
                className="flex items-center gap-2 text-sm"
              >
                <FiDownload className="h-4 w-4" />
                Download Sample CSV
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateSampleJSON}
                className="flex items-center gap-2 text-sm"
              >
                <FiDownload className="h-4 w-4" />
                Download Sample JSON
              </Button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {bulkUploadFile ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-medium mr-2">{bulkUploadFile.name}</span>
                    <span className="text-xs text-gray-500">({Math.round(bulkUploadFile.size / 1024)} KB)</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setBulkUploadFile(null)}
                    className="text-xs"
                    disabled={uploadStatus === 'loading'}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <FiUpload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Drag & drop your file here or</p>
                  <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    Browse Files
                    <input 
                      type="file" 
                      accept=".csv,.json" 
                      className="hidden" 
                      onChange={handleBulkFileChange}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Supported formats: CSV, JSON (Max 10MB)</p>
                </div>
              )}
            </div>
          </div>
          
          {uploadStatus === 'loading' && (
            <div className="mb-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-center mt-1 text-gray-600">{uploadProgress}% Uploaded</p>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              <p>An error occurred during upload. Please try again.</p>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              <p>Products uploaded successfully!</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkUploadModal(false);
                resetBulkUpload();
              }}
              disabled={uploadStatus === 'loading'}
            >
              {uploadStatus === 'success' ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={!bulkUploadFile || uploadStatus === 'loading' || uploadStatus === 'success'}
            >
              {uploadStatus === 'loading' ? 'Uploading...' : 'Upload Products'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Bulk Image Upload Modal */}
      <Modal
        isOpen={showBulkImageUploadModal}
        onClose={() => {
          if (imageUploadStatus !== 'loading') {
            setShowBulkImageUploadModal(false);
            resetBulkImageUpload();
          }
        }}
        title="Bulk Upload Images"
        size="lg"
      >
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Upload multiple images at once. The images will be stored on the server and you'll receive a CSV file with all image URLs.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.add('bg-teal-50', 'border-teal-500');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('bg-teal-50', 'border-teal-500');
              }}
              onDrop={handleBulkImageDrop}
            >
              {bulkImageFiles.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-medium mr-2">{bulkImageFiles.length} image{bulkImageFiles.length !== 1 ? 's' : ''} selected</span>
                    <span className="text-xs text-gray-500">({Math.round(bulkImageFiles.reduce((total, file) => total + file.size, 0) / 1024)} KB total)</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setBulkImageFiles([])}
                    className="text-xs"
                    disabled={imageUploadStatus === 'loading'}
                  >
                    Clear Selection
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <FiUpload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Drag & drop your images here or</p>
                  <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    Browse Files
                    <input 
                      type="file" 
                      multiple
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden" 
                      onChange={handleBulkImageFilesChange}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Supported formats: JPEG, PNG, GIF, WebP (Max 5MB per image)</p>
                </div>
              )}
            </div>
            
            {/* Preview of Selected Images */}
            {bulkImageFiles.length > 0 && (
              <div className="mt-6 bg-white p-4 rounded-lg border border-teal-200">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-teal-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Images to Upload
                  </h5>
                  <div className="flex items-center">
                    <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                      {bulkImageFiles.length} file{bulkImageFiles.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {bulkImageFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-gray-50">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Upload Preview ${index + 1}`} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBulkImageFileRemove(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded-b-lg flex justify-between">
                        <span>#{index + 1}</span>
                        <span className="truncate max-w-[80px]" title={file.name}>{file.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {imageUploadStatus === 'loading' && (
            <div className="mb-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                  style={{ width: `${imageUploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-center mt-1 text-gray-600">{imageUploadProgress}% Uploaded</p>
            </div>
          )}
          
          {imageUploadStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              <p>An error occurred during upload. Please try again.</p>
            </div>
          )}
          
          {imageUploadStatus === 'success' && (
            <div className="mb-4">
              <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm mb-4">
                <p>Images uploaded successfully! {uploadedImageUrls.length} image{uploadedImageUrls.length !== 1 ? 's' : ''} uploaded.</p>
              </div>
              
              {csvDownloadUrl && (
                <div className="flex justify-center">
                  <Button
                    onClick={downloadImageUrlsCsv}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="h-4 w-4" />
                    Download CSV with Image URLs
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkImageUploadModal(false);
                resetBulkImageUpload();
              }}
              disabled={imageUploadStatus === 'loading'}
            >
              {imageUploadStatus === 'success' ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleBulkImageUpload}
              disabled={bulkImageFiles.length === 0 || imageUploadStatus === 'loading' || imageUploadStatus === 'success'}
            >
              {imageUploadStatus === 'loading' ? 'Uploading...' : 'Upload Images'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagement;