import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/api';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import Input from '../Common/Input';
import { toast } from 'react-hot-toast';
import { FiUpload, FiDownload } from 'react-icons/fi';

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
    variants: [
      {
        sku: '',
        price: '',
        stock: '',
        attributes: {}
      }
    ],
    images: [],
    gstRate: '18'
  });
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const stepTitles = [
    'Basic Information',
    'Product Variants',
    'Product Images'
  ];
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Variant attributes form data
  const [attributeKeys, setAttributeKeys] = useState(['color', 'size']);
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const queryClient = useQueryClient();
  
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
      
      // Add image files if any
      if (productData.imageFiles && productData.imageFiles.length > 0) {
        for (let i = 0; i < productData.imageFiles.length; i++) {
          formData.append('images', productData.imageFiles[i]);
        }
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
      if (data.variants) formData.append('variants', JSON.stringify(data.variants));
      if (data.gstRate) formData.append('gstRate', data.gstRate);
      
      // Add image files if any
      if (data.imageFiles && data.imageFiles.length > 0) {
        for (let i = 0; i < data.imageFiles.length; i++) {
          formData.append('images', data.imageFiles[i]);
        }
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
          stock: '',
          attributes: {}
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
  
  // Handle image file selection with multiple file support
  const handleImageFilesChange = (e) => {
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
      const updatedImageFiles = [...(prev.imageFiles || []), ...validFiles];
      
      // Show success toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      
      if (validFiles.length > 0) {
        toast.success(`Added ${validFiles.length} image${validFiles.length !== 1 ? 's' : ''}`);
      }
      
      return {
        ...prev,
        imageFiles: updatedImageFiles
      };
    });
    
    // Reset the input value to allow selecting the same files again
    e.target.value = '';
  };
  
  // Handle drag and drop for images
  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('bg-teal-50', 'border-teal-500');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFilesChange({ target: { files: e.dataTransfer.files } });
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
  const handleImageFileRemove = (indexToRemove) => {
    setFormData(prev => {
      const updatedImageFiles = Array.from(prev.imageFiles || []).filter((_, index) => index !== indexToRemove);
      toast.success('Image removed from selection');
      return {
        ...prev,
        imageFiles: updatedImageFiles
      };
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
    setFormData({
      title: '',
      description: '',
      category: '',
      variants: [
        {
          sku: '',
          price: '',
          stock: '',
          attributes: {}
        }
      ],
      images: [],
      imageFiles: [],
      removeImages: [],
      gstRate: '18'
    });
  };
  
  // Open edit modal with product data
  const handleEditClick = (product) => {
    setCurrentProduct(product);
    setCurrentStep(1); // Always start at step 1
    setFormData({
      title: product.title,
      description: product.description,
      category: product.category?._id || product.category,
      variants: product.variants || [
        {
          sku: '',
          price: '',
          stock: '',
          attributes: {}
        }
      ],
      images: product.images || [],
      imageFiles: [],
      removeImages: [],
      gstRate: product.gstRate?.toString() || '18'
    });
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
                        <span className="text-xs text-gray-500">{formatCurrency(variant.price)}</span>
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
        // Validate basic information
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
      } else if (step === 2) {
        // Validate variants
        if (formData.variants.length === 0) {
          newErrors.variants = 'At least one variant is required';
        } else {
          let hasVariantErrors = false;
          formData.variants.forEach((variant, index) => {
            if (!variant.sku || !variant.sku.trim()) {
              newErrors[`variant_${index}_sku`] = 'SKU is required';
              hasVariantErrors = true;
            }
            
            if (!variant.price || isNaN(parseFloat(variant.price)) || parseFloat(variant.price) <= 0) {
              newErrors[`variant_${index}_price`] = 'Valid price is required';
              hasVariantErrors = true;
            }
            
            if (variant.stock === undefined || variant.stock === null || isNaN(parseInt(variant.stock)) || parseInt(variant.stock) < 0) {
              newErrors[`variant_${index}_stock`] = 'Valid stock is required';
              hasVariantErrors = true;
            }
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
        // Validate basic information
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
      } else if (currentStep === 2) {
        // Validate variants
        if (formData.variants.length === 0) {
          newErrors.variants = 'At least one variant is required';
        } else {
          let hasVariantErrors = false;
          formData.variants.forEach((variant, index) => {
            if (!variant.sku || !variant.sku.trim()) {
              newErrors[`variant_${index}_sku`] = 'SKU is required';
              hasVariantErrors = true;
            }
            
            if (!variant.price || isNaN(parseFloat(variant.price)) || parseFloat(variant.price) <= 0) {
              newErrors[`variant_${index}_price`] = 'Valid price is required';
              hasVariantErrors = true;
            }
            
            if (variant.stock === undefined || variant.stock === null || isNaN(parseInt(variant.stock)) || parseInt(variant.stock) < 0) {
              newErrors[`variant_${index}_stock`] = 'Valid stock is required';
              hasVariantErrors = true;
            }
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
    }, [currentStep, formData, errors]);
    
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
      {/* Form Header with Title and Steps */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-800">
            {currentProduct ? 'Edit Product Details' : 'Add New Product'}
          </h3>
          <div className="text-sm font-medium text-gray-600">
            Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
          <div 
            className="bg-teal-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-500">Fields marked with * are required</p>
      </div>
      
      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-md font-medium text-gray-700 mb-4 border-b pb-2">Basic Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className={errors.title ? 'error-field' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                onBlur={() => {
                  if (!formData.title.trim()) {
                    setErrors(prev => ({ ...prev, title: 'Title is required' }));
                  } else {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.title;
                      return newErrors;
                    });
                  }
                }}
                placeholder="Enter product title"
                className={`w-full focus:border-teal-500 ${errors.title ? 'border-red-500 bg-red-50' : ''}`}
              />
              {errors.title ? (
                <p className="text-xs text-red-600 mt-1">{errors.title}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Product title as it will appear to customers</p>
              )}
            </div>
            
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
                <option value="">Select a category</option>
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
          
          <div className={`mb-4 ${errors.description ? 'error-field' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              onBlur={() => {
                if (!formData.description.trim()) {
                  setErrors(prev => ({ ...prev, description: 'Description is required' }));
                } else {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.description;
                    return newErrors;
                  });
                }
              }}
              rows="4"
              placeholder="Describe your product in detail"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            ></textarea>
            {errors.description ? (
              <p className="text-xs text-red-600 mt-1">{errors.description}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Provide a detailed description of your product</p>
            )}
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
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Select the applicable GST rate for this product</p>
          </div>
        </div>
      )}
      
      {/* Step 2: Variants Section */}
      {currentStep === 2 && (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-md font-medium text-gray-700 mb-4 border-b pb-2">Product Variants</h4>
          
          {/* Attribute Keys Management */}
          <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-sm font-medium text-blue-800">Attribute Types</h5>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {attributeKeys.length} attributes defined
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {attributeKeys.map(key => (
                <span key={key} className="bg-white border border-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm shadow-sm">
                  {key}
                </span>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newAttributeKey}
                onChange={(e) => setNewAttributeKey(e.target.value)}
                placeholder="Add new attribute (e.g. material, color, size)"
                className="flex-1 border border-blue-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={addAttributeKey}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                Add Attribute
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">Define attributes like color, size, material that your product variants will have</p>
          </div>
          
          {/* Variants List */}
          <div className="space-y-5 mb-5">
            {formData.variants.map((variant, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-1 rounded-full mr-2">
                      #{index + 1}
                    </span>
                    <h5 className="font-medium text-gray-800">Variant Details</h5>
                  </div>
                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className={errors[`variant_${index}_sku`] ? 'error-field' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      onBlur={() => {
                        if (!variant.sku || !variant.sku.trim()) {
                          setErrors(prev => ({ ...prev, [`variant_${index}_sku`]: 'SKU is required' }));
                        } else {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`variant_${index}_sku`];
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Unique product code"
                      className={`block w-full border rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500 ${errors[`variant_${index}_sku`] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      required
                    />
                    {errors[`variant_${index}_sku`] ? (
                      <p className="text-xs text-red-600 mt-1">{errors[`variant_${index}_sku`]}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Unique identifier for this variant</p>
                    )}
                  </div>
                  <div className={errors[`variant_${index}_price`] ? 'error-field' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        onBlur={() => {
                          if (!variant.price || isNaN(variant.price) || parseFloat(variant.price) <= 0) {
                            setErrors(prev => ({ ...prev, [`variant_${index}_price`]: 'Valid price is required' }));
                          } else {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[`variant_${index}_price`];
                              return newErrors;
                            });
                          }
                        }}
                        placeholder="0.00"
                        className={`block w-full border rounded-md shadow-sm p-2 pl-7 focus:ring-teal-500 focus:border-teal-500 ${errors[`variant_${index}_price`] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    {errors[`variant_${index}_price`] ? (
                      <p className="text-xs text-red-600 mt-1">{errors[`variant_${index}_price`]}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Selling price (without GST)</p>
                    )}
                  </div>
                  <div className={errors[`variant_${index}_stock`] ? 'error-field' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                        onBlur={() => {
                          if (variant.stock === '' || isNaN(variant.stock) || parseInt(variant.stock) < 0) {
                            setErrors(prev => ({ ...prev, [`variant_${index}_stock`]: 'Valid stock quantity is required' }));
                          } else {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[`variant_${index}_stock`];
                              return newErrors;
                            });
                          }
                        }}
                        placeholder="Available quantity"
                        className={`block w-full border rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500 ${errors[`variant_${index}_stock`] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        min="0"
                        required
                      />
                      {errors[`variant_${index}_stock`] ? (
                        <p className="text-xs text-red-600 mt-1">{errors[`variant_${index}_stock`]}</p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">Current available quantity</p>
                      )}
                      {currentProduct && (
                        <button
                          type="button"
                          onClick={() => handleStockUpdate(currentProduct._id, variant.sku, variant.stock)}
                          className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors relative shadow-sm"
                          disabled={updateStockMutation.isLoading}
                        >
                          {updateStockMutation.isLoading ? (
                            <>
                              <span className="opacity-0">Update</span>
                              <span className="absolute inset-0 flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </span>
                            </>
                          ) : 'Update Stock'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current available quantity</p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-md border border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Variant Attributes</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {attributeKeys.map(key => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{key}</label>
                        <input
                          type="text"
                          value={variant.attributes[key] || ''}
                          onChange={(e) => handleAttributeChange(index, key, e.target.value)}
                          placeholder={`Enter ${key}`}
                          className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addVariant}
            className="w-full border-2 border-dashed border-teal-300 rounded-lg p-3 text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Another Variant
          </button>
          
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
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-md font-medium text-gray-700 mb-4 border-b pb-2">Product Images</h4>
          
          {/* Current Images */}
          {formData.images && formData.images.length > 0 ? (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-sm font-medium text-gray-700">Current Images</h5>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
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
            <div className="mb-5 p-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-sm mb-1">No images uploaded yet</p>
              <p className="text-gray-400 text-xs">Upload images using the section below</p>
            </div>
          )}
          
          {/* Upload New Images - Enhanced Drag & Drop */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-sm font-medium text-gray-700">Upload Product Images</h5>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {formData.images?.length || 0} existing
                </span>
                <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                  {formData.imageFiles?.length || 0} new
                </span>
              </div>
            </div>
            
            <div 
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 bg-white transition-colors ${errors.images ? 'border-red-300 bg-red-50' : 'border-teal-300 hover:bg-teal-50'}`}
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
              onDrop={handleImageDrop}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-teal-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-gray-700 mb-1">Drag and drop multiple files here</p>
              <p className="text-xs text-gray-500 mb-4">Supports: JPG, PNG, GIF, WebP (Max 5MB each)</p>
              
              {errors.images && (
                <p className="text-xs text-red-600 mb-3">{errors.images}</p>
              )}
              
              <label className="relative inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                </svg>
                Browse Files
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageFilesChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
              
              <p className="text-xs text-gray-500 mt-3">Or click the button to select multiple files</p>
            </div>
            
            {/* Preview of Selected Images */}
            {formData.imageFiles && formData.imageFiles.length > 0 && (
              <div className="mt-6 bg-white p-4 rounded-lg border border-teal-200">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-teal-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    New Images to Upload
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
                        onClick={() => handleImageFileRemove(index)}
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">{formatCurrency(variant.price)}</td>
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