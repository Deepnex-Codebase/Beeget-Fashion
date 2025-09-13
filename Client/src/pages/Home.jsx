import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Common/Button";
import { SiteContentContext } from "../contexts/SiteContentContext";
import api from "../utils/api";
import useCart from "../hooks/useCart";
// toast removed
import Image from "../components/Common/Image";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { homePageData, loadingHomePage: loadingHome } =
    useContext(SiteContentContext);
  const { addToCart } = useCart();

  // Handle add to cart
  const handleAddToCart = (product) => {
    // Get default size and color from product variants if available
    let defaultSize = null;
    let defaultColor = null;
    let variantSku = null;

    // Check if product has variants with size and color attributes
    if (
      product.variants &&
      Array.isArray(product.variants) &&
      product.variants.length > 0
    ) {
      // Find first variant that has stock
      const inStockVariant = product.variants.find((v) => v.stock > 0);

      if (inStockVariant && inStockVariant.attributes) {
        defaultSize = inStockVariant.attributes.size || null;
        defaultColor = inStockVariant.attributes.color || null;
        variantSku = inStockVariant.sku || null;
      }
    }

    // If no size found from variants but product has sizes array, use first size
    if (
      !defaultSize &&
      product.sizes &&
      Array.isArray(product.sizes) &&
      product.sizes.length > 0
    ) {
      defaultSize = product.sizes[0];
    }

    // Add to cart with size and color information
    addToCart(
      {
        id: product._id || product.id,
        _id: product._id || product.id,
        name: product.name || product.title,
        title: product.name || product.title,
        price: product.mrp,
        slug: product.slug,
        image:
          product.image ||
          (product.images && product.images.length > 0
            ? product.images[0]
            : ""),
        quantity: 1,
        size: defaultSize,
        color: defaultColor,
        variantSku: variantSku,
      },
      1,
      defaultSize,
      defaultColor
    );

    // Product added to cart
  };

  // State for latest products
  const [latestProducts, setLatestProducts] = useState([]);
  const [loadingLatestProducts, setLoadingLatestProducts] = useState(false);

  // State for most purchased products
  const [mostPurchasedProducts, setMostPurchasedProducts] = useState([]);
  const [loadingMostPurchasedProducts, setLoadingMostPurchasedProducts] =
    useState(false);

  // State for selected sizes in Most Purchased Products
  const [selectedSizes, setSelectedSizes] = useState({});

  // Function to get MRP for selected size
  const getMRPForSize = (product, selectedSize) => {
    if (!product.variants || product.variants.length === 0) {
      return product.mrp || product.originalPrice;
    }
    
    // If no size is selected, use the first available size
    const sizeToUse = selectedSize || (product.sizes && product.sizes[0]);
    
    if (!sizeToUse) {
      return product.mrp || product.originalPrice;
    }
    
    const variant = product.variants.find(
      (v) => v.attributes && v.attributes.size === sizeToUse
    );
    
    const mrp = variant
      ? variant.mrp || variant.compareAtPrice 
      : product.mrp || product.originalPrice;
    
    return mrp;
  };

  // Function to handle size selection
  const handleSizeSelect = (productId, size) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: size
    }));
  };

  // State for debugging promotional banners
  const [bannerDebug, setBannerDebug] = useState({});

  // Process blocks data from homePageData
  const [summerFestiveBanner, setSummerFestiveBanner] = useState({});
  const [workAnywhereBanner, setWorkAnywhereBanner] = useState({});
  const [festivalBanner, setFestivalBanner] = useState({});
  const [readySetSummerBanner, setReadySetSummerBanner] = useState({});
  const [playfulFloralsBanner, setPlayfulFloralsBanner] = useState({});
  const [plusSizeCollectionsBanner, setPlusSizeCollectionsBanner] = useState(
    {}
  );

  const processHomePageBlocks = () => {
    if (
      !homePageData ||
      !homePageData.blocks ||
      !Array.isArray(homePageData.blocks)
    ) {
      return {
        heroSection: null,
        categories: [],
        featuredProducts: [],
        summerFestiveBannerData: {},
        workAnywhereBannerData: {},
        readySetSummerBannerData: {},
        playfulFloralsBannerData: {},
        plusSizeCollectionsBannerData: {},
        festivalBannerData: {},
        newsletter: {},
      };
    }

    // Find hero section block
    const heroSectionBlock = homePageData.blocks.find(
      (block) => block.blockType === "hero_section"
    );

    // Find shop by category block
    const categoryBlock = homePageData.blocks.find(
      (block) => block.blockType === "shop_by_category"
    );

    // Find featured products block
    const featuredProductsBlock = homePageData.blocks.find(
      (block) => block.blockType === "featured_products"
    );

    // Find promotional banner blocks
    const promotionalBanners = homePageData.blocks.filter(
      (block) => block.blockType === "promotional_banner"
    );

    // Find newsletter signup block
    const newsletterBlock = homePageData.blocks.find(
      (block) => block.blockType === "newsletter_signup"
    );

    // Extract specific promotional banners by order or other identifiers
    const summerFestiveBlock = promotionalBanners.find(
      (banner) => banner.headline?.includes("Summer") || banner.order === 3
    );

    const workAnywhereBlock = promotionalBanners.find(
      (banner) => banner.headline?.includes("Work") || banner.order === 4
    );

    const readySetSummerBlock = promotionalBanners.find(
      (banner) => banner.headline?.includes("Dresses") || banner.order === 6
    );

    const playfulFloralsBlock = promotionalBanners.find(
      (banner) => banner.headline?.includes("Playful") || banner.order === 7
    );

    const plusSizeCollectionsBlock = promotionalBanners.find(
      (banner) => banner.headline?.includes("Inclusive") || banner.order === 8
    );

    const festivalBlock = promotionalBanners.find(
      (banner) => banner.headline?.includes("Festival") || banner.order === 5
    );

    return {
      heroSection: heroSectionBlock,
      categories: categoryBlock?.categories || [],
      featuredProducts: featuredProductsBlock?.products || [],
      featuredProductsBlock,
      summerFestiveBannerData: summerFestiveBlock || {},
      workAnywhereBannerData: workAnywhereBlock || {},
      readySetSummerBannerData: readySetSummerBlock || {},
      playfulFloralsBannerData: playfulFloralsBlock || {},
      plusSizeCollectionsBannerData: plusSizeCollectionsBlock || {},
      festivalBannerData: festivalBlock || {},
      newsletter: newsletterBlock || {},
    };
  };

  // State for newsletter subscription
  const [emailInput, setEmailInput] = useState("");
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  // State for processed data
  const [heroSection, setHeroSection] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredProductsBlock, setFeaturedProductsBlock] = useState(null);
  const [newsletter, setNewsletter] = useState({});

  // Hero section images
  const [heroImages, setHeroImages] = useState([]);
  const [mobileHeroImages, setMobileHeroImages] = useState([]);

  // Process home page data
  useEffect(() => {
    if (
      !homePageData ||
      !homePageData.blocks ||
      !Array.isArray(homePageData.blocks)
    ) {
      return;
    }

    // Process blocks data
    const processedData = processHomePageBlocks();

    // Set state with processed data
    setHeroSection(processedData.heroSection);
    setCategories(processedData.categories);
    setFeaturedProducts(processedData.featuredProducts);
    setFeaturedProductsBlock(processedData.featuredProductsBlock);
    setNewsletter(processedData.newsletter);

    // Update hero images
    if (processedData.heroSection) {
      // Check if we have slides array (new format) or use legacy format
      if (
        processedData.heroSection.slides &&
        Array.isArray(processedData.heroSection.slides) &&
        processedData.heroSection.slides.length > 0
      ) {
        // New format with slides
        const desktopImages = processedData.heroSection.slides.map((slide) => {
          // Check for desktop_image first, then background_image
          return slide.desktop_image && slide.desktop_image.url
            ? slide.desktop_image.url
            : slide.background_image && slide.background_image.url
              ? slide.background_image.url
              : "https://placehold.co/1920x1080?text=No+Image";
        });

        const mobileImages = processedData.heroSection.slides.map((slide) => {
          // Check for mobile_image, mobile_background_image, desktop_image, and background_image in that order
          return slide.mobile_image && slide.mobile_image.url
            ? slide.mobile_image.url
            : slide.mobile_background_image && slide.mobile_background_image.url
              ? slide.mobile_background_image.url
              : slide.desktop_image && slide.desktop_image.url
                ? slide.desktop_image.url
                : slide.background_image && slide.background_image.url
                  ? slide.background_image.url
                  : "https://placehold.co/800x1200?text=No+Image";
        });

        setHeroImages(desktopImages);
        setMobileHeroImages(mobileImages);
      } else if (processedData.heroSection.background_image?.url) {
        // Legacy format with single image
        const images = [processedData.heroSection.background_image.url];
        setHeroImages(images);

        // Use mobile image if available, otherwise use desktop
        if (processedData.heroSection.mobile_background_image?.url) {
          setMobileHeroImages([
            processedData.heroSection.mobile_background_image.url,
          ]);
        } else {
          setMobileHeroImages(images);
        }
      } else {
        // Fallback if no images are found
        setHeroImages(["https://placehold.co/1920x1080?text=No+Image"]);
        setMobileHeroImages([
          "https://placehold.co/800x1200?text=No+Image",
        ]);
      }
    } else {
      // Fallback if no hero section is found
      setHeroImages(["https://placehold.co/1920x1080?text=No+Image"]);
      setMobileHeroImages([
        "https://placehold.co/800x1200?text=No+Image",
      ]);
    }

    // Process banner images for easier access
    if (
      processedData.summerFestiveBannerData &&
      processedData.summerFestiveBannerData.banner_image
    ) {
      setSummerFestiveBanner({
        ...processedData.summerFestiveBannerData,
        desktopImage: processedData.summerFestiveBannerData.banner_image.url,
        mobileImage: processedData.summerFestiveBannerData.banner_image.url,
        alt:
          processedData.summerFestiveBannerData.banner_image.alt ||
          "Summer Collection",
      });
    }

    if (
      processedData.workAnywhereBannerData &&
      processedData.workAnywhereBannerData.banner_image
    ) {
      setWorkAnywhereBanner({
        ...processedData.workAnywhereBannerData,
        desktopImage: processedData.workAnywhereBannerData.banner_image.url,
        mobileImage: processedData.workAnywhereBannerData.banner_image.url,
        alt:
          processedData.workAnywhereBannerData.banner_image.alt ||
          "Work Collection",
      });
    }

    if (
      processedData.festivalBannerData &&
      processedData.festivalBannerData.banner_image
    ) {
      setFestivalBanner({
        ...processedData.festivalBannerData,
        desktopImage: processedData.festivalBannerData.banner_image.url,
        mobileImage: processedData.festivalBannerData.banner_image.url,
        alt:
          processedData.festivalBannerData.banner_image.alt ||
          "Festival Collection",
      });
    }

    if (
      processedData.readySetSummerBannerData &&
      processedData.readySetSummerBannerData.banner_image
    ) {
      setReadySetSummerBanner({
        ...processedData.readySetSummerBannerData,
        desktopImage: processedData.readySetSummerBannerData.banner_image.url,
        mobileImage: processedData.readySetSummerBannerData.banner_image.url,
        alt:
          processedData.readySetSummerBannerData.banner_image.alt ||
          "Summer Dresses Collection",
      });
    }

    if (
      processedData.playfulFloralsBannerData &&
      processedData.playfulFloralsBannerData.banner_image
    ) {
      setPlayfulFloralsBanner({
        ...processedData.playfulFloralsBannerData,
        desktopImage: processedData.playfulFloralsBannerData.banner_image.url,
        mobileImage: processedData.playfulFloralsBannerData.banner_image.url,
        alt:
          processedData.playfulFloralsBannerData.banner_image.alt ||
          "Floral Collection",
      });
    }

    if (
      processedData.plusSizeCollectionsBannerData &&
      processedData.plusSizeCollectionsBannerData.banner_image
    ) {
      setPlusSizeCollectionsBanner({
        ...processedData.plusSizeCollectionsBannerData,
        desktopImage:
          processedData.plusSizeCollectionsBannerData.banner_image.url,
        mobileImage:
          processedData.plusSizeCollectionsBannerData.banner_image.url,
        alt:
          processedData.plusSizeCollectionsBannerData.banner_image.alt ||
          "Plus Size Collection",
      });
    }

    // Update banner debug flags - set all to false to hide debug info
    setBannerDebug((prev) => ({
      ...prev,
      blocks: homePageData.blocks,
      summerFestive: false,
      workAnywhere: false,
      festival: false,
      readySetSummer: false,
      playfulFlorals: false,
      plusSizeCollections: false,
    }));
  }, [homePageData]);

  // Fetch latest products
  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        setLoadingLatestProducts(true);
        // Fetch latest products (newest first, limit to 12 to ensure we have enough with videos)
        const response = await api.get(
          "/products?sort=createdAt&order=desc&limit=12"
        );
        if (response.data.success) {
          // Transform backend data to match frontend format if needed
          const allProducts = response.data.data.products.map((product) => ({
            id: product._id,
            _id: product._id,
            title: product.title,
            description: product.description,
            category: product.category?.name || "Uncategorized",
            mrp:
              product.variants && product.variants.length > 0
                ? product.variants[0].price
                : 0,
            originalPrice:
              product.variants && product.variants.length > 0
                ? product.variants[0].compareAtPrice ||
                  product.variants[0].price
                : 0,
            image:
              product.images && product.images.length > 0
                ? product.images[0]
                : "https://placehold.co/400x500",
            video: product.video || null, // Include video field
            slug: product.slug || product._id,
            rating: 4.5, // Default rating
            // Extract unique sizes from variants
            sizes: product.variants
              ? [
                  ...new Set(
                    product.variants
                      .filter((v) => v.attributes && v.attributes.size)
                      .map((v) => v.attributes.size)
                  ),
                ]
              : [],
            // Extract unique colors from variants
            colors: product.variants
              ? [
                  ...new Set(
                    product.variants
                      .filter((v) => v.attributes && v.attributes.color)
                      .map((v) => v.attributes.color)
                  ),
                ]
              : [],
            // Store the variants array for later use
            variants: product.variants || [],
          }));
          
          // Filter products to only include those with videos
          const productsWithVideos = allProducts.filter(product => product.video);
          
          // If we have products with videos, use those, otherwise fallback to all products
          setLatestProducts(productsWithVideos.length > 0 ? productsWithVideos.slice(0, 6) : allProducts.slice(0, 6));
        }
      } catch (error) {
        // Error handling for latest products fetch
      } finally {
        setLoadingLatestProducts(false);
      }
    };

    fetchLatestProducts();
  }, []);

  // Fetch most purchased products for Featured Products section
  useEffect(() => {
    const fetchMostPurchasedProducts = async () => {
      try {
        setLoadingMostPurchasedProducts(true);

        // First, get all orders to analyze purchase frequency
        const ordersResponse = await api.get("/orders?limit=1000");

        if (
          !ordersResponse ||
          !ordersResponse.data ||
          !ordersResponse.data.data ||
          !ordersResponse.data.data.orders
        ) {
          throw new Error("Invalid orders API response structure");
        }

        const orders = ordersResponse.data.data.orders;

        // Create a map to count product purchases
        const productPurchaseCounts = {};

        // Count how many times each product has been purchased
        orders.forEach((order) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              if (item.productId) {
                const productId =
                  typeof item.productId === "object"
                    ? item.productId._id
                    : item.productId;

                if (productId) {
                  // Initialize or increment the count and add the quantity
                  if (!productPurchaseCounts[productId]) {
                    productPurchaseCounts[productId] = {
                      count: 0,
                      qty: 0,
                    };
                  }
                  productPurchaseCounts[productId].count += 1;
                  productPurchaseCounts[productId].qty += item.qty || 1;
                }
              }
            });
          }
        });

        // Get the product IDs sorted by purchase count
        const sortedProductIds = Object.keys(productPurchaseCounts).sort(
          (a, b) => {
            return productPurchaseCounts[b].qty - productPurchaseCounts[a].qty;
          }
        );

        // If we have no purchase data, fetch regular products
        if (sortedProductIds.length === 0) {
          // Fallback to regular products
          const response = await api.get("/products?limit=6");
          if (response.data.success) {
            const products = response.data.data.products.map((product) => ({
              id: product._id,
              _id: product._id,
              name: product.title,
              description: product.description,
              category: product.category?.name || "Uncategorized",
              price:
                product.variants && product.variants.length > 0
                  ? product.variants[0].price
                  : '',
              originalPrice:
                product.variants && product.variants.length > 0
                  ? product.variants[0].compareAtPrice ||
                    product.variants[0].price
                  : '',
              mrp:
                product.variants && product.variants.length > 0
                  ? product.variants[0].compareAtPrice ||
                    product.variants[0].price
                  : '',
              image:
                product.images && product.images.length > 0
                  ? product.images[0]
                  : "https://placehold.co/400x500",
              slug: product.slug || product._id,
              rating: 4.8,
              sizes: product.variants
                ? [
                    ...new Set(
                      product.variants
                        .filter((v) => v.attributes && v.attributes.size)
                        .map((v) => v.attributes.size)
                    ),
                  ]
                : [],
              // Extract unique colors from variants
              colors: product.variants
                ? [
                    ...new Set(
                      product.variants
                        .filter((v) => v.attributes && v.attributes.color)
                        .map((v) => v.attributes.color)
                    ),
                  ]
                : [],
              // Store the variants array for later use
              variants: product.variants || [],
            }));
            setMostPurchasedProducts(products);
          }
          return;
        }

        // Limit to top 6 most purchased products
        const topProductIds = sortedProductIds.slice(0, 6);

        // Now fetch the actual product details for these IDs
        const productsResponse = await api.get("/products?limit=100");

        if (
          !productsResponse ||
          !productsResponse.data ||
          !productsResponse.data.data ||
          !productsResponse.data.data.products
        ) {
          throw new Error("Invalid products API response structure");
        }

        const allProducts = productsResponse.data.data.products;

        // Filter to only include the top purchased products
        const topProducts = allProducts.filter((product) =>
          topProductIds.includes(product._id)
        );

        // Sort them by purchase count
        const sortedProducts = topProducts.sort((a, b) => {
          const aCount = productPurchaseCounts[a._id]?.qty || 0;
          const bCount = productPurchaseCounts[b._id]?.qty || 0;
          return bCount - aCount;
        });

        // Transform backend data to match frontend format
        const products = sortedProducts.map((product) => ({
          id: product._id,
          _id: product._id,
          name: product.title,
          description: product.description,
          category: product.category?.name || "Uncategorized",
          price:
            product.variants && product.variants.length > 0
              ? product.variants[0].price
              : '',
          originalPrice:
            product.variants && product.variants.length > 0
              ? product.variants[0].compareAtPrice || product.variants[0].price
              : '',
          mrp:
            product.variants && product.variants.length > 0
              ? product.variants[0].compareAtPrice || product.variants[0].price
              : '',
          image:
            product.images && product.images.length > 0
              ? product.images[0]
              : "https://placehold.co/400x500",
          slug: product.slug || product._id,
          rating: 4.8, // Slightly higher rating for featured products
          // Extract unique sizes from variants
          sizes: product.variants
            ? [
                ...new Set(
                  product.variants
                    .filter((v) => v.attributes && v.attributes.size)
                    .map((v) => v.attributes.size)
                ),
              ]
            : [],
          // Extract unique colors from variants
          colors: product.variants
            ? [
                ...new Set(
                  product.variants
                    .filter((v) => v.attributes && v.attributes.color)
                    .map((v) => v.attributes.color)
                ),
              ]
            : [],
          // Store the variants array for later use
          variants: product.variants || [],
        }));

        setMostPurchasedProducts(products);
      } catch (error) {
        // Fallback to regular products in case of error
        try {
          const response = await api.get("/products?limit=6");
          if (response.data.success) {
            const products = response.data.data.products.map((product) => ({
              id: product._id,
              _id: product._id,
              name: product.title,
              description: product.description,
              category: product.category?.name || "Uncategorized",
              price:
                product.variants && product.variants.length > 0
                  ? product.variants[0].price
                  : 0,
              originalPrice:
                product.variants && product.variants.length > 0
                  ? product.variants[0].compareAtPrice ||
                    product.variants[0].price
                  : 0,
              mrp:
                product.variants && product.variants.length > 0
                  ? product.variants[0].compareAtPrice ||
                    product.variants[0].price
                  : 0,
              image:
                product.images && product.images.length > 0
                  ? product.images[0]
                  : "https://placehold.co/400x500",
              slug: product.slug || product._id,
              rating: 4.8,
              sizes: product.variants
                ? [
                    ...new Set(
                      product.variants
                        .filter((v) => v.attributes && v.attributes.size)
                        .map((v) => v.attributes.size)
                    ),
                  ]
                : [],
              // Extract unique colors from variants
              colors: product.variants
                ? [
                    ...new Set(
                      product.variants
                        .filter((v) => v.attributes && v.attributes.color)
                        .map((v) => v.attributes.color)
                    ),
                  ]
                : [],
              // Store the variants array for later use
              variants: product.variants || [],
            }));
            setMostPurchasedProducts(products);
          }
        } catch (fallbackError) {
          // Error handling for fallback fetch
        }
      } finally {
        setLoadingMostPurchasedProducts(false);
      }
    };

    fetchMostPurchasedProducts();
  }, []);

  // Slide change logic - static implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (heroSection?.slides && heroSection.slides.length > 0) {
        setCurrentSlide((prev) =>
          prev === heroSection.slides.length - 1 ? 0 : prev + 1
        );
      } else if (heroImages.length > 0) {
        setCurrentSlide((prev) =>
          prev === heroImages.length - 1 ? 0 : prev + 1
        );
      }
    }, 5000);

    // Cleanup function
    return () => clearTimeout(timer);
  }, [currentSlide, heroImages.length, heroSection?.slides]);

  // Animation variants for staggered animations
  // Note: These are already defined at the top of the file, so we don't need to redefine them

  // Debug effect to log banner state

  // Handle manual slide navigation
  const goToSlide = (index) => {
    if (
      index >= 0 &&
      ((heroSection?.slides && index < heroSection.slides.length) ||
        (heroImages.length > 0 && index < heroImages.length))
    ) {
      setCurrentSlide(index);
    }
  };

  // Handle next slide
  const nextSlide = () => {
    if (heroSection?.slides && heroSection.slides.length > 0) {
      setCurrentSlide((prev) =>
        prev === heroSection.slides.length - 1 ? 0 : prev + 1
      );
    } else if (heroImages.length > 0) {
      setCurrentSlide((prev) =>
        prev === heroImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Handle previous slide
  const prevSlide = () => {
    if (heroSection?.slides && heroSection.slides.length > 0) {
      setCurrentSlide((prev) =>
        prev === 0 ? heroSection.slides.length - 1 : prev - 1
      );
    } else if (heroImages.length > 0) {
      setCurrentSlide((prev) =>
        prev === 0 ? heroImages.length - 1 : prev - 1
      );
    }
  };

  // Handle newsletter submission
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the email to your API
    // Show success message
    setSubscriptionSuccess(true);
    // Reset form
    setEmailInput("");
  };

  return (
    <div>
      {/* Hero Section with Slider */}
      <section className="relative h-[50vh] md:h-screen overflow-hidden">
        {heroSection?.slides && heroSection.slides.length > 0 ? (
          <>
            <AnimatePresence initial={false}>
              <motion.div
                key={currentSlide}
                className="absolute inset-0 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              >
                <picture>
                  <source
                    media="(max-width: 767px)"
                    srcSet={mobileHeroImages[currentSlide]}
                  />
                  <img
                    src={heroImages[currentSlide]}
                    alt={
                      heroSection.slides[currentSlide]?.desktop_image?.alt ||
                      heroSection.slides[currentSlide]?.background_image?.alt ||
                      `Fashion collection slide ${currentSlide + 1}`
                    }
                    className="w-full h-full object-cover object-top md:object-center"
                  />
                </picture>

                {/* Hero Content Overlay */}
                <div
                  className={`absolute inset-0 ${heroSection.slides[currentSlide]?.overlay_style === "light" ? "bg-white/30" : "bg-black/30"} flex items-center justify-center`}
                >
                  <div className="text-center text-white max-w-4xl px-4">
                    {heroSection.slides[currentSlide]?.headline && (
                      <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4">
                        {heroSection.slides[currentSlide].headline}
                      </h1>
                    )}
                    {heroSection.slides[currentSlide]?.subheadline && (
                      <p className="text-base md:text-xl mb-4 md:mb-8">
                        {heroSection.slides[currentSlide].subheadline}
                      </p>
                    )}
                    {heroSection.slides[currentSlide]?.cta_text && (
                      <Link
                        to={
                          heroSection.slides[currentSlide].cta_link || "/shop"
                        }
                      >
                        <Button
                          variant="primary"
                          className="text-black hover:bg-gray-200"
                        >
                          {heroSection.slides[currentSlide].cta_text ||
                            "Shop Now"}
                        </Button>
                      </Link>
                    )}
                  </div>
                  </div>
                    </motion.div>
             
            </AnimatePresence>

            {/* Navigation arrows - Only show if there are multiple slides */}
            {heroSection.slides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1 md:p-2 rounded-full backdrop-blur-sm transition-colors"
                  aria-label="Previous slide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-6 md:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-1 md:p-2 rounded-full backdrop-blur-sm transition-colors"
                  aria-label="Next slide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-6 md:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Slide indicators - Only show if there are multiple slides */}
                <div className="absolute bottom-3 md:bottom-6 left-0 right-0 z-20 flex justify-center gap-1 md:gap-2">
                  {heroSection.slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors ${currentSlide === index ? "bg-white" : "bg-white/40"}`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                {/* Debug info - remove in production */}
              </>
            )}
          </>
        ) : (
          // Legacy format or fallback
          <div className="flex items-center justify-center h-full bg-gray-200">
            <div className="text-center text-gray-600 max-w-4xl px-4">
              {heroSection?.headline && (
                <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4">
                  {heroSection.headline}
                </h1>
              )}
              {heroSection?.subheadline && (
                <p className="text-base md:text-xl mb-4 md:mb-8">
                  {heroSection.subheadline}
                </p>
              )}
              {heroSection?.cta && (
                <Link to={heroSection.cta.url || "/shop"}>
                  <Button
                    variant="primary"
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {heroSection.cta.label || "Shop Now"}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
      {/* Categories Section */}
      <section className="w-full py-4 bg-white">
        <div className="container-fluid mx-auto px-0">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 md:mb-8">
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0">
            {categories.map((category, index) => (
              <div
                key={index}
                className="relative overflow-hidden h-[350px] md:h-[500px] lg:h-[700px] group"
              >

                {category.media_type === "video" &&
                category.video &&
                category.video.video_url ? (
                  <>
                    <video
                      src={category.video.video_url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </>
                ) : (
                  <img
                    src={category.image?.url}
                    alt={category.image?.alt || `Category ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col justify-end p-4 md:p-6">
                  <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-4 uppercase tracking-wider text-center">
                    {category.label}
                  </h3>
                  <Link to="/shop" className="text-white text-center">
                    Shop Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Products Section - Slider */}
      <section className="py-10 md:py-14 lg:py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-6 md:mb-8 lg:mb-10 text-center">
            Latest Arrivals
          </h2>
          {loadingLatestProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl xs:rounded-2xl overflow-hidden shadow animate-pulse"
                >
                  <div className="h-64 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Slider Navigation Buttons */}
              <button 
                onClick={() => document.querySelector('.latest-arrivals-slider').scrollBy({left: -300, behavior: 'smooth'})} 
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md -ml-4 hidden md:flex items-center justify-center"
                aria-label="Previous slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                onClick={() => document.querySelector('.latest-arrivals-slider').scrollBy({left: 300, behavior: 'smooth'})} 
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md -mr-4 hidden md:flex items-center justify-center"
                aria-label="Next slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <motion.div 
                className="latest-arrivals-slider flex overflow-x-auto pb-5 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {latestProducts && latestProducts.length > 0 ? (
                  latestProducts.map((product, index) => {
                  // Calculate discount percentage if applicable
                  const discountPercentage =
                    product.originalPrice &&
                    product.mrp < product.originalPrice
                      ? Math.round(
                          ((product.originalPrice - product.mrp) /
                            product.originalPrice) *
                            100
                        )
                      : 0;

                  return (
                    <motion.div
                      key={product.id || index}
                      className="group relative rounded-xl xs:rounded-2xl border border-gray-100 bg-white shadow transition-all hover:shadow-lg overflow-hidden flex-shrink-0 snap-start w-[280px] sm:w-[320px] md:w-[350px] mx-2"
                      variants={itemVariants}
                    >
                      {/* Discount Tag */}
                      {discountPercentage > 0 && (
                        <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                          {discountPercentage}% OFF
                        </div>
                      )}
                      <button
                        className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                        aria-label="Add to wishlist"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 xs:h-5 xs:w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>

                      {/* Product Image/Video Container */}
                      <div className="relative overflow-hidden">
                        <Link
                          to={`/product/${product.slug || product.id}`}
                          className="block"
                        >
                          {product.video ? (
                            <div className="w-full h-56 xs:h-64 sm:h-72 md:h-80 overflow-hidden">
                              <video
                                src={product.video}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                              />
                            </div>
                          ) : (
                            <Image
                              src={product.image}
                              alt={product.title || "Product Image"}
                              fallbackSrc="/image_default.png"
                              className="w-full h-56 xs:h-64 sm:h-72 md:h-80 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                              loading="lazy"
                            />
                          )}

                          {/* Product Image Overlay with subtle gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                        </Link>
                      </div>

                      {/* Product Info */}
                      <div className="p-3 xs:p-4 sm:p-5">
                        {/* Title and Rating */}
                        <div className="flex justify-between items-start mb-2.5">
                          <Link
                            to={`/product/${product.slug || product.id}`}
                            className="block flex-1"
                          >
                            <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">
                              {product.title}
                            </h3>
                          </Link>

                          {/* Rating Stars */}
                          {product.rating && (
                            <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-[10px] xs:text-xs font-medium text-java-800">
                                {product.rating}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Category Tag */}
                        {product.category && (
                          <div className="mb-2">
                            <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full capitalize border border-gray-100">
                              {product.category}
                            </span>
                          </div>
                        )}

                        {/* Price section with improved styling */}
         
                        {/* Available Sizes */}
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="mt-1">
                            <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">
                              AVAILABLE SIZES:
                            </p>
                            <div className="flex flex-wrap gap-1 xs:gap-1.5">
                              {product.sizes.map((size, sizeIndex) => {
                                // Find variant with this size to get its MRP
                                const sizeVariant = product.variants && product.variants.find(
                                  v => v.attributes && v.attributes.size === size
                                );
                                
                                return (
                                  <span
                                    key={sizeIndex}
                                    className="inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-java-50 hover:border-java-200 transition-all cursor-pointer"
                                    onClick={() => {
                                      // Update the product's displayed MRP based on selected size
                                      const updatedProduct = {...product};
                                      if (sizeVariant && sizeVariant.mrp) {
                                        updatedProduct.mrp = sizeVariant.mrp;
                                      }
                                      // Force re-render by updating the state
                                      const updatedLatestProducts = [...latestProducts];
                                      updatedLatestProducts[latestProducts.findIndex(p => p._id === product._id)] = updatedProduct;
                                      setLatestProducts(updatedLatestProducts);
                                    }}
                                  >
                                    {size}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* View Product Button */}
                        <Link
                          to={`/product/${product.slug}`}
                          className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 xs:h-4 xs:w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View Product
                        </Link>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                // Fallback content when no products are available
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500">
                    No products available in this section.
                  </p>
                </div>
              )}
            </motion.div>
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/shop">
              <Button variant="secondary">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Work Anywhere Banner */}
      <section className="work-anywhere-banner py-16">
        <div className="container mx-auto px-4">
          {bannerDebug.workAnywhere && (
            <div className="bg-yellow-100 p-4 mb-4 rounded">
              <p className="font-mono text-sm">
                Debug: {JSON.stringify(workAnywhereBanner, null, 2)}
              </p>
            </div>
          )}

          {workAnywhereBanner && workAnywhereBanner.banner_image ? (
            <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8">
              <div className="md:w-1/2 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  {workAnywhereBanner.headline || "Work From Anywhere"}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  {workAnywhereBanner.subheadline ||
                    "Comfortable yet professional attire for the modern remote worker."}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    to={
                      workAnywhereBanner.cta_link || "/products/category/work"
                    }
                    className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-dark transition duration-300"
                  >
                    {workAnywhereBanner.cta_text || "Shop Work Collection"}
                  </Link>
                </motion.div>
              </div>
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-lg shadow-xl"
                >
                  <picture>
                    <source
                      media="(max-width: 767px)"
                      srcSet={
                        workAnywhereBanner.mobileImage ||
                        workAnywhereBanner.desktopImage
                      }
                    />
                    <img
                      src={workAnywhereBanner.desktopImage}
                      alt={workAnywhereBanner.alt || "Work Collection"}
                      className="w-full h-auto object-cover"
                    />
                  </picture>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8">
              <div className="md:w-1/2 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  Work From Anywhere
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  Comfortable yet professional attire for the modern remote
                  worker.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    to="/products/category/work"
                    className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-dark transition duration-300"
                  >
                    Shop Work Collection
                  </Link>
                </motion.div>
              </div>
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-lg shadow-xl"
                >
                  <img
                    src="/images/banners/work-collection.jpg"
                    alt="Work Collection"
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Festival Banner */}
      <section className="festival-banner py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          {bannerDebug.festival && (
            <div className="bg-yellow-100 p-4 mb-4 rounded">
              <p className="font-mono text-sm">
                Debug: {JSON.stringify(festivalBanner, null, 2)}
              </p>
            </div>
          )}

          {festivalBanner && festivalBanner.banner_image ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/2 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  {festivalBanner.headline || "Festival Season"}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  {festivalBanner.subheadline ||
                    "Stand out with our bold festival collection designed for music lovers and free spirits."}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    to={
                      festivalBanner.cta_link || "/products/category/festival"
                    }
                    className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-dark transition duration-300"
                  >
                    {festivalBanner.cta_text || "Shop Festival Collection"}
                  </Link>
                </motion.div>
              </div>
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-lg shadow-xl"
                >
                  <picture>
                    <source
                      media="(max-width: 767px)"
                      srcSet={
                        festivalBanner.mobileImage ||
                        festivalBanner.desktopImage
                      }
                    />
                    <img
                      src={festivalBanner.desktopImage}
                      alt={festivalBanner.alt || "Festival Collection"}
                      className="w-full h-auto object-cover"
                    />
                  </picture>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/2 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  Festival Season
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  Stand out with our bold festival collection designed for music
                  lovers and free spirits.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    to="/products/category/festival"
                    className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-dark transition duration-300"
                  >
                    Shop Festival Collection
                  </Link>
                </motion.div>
              </div>
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-lg shadow-xl"
                >
                  <img
                    src="/images/banners/festival-collection.jpg"
                    alt="Festival Collection"
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Plus Size Collections Banner Section */}
      <section className="plus-size-collections-banner py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          {bannerDebug.plusSizeCollections && (
            <div className="bg-yellow-100 p-4 mb-4 rounded">
              <p className="font-mono text-sm">
                Debug: {JSON.stringify(plusSizeCollectionsBanner, null, 2)}
              </p>
            </div>
          )}

          {plusSizeCollectionsBanner &&
          plusSizeCollectionsBanner.banner_image ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-lg shadow-xl"
                >
                  <picture>
                    <source
                      media="(max-width: 767px)"
                      srcSet={plusSizeCollectionsBanner.banner_image.url}
                    />
                    <img
                      src={plusSizeCollectionsBanner.banner_image.url}
                      alt={
                        plusSizeCollectionsBanner.banner_image.alt ||
                        "Plus Size Collection"
                      }
                      className="w-full h-auto object-cover"
                    />
                  </picture>
                </motion.div>
              </div>
              <div className="md:w-1/2 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  {plusSizeCollectionsBanner.headline ||
                    "Inclusive Fashion For All"}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  {plusSizeCollectionsBanner.subheadline ||
                    "Our plus size collection celebrates every body with stylish, comfortable pieces designed to make you look and feel amazing."}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    to={
                      plusSizeCollectionsBanner.cta_link ||
                      "/products/category/plus-size"
                    }
                    className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-dark transition duration-300"
                  >
                    {plusSizeCollectionsBanner.cta_text || "Shop Plus Size"}
                  </Link>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/2 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  Inclusive Fashion For All
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  Our plus size collection celebrates every body with stylish,
                  comfortable pieces designed to make you look and feel amazing.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    to="/products/category/plus-size"
                    className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-dark transition duration-300"
                  >
                    Shop Plus Size
                  </Link>
                </motion.div>
              </div>
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-lg shadow-xl"
                >
                  <img
                    src="/images/banners/plus-size-collection.jpg"
                    alt="Plus Size Collection"
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section - Slider */}
      <section className="py-10 md:py-14 lg:py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-6 md:mb-8 lg:mb-10 text-center">
            Most Purchased Products
          </h2>

          {loadingMostPurchasedProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl xs:rounded-2xl overflow-hidden shadow animate-pulse"
                >
                  <div className="h-64 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Slider Navigation Buttons */}
              <button 
                onClick={() => document.querySelector('.most-purchased-slider').scrollBy({left: -300, behavior: 'smooth'})} 
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md -ml-4 hidden md:flex items-center justify-center"
                aria-label="Previous slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                onClick={() => document.querySelector('.most-purchased-slider').scrollBy({left: 300, behavior: 'smooth'})} 
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md -mr-4 hidden md:flex items-center justify-center"
                aria-label="Next slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <motion.div 
                className="most-purchased-slider flex overflow-x-auto pb-5 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
              {mostPurchasedProducts && mostPurchasedProducts.length > 0 ? (
                mostPurchasedProducts.map((product) => {
                  // Calculate discount percentage if applicable
                  const discountPercentage = product.originalPrice
                    ? Math.round(
                        ((product.originalPrice - product.mrp) /
                          product.originalPrice) *
                          100
                      )
                    : 0;

                  return (
                    <motion.div
                      key={product.id}
                      className="group relative rounded-xl xs:rounded-2xl border border-gray-100 bg-white shadow transition-all hover:shadow-lg overflow-hidden flex-shrink-0 snap-start w-[280px] sm:w-[320px] md:w-[350px] mx-2"
                      variants={itemVariants}
                    >
                      {/* Discount Tag - Only show if there's a discount */}
                      {discountPercentage > 0 && (
                        <div className="absolute left-1 xs:left-1.5 sm:left-2 top-1 xs:top-1.5 sm:top-2 z-10 rounded-full bg-red-500 px-1 xs:px-1.5 sm:px-2.5 py-0.5 xs:py-0.5 sm:py-1 text-[8px] xs:text-[10px] sm:text-xs font-bold text-white">
                          {discountPercentage}% OFF
                        </div>
                      )}

                      {/* Wishlist Button */}
                      <button
                        className="absolute right-1.5 xs:right-2 top-1.5 xs:top-2 z-10 rounded-full bg-white/80 p-1 xs:p-1.5 text-gray-700 backdrop-blur-sm transition-all hover:bg-java-500 hover:text-white shadow-sm"
                        aria-label="Add to wishlist"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 xs:h-5 xs:w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>

                      {/* Product Image Container */}
                      <div className="relative overflow-hidden">
                        <Link to={`/product/${product.slug}`} className="block">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fallbackSrc="/image_default.png"
                            className="w-full h-56 xs:h-64 sm:h-72 md:h-80 object-cover transition-transform group-hover:scale-105 duration-500 ease-in-out"
                            loading="lazy"
                          />

                          {/* Product Image Overlay with subtle gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
                        </Link>
                      </div>

                      {/* Product Info */}
                      <div className="p-3 xs:p-4 sm:p-5">
                        {/* Title and Rating */}
                        <div className="flex justify-between items-start mb-2.5">
                          <Link
                            to={`/product/${product.slug}`}
                            className="block flex-1"
                          >
                            <h3 className="text-sm xs:text-base md:text-lg font-medium text-gray-800 hover:text-java-500 transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                          </Link>

                          {/* Rating Stars */}
                          <div className="flex items-center bg-gradient-to-r from-java-100 to-java-200 px-1.5 xs:px-2 py-0.5 rounded-full ml-1 xs:ml-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-java-600 mr-0.5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-[10px] xs:text-xs font-medium text-java-800">
                              {product.rating || "4.5"}
                            </span>
                          </div>
                        </div>

                        {/* Category Tag */}
                        <div className="mb-2">
                          <span className="inline-block text-[10px] xs:text-xs bg-gray-50 text-gray-500 px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full capitalize border border-gray-100">
                            {product.category || "Fashion"}
                          </span>
                        </div>


                        {/* Available Sizes or Premium Quality */}
                        {product.sizes ? (
                          <div className="mt-1">
                            <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">
                              AVAILABLE SIZES:
                            </p>
                            <div className="flex flex-wrap gap-1 xs:gap-1.5">
                              {product.sizes.map((size, index) => {
                                const isSelected = selectedSizes[product.id] === size || (!selectedSizes[product.id] && index === 0);
                                return (
                                  <span
                                    key={index}
                                    onClick={() => handleSizeSelect(product.id, size)}
                                    className={`inline-block px-1.5 xs:px-2 py-0.5 text-[10px] xs:text-xs border rounded-full transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-java-500 border-java-500 text-white'
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-java-50 hover:border-java-200'
                                    }`}
                                  >
                                    {size}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <p className="text-[10px] xs:text-xs font-medium text-java-600 mb-0.5 xs:mb-1">
                              PREMIUM QUALITY
                            </p>
                          </div>
                        )}

                        {/* View Product Button */}
                        <Link
                          to={`/product/${product.slug}`}
                          className="w-full mt-3 py-1.5 xs:py-2 px-2 xs:px-3 bg-java-500 text-white text-xs xs:text-sm font-medium rounded-full shadow-sm hover:bg-java-600 flex items-center justify-center gap-1 xs:gap-1.5 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 xs:h-4 xs:w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View Product
                        </Link>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                // Fallback content when no products are available
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500">
                    No products available in this section.
                  </p>
                </div>
              )}
            </motion.div>
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/shop">
              <Button variant="secondary">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Ready Set Summer Banner Section */}
      <section className="ready-set-summer-banner py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          {bannerDebug.readySetSummer && (
            <div className="bg-yellow-100 p-4 mb-4 rounded">
              <p className="font-mono text-sm">
                Debug: {JSON.stringify(readySetSummerBanner, null, 2)}
              </p>
            </div>
          )}

          {readySetSummerBanner && readySetSummerBanner.banner_image ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/2 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  {readySetSummerBanner.headline || "Ready, Set, Summer!"}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  {readySetSummerBanner.subheadline ||
                    "Discover our new collection of summer dresses that will keep you cool and stylish all season long."}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    to={
                      readySetSummerBanner.cta_link ||
                      "/products/category/dresses"
                    }
                    className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-dark transition duration-300"
                  >
                    {readySetSummerBanner.cta_text || "Shop Dresses"}
                  </Link>
                </motion.div>
              </div>
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-lg shadow-xl"
                >
                  <picture>
                    <source
                      media="(max-width: 767px)"
                      srcSet={readySetSummerBanner.banner_image.url}
                    />
                    <img
                      src={readySetSummerBanner.banner_image.url}
                      alt={
                        readySetSummerBanner.banner_image.alt ||
                        "Ready Set Summer Collection"
                      }
                      className="w-full h-auto object-cover"
                    />
                  </picture>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/2 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  Ready, Set, Summer!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  Discover our new collection of summer dresses that will keep
                  you cool and stylish all season long.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    to="/products/category/dresses"
                    className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-dark transition duration-300"
                  >
                    Shop Dresses
                  </Link>
                </motion.div>
              </div>
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-lg shadow-xl"
                >
                  <img
                    src="/images/banners/summer-dresses.jpg"
                    alt="Summer Dresses Collection"
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Playful Florals Banner */}
      <section className="playful-florals-banner py-16">
        <div className="container mx-auto px-4">
          {bannerDebug.playfulFlorals && (
            <div className="bg-yellow-100 p-4 mb-4 rounded">
              <p className="font-mono text-sm">
                Debug: {JSON.stringify(playfulFloralsBanner, null, 2)}
              </p>
            </div>
          )}

          {playfulFloralsBanner && playfulFloralsBanner.banner_image ? (
            <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8">
              <div className="md:w-1/2 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  {playfulFloralsBanner.headline || "Playful Florals"}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  {playfulFloralsBanner.subheadline ||
                    "Embrace the season with our vibrant floral prints that add a touch of nature to your wardrobe."}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    to={
                      playfulFloralsBanner.cta_link ||
                      "/products/category/floral"
                    }
                    className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-dark transition duration-300"
                  >
                    {playfulFloralsBanner.cta_text || "Shop Floral Collection"}
                  </Link>
                </motion.div>
              </div>
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-lg shadow-xl"
                >
                  <picture>
                    <source
                      media="(max-width: 767px)"
                      srcSet={playfulFloralsBanner.banner_image.url}
                    />
                    <img
                      src={playfulFloralsBanner.banner_image.url}
                      alt={
                        playfulFloralsBanner.banner_image.alt ||
                        "Floral Collection"
                      }
                      className="w-full h-auto object-cover"
                    />
                  </picture>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8">
              <div className="md:w-1/2 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  Playful Florals
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  Embrace the season with our vibrant floral prints that add a
                  touch of nature to your wardrobe.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Link
                    to="/products/category/floral"
                    className="inline-block bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-dark transition duration-300"
                  >
                    Shop Floral Collection
                  </Link>
                </motion.div>
              </div>
              <div className="md:w-1/2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-lg shadow-xl"
                >
                  <img
                    src="/images/banners/floral-collection.jpg"
                    alt="Floral Collection"
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section
        className={`py-10 sm:py-12 md:py-16 ${homePageData?.newsletter_signup?.use_teal_background ? "bg-teal" : "bg-gray-100"} ${homePageData?.newsletter_signup?.use_white_text ? "text-white" : "text-gray-800"}`}
      >
        <div className="container-custom px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-2xl md:text-3xl font-heading font-semibold mb-2 sm:mb-3 md:mb-4">
            {homePageData?.newsletter_signup?.headline ||
              (newsletter?.newsletter?.headline || newsletter?.headline) ||
              "Newsletter"}
          </h2>
          <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
            {homePageData?.newsletter_signup?.subtext ||
              (newsletter?.newsletter?.description || newsletter?.description) ||
              "Subscribe to our newsletter for updates."}
          </p>

          {subscriptionSuccess ? (
            <div
              className={`${homePageData?.newsletter_signup?.use_teal_background ? "bg-white text-teal" : "bg-teal text-white"} p-3 sm:p-4 rounded-md max-w-md mx-auto`}
            >
              <p className="text-base sm:text-lg font-medium">
                {homePageData?.newsletter_signup?.success_message ||
                  (newsletter?.newsletter?.success_message) ||
                  "Thank you for subscribing!"}
              </p>
            </div>
          ) : (
            <form
              className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 sm:gap-0 px-4 sm:px-0"
              onSubmit={handleNewsletterSubmit}
            >
              <input
                type="email"
                placeholder={
                  homePageData?.newsletter_signup?.placeholder_text ||
                  (newsletter?.newsletter?.placeholder_text) ||
                  "Your email address"
                }
                className="flex-grow px-3 sm:px-4 py-2 rounded-md sm:rounded-l-md sm:rounded-r-none focus:outline-none text-charcoal"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="rounded-md sm:rounded-l-none sm:rounded-r-md w-full sm:w-auto"
              >
                {homePageData?.newsletter_signup?.button_text ||
                  (newsletter?.newsletter?.button_text || newsletter?.button_text) ||
                  "Subscribe"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;