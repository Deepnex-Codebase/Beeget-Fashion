import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../utils/api";
import Button from "../Common/Button";
import Modal from "../Common/Modal";
import Input from "../Common/Input";
import { toast } from "react-hot-toast";
import {
  FiSearch,
  FiFilter,
  FiInbox,
  FiUpload,
  FiX,
  FiRefreshCw,
  FiTag,
  FiImage,
  FiCalendar,
  FiList,
  FiChevronUp,
  FiFolder,
  FiChevronDown,
  FiChevronRight,
  FiAlignLeft,
  FiToggleRight,
  FiPackage,
  FiEdit2,
  FiTrash2,
  FiAlertCircle,
} from "react-icons/fi";
import Pagination from "../Common/Pagination";
import Spinner from "../Common/Spinner";
import { debounce } from "lodash";

const CollectionManagement = () => {
  // UI State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'inactive'
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productSearchInput, setProductSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("name"); // 'name', 'date', 'order'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc', 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // File Upload State
  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Product Selection State
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [productItemsPerPage, setProductItemsPerPage] = useState(10); // Changed from 20 to 10 to match handleProductsClick default

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    active: true,
    order: 0,
    startDate: "",
    endDate: "",
  });

  // Error State
  const [formErrors, setFormErrors] = useState({});

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image: "",
      active: true,
      order: 0,
      startDate: "",
      endDate: "",
    });
    setCurrentCollection(null);
    setImageFile(null);
    setImagePreview("");
    setSelectedProducts([]);
    setFormErrors({});
    setUploadProgress(0);
    setProductSearchTerm("");
    setProductPage(1);
  };

  // Open edit modal with collection data - immediately open modal
  const handleEditClick = (collection) => {
    // Validate collection has a valid ID
    if (!collection) {
      // console.error('Invalid collection:', collection);
      toast.error('Cannot edit collection: Invalid collection');
      return;
    }

    // Deep clone the collection to avoid reference issues
    const collectionCopy = JSON.parse(JSON.stringify(collection));
    
    // Ensure the collection has an _id
    if (!collectionCopy._id) {
      // console.error('Missing ID in collection:', collectionCopy);
      toast.error('Cannot edit collection: Missing ID');
      return;
    }
    
    // console.log('Editing collection with ID:', collectionCopy._id);
    setCurrentCollection(collectionCopy);
    setFormData({
      name: collectionCopy.name,
      description: collectionCopy.description || "",
      image: collectionCopy.image || "",
      active: collectionCopy.active !== false, // Default to true if not specified
      order: collectionCopy.order || 0,
      startDate: formatDateForInput(collectionCopy.startDate),
      endDate: formatDateForInput(collectionCopy.endDate),
    });

    // Set image preview if collection has an image
    if (collectionCopy.image) {
      setImagePreview(collectionCopy.image);
    } else {
      setImagePreview("");
    }

    // If collection has products, pre-select them with proper type checking
    if (collectionCopy.products && Array.isArray(collectionCopy.products)) {
      // Handle both object references and direct IDs
      const productIds = collectionCopy.products
        .map((product) => {
          // Check if product is an object with _id or id property, or just an ID string
          if (typeof product === "object") {
            return product._id || product.id;
          } else {
            return product;
          }
        })
        .filter((id) => id); // Filter out any undefined/null values
      
      // console.log('Selected product IDs:', productIds);
      setSelectedProducts(productIds);
    } else {
      setSelectedProducts([]);
    }

    setShowEditModal(true);
  };

  const queryClient = useQueryClient();

  // Fetch collections with search, filter, sort and pagination
  const {
    data: collectionsData,
    isLoading: collectionsLoading,
    error: collectionsError,
    refetch: refetchCollections,
  } = useQuery({
    queryKey: [
      "admin-collections",
      searchTerm,
      filterStatus,
      sortBy,
      sortOrder,
      currentPage,
      itemsPerPage,
    ],
    queryFn: async () => {
      try {
        let url = "/collections";
        const params = new URLSearchParams();

        // Search and filter params
        if (searchTerm) {
          params.append("search", searchTerm);
        }

        if (filterStatus !== "all") {
          params.append("status", filterStatus);
        }

        // Sorting params
        params.append("sort", sortBy);
        params.append("order", sortOrder);

        // Pagination params
        params.append("page", currentPage);
        params.append("limit", itemsPerPage);

        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }

        const response = await axios.get(url);
        // console.log("Collections API response:", response);

        // Handle the direct array response from backend
        const collections = Array.isArray(response.data) ? response.data : [];
        
        // Create a properly structured response object
        const formattedData = {
          data: collections,
          totalItems: collections.length
        };
        
        // Update total items for pagination
        setTotalItems(formattedData.totalItems);
        
        return formattedData;
      } catch (error) {
        // console.error("Fetch collections error:", error);
        toast.error(`Failed to fetch collections: ${error.message}`);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    refetchOnWindowFocus: false,
    keepPreviousData: true, // Keep previous data while loading new data
  });

  // Fetch products for collection assignment with search and pagination
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: [
      "products-for-collection",
      productSearchTerm,
      productPage,
      productItemsPerPage,
    ],
    queryFn: async () => {
      try {
        setLoadingProducts(true);
        const params = new URLSearchParams();

        if (productSearchTerm) {
          params.append("search", productSearchTerm);
        }

        params.append("page", productPage);
        params.append("limit", productItemsPerPage);

        const url = `/products?${params.toString()}`;
        const response = await axios.get(url);

        // Transform the API response to match expected format
        // console.log(response.data.data)
        const transformedData = {
          data: response.data.data.products || [],
          totalItems: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.pages || 1,
        };

        // console.log("Transformed products data:", transformedData);
        setLoadingProducts(false);
        return transformedData;
      } catch (error) {
        setLoadingProducts(false);
        // console.error("Fetch products error:", error);
        throw error;
      }
    },
    enabled: showProductsModal,
    staleTime: 30 * 1000,
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: async (id) => {
      try {
        // console.log(`Deleting collection with id: ${id}`);
        const response = await axios.delete(`/collections/${id}`);
        // console.log("Delete collection response:", response);
        return response.data;
      } catch (error) {
        // console.error("Delete collection error:", error);
        // console.error("Error details:", error.response?.data);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] }); // Invalidate public collections query
      setShowDeleteModal(false);
      setCurrentCollection(null);
      toast.success("Collection deleted successfully");
    },
    onError: (error) => {
      // console.error("Delete collection error:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to delete collection"
      );
    },
  });

  // Create collection mutation with improved error handling and validation
  const createCollectionMutation = useMutation({
    mutationFn: async (collectionData) => {
      try {
        // console.log("Creating collection with data:", collectionData);

        // Enhanced validation with more detailed error messages
        const errors = {};
        if (!collectionData.name) errors.name = "Name is required";
        else if (collectionData.name.length < 2)
          errors.name = "Name must be at least 2 characters";
        else if (collectionData.name.length > 100)
          errors.name = "Name must be less than 100 characters";

        if (
          collectionData.description &&
          collectionData.description.length > 500
        ) {
          errors.description = "Description must be less than 500 characters";
        }

        if (collectionData.startDate && collectionData.endDate) {
          const start = new Date(collectionData.startDate);
          const end = new Date(collectionData.endDate);
          if (end < start) errors.endDate = "End date must be after start date";
        }

        if (collectionData.order && isNaN(Number(collectionData.order))) {
          errors.order = "Order must be a valid number";
        }

        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          throw new Error("Validation failed");
        }

        // Handle file upload if present with better error handling
        if (imageFile) {
          try {
            setIsUploading(true);
            setUploadProgress(0);
            const formData = new FormData();
            formData.append("image", imageFile);

            const uploadResponse = await axios.post(
              "/api/products",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  setUploadProgress(percentCompleted);
                },
                timeout: 30000, // 30 second timeout for upload
              }
            );

            if (uploadResponse.data && uploadResponse.data.data && uploadResponse.data.data.product && uploadResponse.data.data.product.images && uploadResponse.data.data.product.images.length > 0) {
              collectionData.image = uploadResponse.data.data.product.images[0];
              // console.log(
              //   "Image uploaded successfully:",
              //   collectionData.image
              // );
            } else {
              throw new Error("Invalid response from image upload server");
            }

            setIsUploading(false);
            setUploadProgress(100);
          } catch (uploadError) {
            setIsUploading(false);
            setUploadProgress(0);
            // console.error("Image upload error:", uploadError);
            throw new Error("Failed to upload image. Please try again.");
          }
        }

        // Create the collection
        const response = await axios.post("/collections", collectionData);
        // console.log("Create collection response:", response);

        // If products were selected, add them to the collection
        if (
          selectedProducts.length > 0 &&
          response.data &&
          response.data.data &&
          response.data.data._id
        ) {
          try {
            const productsResponse = await axios.post(
              `/collections/${response.data.data._id}/products`,
              {
                productIds: selectedProducts,
              }
            );
            // console.log("Products added to collection:", productsResponse.data);
          } catch (productsError) {
            // console.error(
            //   "Error adding products to collection:",
            //   productsError
            // );
            // We don't throw here to avoid failing the whole operation
            // Instead we'll show a toast in onSuccess
          }
        }

        return response.data;
      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0);

        // Enhanced error handling
        if (error.response?.data?.errors) {
          setFormErrors(error.response.data.errors);
        } else if (error.response?.data?.error) {
          // Single error message from server
          toast.error(error.response.data.error);
        }

        // console.error("Create collection error:", error);
        // console.error("Error details:", error.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] }); // Invalidate public collections query
      setShowAddModal(false);
      resetForm();

      // Show success message with collection name if available
      const collectionName = data?.data?.name || "Collection";
      toast.success(`${collectionName} created successfully`);

      // Show warning if products were selected but not added successfully
      if (
        selectedProducts.length > 0 &&
        (!data?.data?.products ||
          data.data.products.length !== selectedProducts.length)
      ) {
        toast.warning(
          "Some products may not have been added to the collection. Please check and try again if needed."
        );
      }
    },
    onError: (error) => {
      if (error.message === "Validation failed") {
        toast.error("Please fix the form errors");
        return;
      }
      // console.error("Create collection error:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create collection"
      );
    },
  });

  // Update collection mutation with improved error handling and validation
  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        // console.log(`Updating collection ${id} with data:`, data);

        // Enhanced validation with more detailed error messages
        const errors = {};
        if (!data.name) errors.name = "Name is required";
        else if (data.name.length < 2)
          errors.name = "Name must be at least 2 characters";
        else if (data.name.length > 100)
          errors.name = "Name must be less than 100 characters";

        if (data.description && data.description.length > 500) {
          errors.description = "Description must be less than 500 characters";
        }

        if (data.startDate && data.endDate) {
          const start = new Date(data.startDate);
          const end = new Date(data.endDate);
          if (end < start) errors.endDate = "End date must be after start date";
        }

        if (data.order && isNaN(Number(data.order))) {
          errors.order = "Order must be a valid number";
        }

        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          throw new Error("Validation failed");
        }

        // Handle file upload if present with better error handling
        if (imageFile) {
          try {
            setIsUploading(true);
            setUploadProgress(0);
            const formData = new FormData();
            formData.append("image", imageFile);

            const uploadResponse = await axios.post(
              "/api/products",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  setUploadProgress(percentCompleted);
                },
                timeout: 30000, // 30 second timeout for upload
              }
            );

            if (uploadResponse.data && uploadResponse.data.data && uploadResponse.data.data.product && uploadResponse.data.data.product.images && uploadResponse.data.data.product.images.length > 0) {
              data.image = uploadResponse.data.data.product.images[0];
              // console.log(
              //   "Image uploaded successfully:",
              //   data.image
              // );
            } else {
              throw new Error("Invalid response from image upload server");
            }

            setIsUploading(false);
            setUploadProgress(100);
          } catch (uploadError) {
            setIsUploading(false);
            setUploadProgress(0);
            // console.error("Image upload error:", uploadError);
            throw new Error("Failed to upload image. Please try again.");
          }
        }

        // Validate ID before making the API call
        if (!id || id === 'undefined') {
          // console.error('Invalid collection ID:', id);
          throw new Error('Invalid collection ID');
        }
        
        // Update the collection
        const response = await axios.put(`/collections/${id}`, data);
        // console.log("Update collection response:", response);

        // If products were selected, update them in the collection
        if (selectedProducts.length >= 0) {
          // Handle both adding and removing products
          try {
            const productsResponse = await axios.post(
              `/collections/${id}/products`,
              {
                productIds: selectedProducts,
              }
            );
            // console.log(
            //   "Products updated in collection:",
            //   productsResponse.data
            // );
          } catch (productsError) {
            // console.error(
            //   "Error updating products in collection:",
            //   productsError
            // );
            // We don't throw here to avoid failing the whole operation
            // Instead we'll show a toast in onSuccess
          }
        }

        return response.data;
      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0);

        // Enhanced error handling
        if (error.response?.data?.errors) {
          setFormErrors(error.response.data.errors);
        } else if (error.response?.data?.error) {
          // Single error message from server
          toast.error(error.response.data.error);
        }

        // console.error("Update collection error:", error);
        // console.error("Error details:", error.response?.data);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] }); // Invalidate public collections query
      setShowEditModal(false);
      resetForm();

      // Show success message with collection name if available
      const collectionName =
        data?.data?.name || currentCollection?.name || "Collection";
      toast.success(`${collectionName} updated successfully`);

      // Show warning if products were selected but not updated successfully
      if (
        selectedProducts.length > 0 &&
        (!data?.data?.products ||
          data.data.products.length !== selectedProducts.length)
      ) {
        toast.warning(
          "Some products may not have been updated in the collection. Please check and try again if needed."
        );
      }
    },
    onError: (error) => {
      if (error.message === "Validation failed") {
        toast.error("Please fix the form errors");
        return;
      }
      // console.error("Update collection error:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update collection"
      );
    },
  });

  // Handle form input changes with validation
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error for this field when user makes changes
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Validate specific fields
    if (name === "name" && !newValue.trim()) {
      setFormErrors((prev) => ({
        ...prev,
        name: "Name is required",
      }));
    } else if (name === "endDate" && formData.startDate && newValue) {
      const start = new Date(formData.startDate);
      const end = new Date(newValue);
      if (end < start) {
        setFormErrors((prev) => ({
          ...prev,
          endDate: "End date must be after start date",
        }));
      }
    } else if (name === "startDate" && formData.endDate && newValue) {
      const start = new Date(newValue);
      const end = new Date(formData.endDate);
      if (end < start) {
        setFormErrors((prev) => ({
          ...prev,
          endDate: "End date must be after start date",
        }));
      } else {
        // Clear end date error if start date is now valid
        setFormErrors((prev) => ({
          ...prev,
          endDate: undefined,
        }));
      }
    }
  };

  // Handle image file selection with enhanced validation and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setImageFile(file);

    // Clear any previous image URL since we're using a file now
    setFormData((prev) => ({
      ...prev,
      image: "",
    }));

    // Clear any image-related errors
    if (formErrors.image) {
      setFormErrors((prev) => ({
        ...prev,
        image: undefined,
      }));
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
      setImageFile(null);
      setImagePreview("");
    };
    reader.readAsDataURL(file);
  };

  // Handle image removal with improved state management
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");

    // Reset file input if it exists
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Clear upload progress
    setUploadProgress(0);

    // If we're in edit mode and there was a previous image URL, restore it
    if (currentCollection && currentCollection.image) {
      setFormData((prev) => ({
        ...prev,
        image: currentCollection.image,
      }));
    } else {
      // Otherwise just clear the image field
      setFormData((prev) => ({
        ...prev,
        image: "",
      }));
    }
  };

  // Handle search with debounce
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1); // Reset to first page on search
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value); // Update the input field immediately for UI responsiveness
    debouncedSearch(value); // Debounce the actual search query
  };

  // Handle product search with debounce
  const debouncedProductSearch = useCallback(
    debounce((value) => {
      setProductSearchTerm(value);
      setProductPage(1); // Reset to first page on search
      // Force refetch products when search term changes
      if (value.length >= 3 || value === "") {
        setTimeout(() => {
          refetchProducts();
          // console.log("Refetching products after search term change");
        }, 100);
      }
    }, 500),
    [refetchProducts]
  );

  const handleProductSearch = (e) => {
    const value = e.target.value;
    setProductSearchInput(value); // Update the input field immediately

    // Show search feedback for better UX
    if (value && value.length >= 3) {
      toast.info(`Searching for "${value}"...`, {
        autoClose: 1000,
        position: "bottom-right",
      });
    } else if (value === "") {
      // If search is cleared, reset immediately without waiting for debounce
      setProductSearchTerm("");
      // Force refetch products when search is cleared
      setTimeout(() => {
        refetchProducts();
        // console.log("Refetching products after clearing search");
      }, 100);
      toast.info("Search cleared, showing all products", {
        autoClose: 1000,
        position: "bottom-right",
      });
      return;
    } else if (value.length < 3) {
      toast.info("Type at least 3 characters to search", {
        autoClose: 1000,
        position: "bottom-right",
      });
    }

    debouncedProductSearch(value); // Debounce the actual search query
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle sort change
  const handleSortChange = (field) => {
    // If clicking on the same field, toggle the order
    if (sortBy === field) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      // If clicking on a new field, set it as the sort field and default to ascending
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Get sort icon based on current sort state
  const getSortIcon = (field) => {
    if (sortBy !== field) return null;

    return sortOrder === "asc" ? (
      <FiChevronUp className="inline ml-1" />
    ) : (
      <FiChevronDown className="inline ml-1" />
    );
  };

  // Handle product selection with improved feedback
  const handleProductSelection = (productId) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        // Remove product from selection
        const newSelection = prev.filter((id) => id !== productId);
        // Show subtle feedback for deselection
        if (prev.length > 10 && newSelection.length === 10) {
          toast.info("Selection reduced to 10 products");
        }
        return newSelection;
      } else {
        // Add product to selection
        const newSelection = [...prev, productId];
        // Show milestone feedback
        if (newSelection.length === 1) {
          toast.success("First product selected");
        } else if (newSelection.length === 10) {
          toast.success("10 products selected");
        } else if (newSelection.length === 50) {
          toast.success("50 products selected");
        } else if (newSelection.length === 100) {
          toast.success("100 products selected");
        }
        return newSelection;
      }
    });
  };

  // Open products modal with improved error handling and loading state
  const handleProductsClick = (collection) => {
    try {
      setCurrentCollection(collection);
      // Reset search and pagination when opening modal
      setProductSearchTerm("");
      setProductSearchInput("");
      setProductPage(1);
      setProductItemsPerPage(20); // Increased items per page for better visibility

      // If editing existing collection, pre-select its products
      if (
        collection &&
        collection.products &&
        Array.isArray(collection.products)
      ) {
        // Handle both object references and direct IDs
        const productIds = collection.products
          .map((product) => {
            // Check if product is an object with _id or id property, or just an ID string
            return typeof product === "object"
              ? product._id || product.id
              : product;
          })
          .filter((id) => id); // Filter out any undefined/null values

        // console.log(
        //   `Pre-selecting ${productIds.length} products for collection ${collection.name}`
        // );
        setSelectedProducts(productIds);
      } else {
        // Clear selected products if creating a new collection or no products
        // console.log("No products to pre-select, clearing selection");
        setSelectedProducts([]);
      }

      // Show modal and trigger products fetch
      setShowProductsModal(true);

      // Force refetch products to ensure we have the latest data
      setTimeout(() => {
        refetchProducts();
        // console.log("Triggered product refetch");
      }, 100);

      // Log for debugging
      // console.log(
      //   "Opening products modal for collection:",
      //   collection?.name || "New Collection"
      // );
    } catch (error) {
      // console.error("Error opening products modal:", error);
      toast.error("Failed to open products modal. Please try again.");
    }
  };

  // Handle form submission for creating/updating collection
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.name) {
      toast.error("Please fill all required fields");
      return;
    }

    // Validate image URL if provided
    if (formData.image && !isValidUrl(formData.image)) {
      toast.error("Please enter a valid image URL");
      return;
    }

    // Validate dates if both are provided
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        toast.error("End date must be after start date");
        return;
      }
    }

    // Prepare data for API
    const collectionData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      order: formData.order ? Number(formData.order) : 0,
      active: Boolean(formData.active),
      // Ensure dates are properly formatted
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    };

    // Remove empty fields to avoid validation errors
    Object.keys(collectionData).forEach((key) => {
      if (collectionData[key] === "" || collectionData[key] === null) {
        delete collectionData[key];
      }
    });

    // Add selected products to the collection data
    if (selectedProducts.length > 0) {
      // console.log(
        // `Including ${selectedProducts.length} selected products in submission`
      // );
      collectionData.products = selectedProducts;
    }

    // console.log("Submitting collection data:", collectionData);

    try {
      if (currentCollection && currentCollection._id && typeof currentCollection._id === 'string' && currentCollection._id.trim() !== '') {
        // Update existing collection with valid ID
        // console.log("Collection ID for update:", currentCollection._id);
        
        updateCollectionMutation.mutate({
          id: currentCollection._id,
          data: collectionData,
        });
      } else {
        // Create new collection in these cases:
        // 1. No currentCollection (brand new collection)
        // 2. currentCollection exists but has no _id (temporary collection from product selection)
        // 3. currentCollection has invalid _id
        // console.log("Creating new collection", currentCollection ? "(temporary collection detected)" : "");
        createCollectionMutation.mutate(collectionData);
      }
    } catch (error) {
      // console.error("Error submitting form:", error);
      toast.error("An error occurred while submitting the form");
    }
  };

  // Helper function to validate URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Invalid date
    return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Open delete confirmation modal - immediately open modal
  const handleDeleteClick = (collection) => {
    setCurrentCollection(collection);
    setShowDeleteModal(true);
  };

  // Handle page change for collections
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change for collections
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = Number(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Handle page change for products
  const handleProductPageChange = (page) => {
    setProductPage(page);
  };

  // Handle items per page change for products
  const handleProductItemsPerPageChange = (e) => {
    const newItemsPerPage = Number(e.target.value);
    setProductItemsPerPage(newItemsPerPage);
    setProductPage(1); // Reset to first page when changing items per page
  };

  // Check if collection is active based on dates
  const isCollectionActive = (collection) => {
    if (!collection.active) return false;

    const now = new Date();
    const startDate = collection.startDate
      ? new Date(collection.startDate)
      : null;
    const endDate = collection.endDate ? new Date(collection.endDate) : null;

    if (startDate && startDate > now) return false;
    if (endDate && endDate < now) return false;

    return true;
  };

  // Render collection list with enhanced features
  const renderCollectionList = () => {
    if (collectionsLoading && !collectionsData) {
      return (
        <div className="flex flex-col justify-center items-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Loading collections...</p>
        </div>
      );
    }

    if (collectionsError) {
      return (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <FiAlertCircle className="inline-block mr-2" size={20} />
            Error loading collections
          </div>
          <p className="text-gray-600 mb-4">
            {collectionsError.message || "Please try again"}
          </p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => refetchCollections()}
          >
            <FiRefreshCw className="mr-2" /> Retry
          </Button>
        </div>
      );
    }

    if (!collectionsData?.data?.length) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FiInbox className="mx-auto text-gray-400" size={40} />
          <p className="mt-4 text-gray-600 font-medium">No collections found</p>
          <p className="text-gray-500 mt-2">
            {searchTerm
              ? `No results for "${searchTerm}"`
              : "Try creating a new collection"}
          </p>
          {(searchTerm || filterStatus !== "all" || sortBy !== "createdAt") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setSearchInput("");
                setFilterStatus("all");
                setSortBy("createdAt");
                setSortOrder("desc");
              }}
            >
              <FiX className="mr-2" /> Clear Filters
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        {/* Search and filter bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-1 w-full md:w-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search collections..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-10"
                fullWidth
              />
            </div>
            <select
              value={filterStatus}
              onChange={handleFilterChange}
              className="ml-2 px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            {collectionsLoading && (
              <div className="ml-2 text-gray-500 flex items-center">
                <Spinner size="sm" className="mr-2" />
                <span className="text-xs">Refreshing...</span>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange("name")}
                >
                  <div className="flex items-center">
                    <FiTag className="mr-1" />
                    Name
                    {getSortIcon("name")}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <FiAlignLeft className="mr-1" />
                    Description
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange("active")}
                >
                  <div className="flex items-center">
                    <FiToggleRight className="mr-1" />
                    Status
                    {getSortIcon("active")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange("startDate")}
                >
                  <div className="flex items-center">
                    <FiCalendar className="mr-1" />
                    Dates
                    {getSortIcon("startDate")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange("order")}
                >
                  <div className="flex items-center">
                    <FiList className="mr-1" />
                    Order
                    {getSortIcon("order")}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <FiPackage className="mr-1" />
                    Products
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {collectionsData.data.map((collection) => {
                const isActive = isCollectionActive(collection);
                return (
                  <tr
                    key={collection._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center">
                        {collection.image ? (
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            <img
                              className="h-10 w-10 rounded-md object-cover border border-gray-200"
                              src={collection.image}
                              alt={collection.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://placehold.co/40?text=No+Image";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 mr-3 bg-gray-100 rounded-md flex items-center justify-center">
                            <FiImage className="text-gray-400" />
                          </div>
                        )}
                        <div className="font-medium text-gray-900">
                          {collection.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {collection.description ? (
                        <div className="truncate max-w-xs">
                          {collection.description}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">
                          No description
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <FiCalendar
                            className="text-gray-400 mr-1"
                            size={12}
                          />
                          <span className="text-gray-600 font-medium">
                            Start:
                          </span>
                          <span className="ml-1">
                            {formatDateForDisplay(collection.startDate)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FiCalendar
                            className="text-gray-400 mr-1"
                            size={12}
                          />
                          <span className="text-gray-600 font-medium">
                            End:
                          </span>
                          <span className="ml-1">
                            {formatDateForDisplay(collection.endDate)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {collection.order || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant={
                          collection.products?.length > 0
                            ? "default"
                            : "outline"
                        }
                        size="xs"
                        onClick={() => handleProductsClick(collection)}
                        className="flex items-center justify-between min-w-[110px] group transition-all duration-200"
                      >
                        <div className="flex items-center">
                          <FiPackage className="mr-1" />
                          <span>Products</span>
                        </div>
                        <span
                          className={`${collection.products?.length > 0 ? "bg-white text-teal-700" : "bg-gray-100 text-gray-700"} ml-1 py-0.5 px-1.5 rounded-full text-xs font-medium transition-all duration-200`}
                        >
                          {collection.products?.length || 0}
                        </span>
                      </Button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        className="mr-2"
                        onClick={() => handleEditClick(collection)}
                      >
                        <FiEdit2 className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleDeleteClick(collection)}
                      >
                        <FiTrash2 className="mr-1" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > itemsPerPage && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
            <div className="text-sm text-gray-500 mb-4 sm:mb-0">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              collections
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalItems / itemsPerPage)}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </>
    );
  };

  // Render collection form (for add/edit modals) with enhanced validation and UI
  const renderCollectionForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          error={formErrors.name}
          className={formErrors.name ? "border-red-500" : ""}
        />
        {formErrors.name && (
          <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter collection description (optional)"
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image
        </label>
        <div className="mt-1 space-y-4">
          {/* Image preview */}
          {imagePreview ? (
            <div className="relative w-full max-w-xs">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="bg-red-500 text-white rounded-full p-2 shadow-sm hover:bg-red-600 transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 truncate">
                {imageFile ? imageFile.name : "Image from URL"}
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FiImage className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-1 text-sm text-gray-500">No image selected</p>
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-teal-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}

          {/* File input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div>
              <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <FiUpload className="mr-2" />
                {imageFile ? "Change Image" : "Upload Image"}
                <input
                  type="file"
                  className="sr-only"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                />
              </label>
              <span className="text-xs text-gray-500 block mt-1">
                JPEG, PNG, GIF, WEBP (max 2MB)
              </span>
            </div>

            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Or enter image URL:</p>
              <Input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full"
                disabled={!!imageFile}
                error={formErrors.image}
              />
              {formErrors.image && (
                <p className="mt-1 text-xs text-red-500">{formErrors.image}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <Input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            error={formErrors.startDate}
          />
          {formErrors.startDate && (
            <p className="mt-1 text-sm text-red-500">{formErrors.startDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <Input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            error={formErrors.endDate}
          />
          {formErrors.endDate && (
            <p className="mt-1 text-sm text-red-500">{formErrors.endDate}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order
          </label>
          <Input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleInputChange}
            min="0"
            placeholder="0"
          />
          <p className="mt-1 text-xs text-gray-500">
            Collections with lower order values appear first
          </p>
        </div>

        <div className="flex items-center h-full pt-6">
          <input
            type="checkbox"
            id="active"
            name="active"
            checked={formData.active}
            onChange={handleInputChange}
            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
            Active
          </label>
          <span className="ml-2 text-xs text-gray-500">
            (Collection will be visible based on dates)
          </span>
        </div>
      </div>

      {/* Products selection button - available for both new and existing collections */}
      <div className="border-t border-gray-200 pt-4">
        <Button
          type="button"
          variant={selectedProducts.length > 0 ? "default" : "outline"}
          onClick={() => {
            // For new collections, we need to create a temporary collection object
            // This allows us to select products before the collection is created
            if (!currentCollection) {
              const tempCollection = {
                name: formData.name || "New Collection",
                products: [],
              };
              handleProductsClick(tempCollection);
            } else {
              handleProductsClick(currentCollection);
            }
          }}
          className="flex items-center w-full justify-between group transition-all duration-200"
        >
          <div className="flex items-center">
            <FiPackage className="mr-2" />
            <span>Manage Products</span>
          </div>
          <div className="flex items-center">
            <span
              className={`${selectedProducts.length > 0 ? "bg-white text-teal-700" : "bg-gray-100 text-gray-700"} py-0.5 px-2 rounded-full text-xs font-medium transition-all duration-200`}
            >
              {selectedProducts.length}
            </span>
            <FiChevronRight className="ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
        </Button>
        <p className="mt-1 text-xs text-gray-500">
          Assign products to this collection
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetForm();
            setShowAddModal(false);
            setShowEditModal(false);
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            createCollectionMutation.isLoading ||
            updateCollectionMutation.isLoading
          }
          className="relative"
        >
          {createCollectionMutation.isLoading ||
          updateCollectionMutation.isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              {currentCollection ? "Updating..." : "Creating..."}
            </>
          ) : currentCollection ? (
            "Update Collection"
          ) : (
            "Create Collection"
          )}
        </Button>
      </div>
    </form>
  );

  // Render products selection modal content with enhanced UI and error handling
  const renderProductsModal = () => {
    // Show loading state
    if (productsLoading || loadingProducts) {
      return (
        <div className="flex flex-col justify-center items-center py-16 bg-gray-50 rounded-lg">
          <Spinner size="lg" className="mb-4 text-teal-600" />
          <p className="text-gray-700 font-medium text-lg">Loading products...</p>
          <p className="text-gray-500 text-sm mt-2 max-w-md text-center">
            Please wait while we fetch the products for {currentCollection?.name || 'this collection'}
          </p>
        </div>
      );
    }
  
    // Show error state
    if (!productsData) {
      return (
        <div className="text-center py-12 flex flex-col items-center bg-red-50 rounded-lg">
          <FiAlertCircle className="text-red-500 mb-3" size={48} />
          <p className="text-gray-800 font-medium text-lg">Failed to load products</p>
          <p className="text-gray-600 text-sm mt-2 max-w-md">
            There was an error loading the products. Please try again.
          </p>
          <Button 
            variant="default" 
            className="mt-4"
            onClick={() => refetchProducts()}
          >
            <FiRefreshCw className="mr-2" /> Retry
          </Button>
        </div>
      );
    }
  
    // Show empty state
    if (!productsData.data?.length) {
      return (
        <div className="text-center py-16 flex flex-col items-center bg-gray-50 rounded-lg">
          <FiInbox className="text-gray-400 mb-4" size={64} />
          <p className="text-gray-800 font-medium text-xl">No products found</p>
          <p className="text-gray-600 text-sm mt-3 max-w-md">
            {productSearchTerm 
              ? `No results for "${productSearchTerm}"` 
              : 'No products available to display'}
          </p>
          {productSearchTerm && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setProductSearchTerm('');
                setProductSearchInput('');
                refetchProducts();
              }}
            >
              <FiX className="mr-2" /> Clear Search
            </Button>
          )}
        </div>
      );
    }
  
    // Main products list
    return (
      <div className="p-5">
        {/* Header */}
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h3 className="text-xl font-medium text-gray-800">Manage Products</h3>
          <p className="text-sm text-gray-500 mt-1">
            Select products to include in the "{currentCollection?.name || 'new collection'}" collection
          </p>
        </div>
        
        {/* Search bar */}
        <div className="mb-5 flex items-center">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-10 w-full"
              value={productSearchInput}
              onChange={handleProductSearch}
            />
          </div>
          {selectedProducts.length > 0 && (
            <Button 
              variant="outline" 
              className="ml-2"
              onClick={() => {
                if (window.confirm(`Clear ${selectedProducts.length} selected products?`)) {
                  setSelectedProducts([]);
                }
              }}
            >
              <FiX className="mr-1" /> Clear
            </Button>
          )}
        </div>
        
        {/* Selection info */}
        <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="text-sm">
            <span className="font-medium text-teal-700">{selectedProducts.length}</span>
            <span className="text-gray-600"> products selected</span>
          </div>
          <div className="text-sm text-gray-600">
            Showing {productsData.data.length} of {productsData.totalItems} products
          </div>
        </div>
        
        {/* Products list */}
        <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-md bg-white shadow-sm">
          {productsData.data.map(product => (
            <div 
              key={product._id} 
              className={`flex items-center p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 transition-colors ${
                selectedProducts.includes(product._id) ? 'bg-teal-50' : ''
              }`}
            >
              <input
                type="checkbox"
                id={`product-${product._id}`}
                checked={selectedProducts.includes(product._id)}
                onChange={() => handleProductSelection(product._id)}
                className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded cursor-pointer"
              />
              <label 
                htmlFor={`product-${product._id}`} 
                className="ml-3 flex items-center cursor-pointer flex-grow"
              >
                <div className="flex-shrink-0 w-16 h-16 mr-4 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center border border-gray-200">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/64?text=No+Image';
                      }}
                    />
                  ) : (
                    <FiImage className="text-gray-400" size={28} />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="font-medium text-gray-800">{product.title}</div>
                  <div className="text-sm text-gray-500 flex items-center flex-wrap gap-x-4 mt-1">
                    {product.variants && product.variants[0]?.sku && (
                      <span className="inline-flex items-center">
                        <FiTag className="mr-1 text-gray-400" size={12} />
                        {product.variants[0].sku}
                      </span>
                    )}
                    {product.variants && product.variants[0]?.price && (
                      <span className="font-medium text-gray-700">
                        ₹{parseInt(parseFloat(product.variants[0].price))}
                      </span>
                    )}
                    {product.category?.name && (
                      <span className="text-gray-500 inline-flex items-center">
                        <FiFolder className="mr-1 text-gray-400" size={12} />
                        {product.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {productsData.totalPages > 1 && (
          <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-200 pt-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Items per page:</span>
              <select
                value={productItemsPerPage}
                onChange={handleProductItemsPerPageChange}
                className="text-sm border border-gray-300 rounded p-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            
            <Pagination
              currentPage={productPage}
              totalPages={productsData.totalPages}
              onPageChange={handleProductPageChange}
            />
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => setShowProductsModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setShowProductsModal(false);
              toast.success(`${selectedProducts.length} products selected`);
            }}
          >
            Save Selection
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Collections Management</h3>
        <Button onClick={() => setShowAddModal(true)}>
          Add New Collection
        </Button>
      </div>

     

      {renderCollectionList()}

      {/* Add Collection Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Collection"
      >
        {renderCollectionForm()}
      </Modal>

      {/* Edit Collection Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Collection"
      >
        {renderCollectionForm()}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCurrentCollection(null);
        }}
        title="Confirm Delete"
      >
        <div className="p-4">
          <p className="mb-4">
            Are you sure you want to delete the collection "
            {currentCollection?.name}"?
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                deleteCollectionMutation.mutate(currentCollection._id)
              }
              disabled={deleteCollectionMutation.isLoading}
            >
              {deleteCollectionMutation.isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Products Selection Modal */}
      <Modal
        isOpen={showProductsModal}
        onClose={() => {
          // Confirm if there are unsaved changes
          if (
            currentCollection &&
            JSON.stringify(selectedProducts.sort()) !==
              JSON.stringify(
                (currentCollection.products || [])
                  .map((p) => p._id || p.id)
                  .sort()
              )
          ) {
            if (
              window.confirm(
                "You have unsaved changes. Are you sure you want to close?"
              )
            ) {
              setShowProductsModal(false);
            }
          } else {
            setShowProductsModal(false);
          }
        }}
        title={`Manage Products for ${currentCollection?.name || "New Collection"}`}
        size="lg"
      >
        {renderProductsModal()}
      </Modal>
    </div>
  );
};

export default CollectionManagement;
