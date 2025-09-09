import { useState, useEffect, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteContentContext } from "../../contexts/SiteContentContext";
import { toast } from "react-hot-toast";
import Button from "../Common/Button";
import Input from "../Common/Input";
import Spinner from "../Common/Spinner";
import ImageUpload from "../Common/ImageUpload";
import VideoUpload from "../Common/VideoUpload";
import { Tab } from "@headlessui/react";
import {
  PencilIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const SiteContentManagement = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [autosaveTimer, setAutosaveTimer] = useState(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [needsSaving, setNeedsSaving] = useState(false);
  const [lastAutosaved, setLastAutosaved] = useState(null);
  const [newProductId, setNewProductId] = useState("");
  const [newFeaturedProductId, setNewFeaturedProductId] = useState("");
  
  // Constants
  const AUTO_SAVE_DELAY = 3000; // 3 seconds
  
  // Promotional Banner Template
  const promotionalBannerTemplate = {
    blockType: "promotional_banner",
    banner_image: { url: "", alt: "" },
    headline: "New Promotional Banner",
    subheadline: "Add your promotional text here",
    cta_text: "Shop Now",
    cta_link: "/shop",
    align: "left",
    order: 0
  };

  // Get context data
  const {
    // Home Page
    homePageData,
    loadingHomePage,
    homePageError,
    fetchHomePageData,
    updateHomePageData,
    autosaveHomePageData,

    // About Page
    aboutPageData,
    loadingAboutPage,
    aboutPageError,
    fetchAboutPageData,
    updateAboutPageData,
    autosaveAboutPageData,

    // Contact Page
    contactPageData,
    loadingContactPage,
    contactPageError,
    fetchContactPageData,
    updateContactPageData,
    autosaveContactPageData,

    // Footer
    footerData,
    loadingFooter,
    footerError,
    fetchFooterData,
    updateFooterData,
    autosaveFooterData,


  } = useContext(SiteContentContext);

  // Form data state for each entity
  const [homePageForm, setHomePageForm] = useState(null);
  const [aboutPageForm, setAboutPageForm] = useState(null);
  const [contactPageForm, setContactPageForm] = useState(null);
  const [footerForm, setFooterForm] = useState(null);



  // Initialize form data when context data changes
  useEffect(() => {
    if (homePageData) {
      // Create a deep copy with default structure
      const formData = JSON.parse(JSON.stringify(homePageData));

      // Ensure blocks array exists
      if (!formData.blocks) {
        formData.blocks = [];
      }

      // Ensure hero_section block exists
      const heroBlock = formData.blocks.find(block => block.blockType === 'hero_section');
      if (!heroBlock) {
        formData.blocks.push({
          blockType: 'hero_section',
          headline: "",
          subheadline: "",
          cta_text: "",
          cta_link: "",
          overlay_style: "dark",
          slides: [
            {
              headline: "",
              subheadline: "",
              cta_text: "",
              cta_link: "",
              background_image: { url: "", alt: "" },
              mobile_background_image: { url: "", alt: "" }
            }
          ],
          background_image: { url: "", alt: "" }, // For backward compatibility
          order: 1
        });
      } else {
        // Fix any incorrect '[object Object]' array that might be present
        if (heroBlock['[object Object]'] && Array.isArray(heroBlock['[object Object]'])) {
          // console.log("Fixing incorrect [object Object] array in hero section");
          delete heroBlock['[object Object]'];
        }
        
        // Ensure slides array exists
        if (!heroBlock.slides || !Array.isArray(heroBlock.slides)) {
          heroBlock.slides = [
            {
              headline: heroBlock.headline || "",
              subheadline: heroBlock.subheadline || "",
              cta_text: heroBlock.cta_text || "",
              cta_link: heroBlock.cta_link || "",
              background_image: heroBlock.background_image || { url: "", alt: "" },
              mobile_background_image: heroBlock.mobile_background_image || { url: "", alt: "" }
            }
          ];
        }
        
        if (!heroBlock.background_image) {
          heroBlock.background_image = { url: "", alt: "" };
        }
      }

      // Ensure shop_by_category block exists
      const shopByCategoryBlock = formData.blocks.find(block => block.blockType === 'shop_by_category');
      if (!shopByCategoryBlock) {
        formData.blocks.push({
          blockType: 'shop_by_category',
          categories: [],
          order: 2
        });
      }

      // For backward compatibility, also maintain the old structure
      if (!formData.hero_section) {
        formData.hero_section = {
          headline: "",
          subheadline: "",
          cta_text: "",
          cta_link: "",
          overlay_style: "dark",
          background_image: { url: "", alt: "" },
        };
      } else {
        // Ensure nested objects exist
        if (!formData.hero_section.background_image) {
          formData.hero_section.background_image = { url: "", alt: "" };
        }
      }

      // For backward compatibility
      if (!formData.shop_by_category) {
        formData.shop_by_category = {
          categories: [],
        };
      }

      // For backward compatibility
      if (!formData.promotional_banners) {
        formData.promotional_banners = {
          banners: [],
        };
      }
      
      // Ensure newsletter_signup block exists
      const newsletterBlock = formData.blocks.find(block => block.blockType === 'newsletter_signup');
      if (!newsletterBlock) {
        formData.blocks.push({
          blockType: 'newsletter_signup',
          headline: "Newsletter",
          subtext: "Subscribe to our newsletter for updates.",
          button_text: "Subscribe",
          success_message: "Thank you for subscribing!",
          placeholder_text: "Enter your email",
          use_teal_background: true,
          use_white_text: true,
          order: 10
        });
      }

      // console.log("Initialized home page form with data:", formData);
      setHomePageForm(formData);
    } else {
      // If no data is available, fetch it
      fetchHomePageData();
    }
  }, [homePageData, fetchHomePageData]);

  useEffect(() => {
    if (aboutPageData) {
      // Create a deep copy with default structure
      const formData = JSON.parse(JSON.stringify(aboutPageData));

      // Ensure page_header exists with default values
      if (!formData.page_header) {
        formData.page_header = {
          headline: "",
          subheadline: "",
        };
      }

      // Ensure our_story exists with default values
      if (!formData.our_story) {
        formData.our_story = {
          rich_text_story: "",
          side_image: { url: "", alt: "" },
        };
      }

      // Ensure our_values exists with default values
      if (!formData.our_values) {
        formData.our_values = {
          value_cards: [],
        };
      }

      // Ensure meet_our_team exists with default values
      if (!formData.meet_our_team) {
        formData.meet_our_team = {
          team_members: [],
        };
      }

      // Ensure page_header exists with default values
      if (!formData.page_header) {
        formData.page_header = {
          headline: "",
          subheadline: "",
        };
      }

      // console.log("Initialized about page form with data:", formData);
      setAboutPageForm(formData);
    } else {
      // If no data is available, fetch it
      fetchAboutPageData();
    }
  }, [aboutPageData, fetchAboutPageData]);

  useEffect(() => {
    if (contactPageData) {
      // Create a deep copy with default structure
      const formData = JSON.parse(JSON.stringify(contactPageData));

      // Ensure blocks array exists
      if (!formData.blocks || !Array.isArray(formData.blocks)) {
        formData.blocks = [];
      }

      // Ensure page_header block exists with default values
      if (!formData.blocks.find(block => block.blockType === 'page_header')) {
        formData.blocks.push({
          blockType: 'page_header',
          headline: "Contact Us",
          subheadline: "Have a question or feedback? We'd love to hear from you. Fill out the form below and our team will get back to you as soon as possible.",
          background_image: { url: "", alt: "" }
        });
      }

      // Ensure contact_info block exists with default values
      if (!formData.blocks.find(block => block.blockType === 'contact_info')) {
        formData.blocks.push({
          blockType: 'contact_info',
          headline: "Get In Touch",
          general_email: "info@beegetfashion.com",
          support_email: "support@beegetfashion.com",
          phone: "+1 (800) 123-4567",
          business_hours_weekday: "Monday-Friday: 9am-6pm EST",
          business_hours_sat: "Saturday: 10am-4pm EST",
          location_title: "Visit Us",
          location_subtitle: "Headquarters:",
          address_line1: "123 Fashion Avenue",
          address_line2: "Suite 500",
          address_line3: "New York, NY 10001",
          address_line4: "United States",
          map_embed_url: ""
        });
      }



      // Ensure social_links_row block exists with default values
      if (!formData.blocks.find(block => block.blockType === 'social_links_row')) {
        formData.blocks.push({
          blockType: 'social_links_row',
          headline: "Follow Us",
          links: [
            { platform: "Facebook", url: "https://facebook.com", icon: "facebook" },
            { platform: "Instagram", url: "https://instagram.com", icon: "instagram" },
            { platform: "Twitter", url: "https://twitter.com", icon: "twitter" },
            { platform: "LinkedIn", url: "https://linkedin.com", icon: "linkedin" }
          ]
        });
      }

      // console.log("Initialized contact page form with data:", formData);
      setContactPageForm(formData);
    } else {
      // If no data is available, fetch it
      fetchContactPageData();
    }
  }, [contactPageData, fetchContactPageData]);

  useEffect(() => {
    if (footerData) {
      // Create a deep copy with default structure
      const formData = JSON.parse(JSON.stringify(footerData));

      // Ensure brand_info exists with default values
      if (!formData.brand_info) {
        formData.brand_info = {
          name: "Beeget Fashion",
          description: "Modern women's clothing and accessories.",
          copyright_text: "© 2023 Beeget Fashion. All rights reserved.",
        };
      } else {
        // Ensure required fields have values
        if (!formData.brand_info.name) {
          formData.brand_info.name = "Beeget Fashion";
        }
        if (!formData.brand_info.description) {
          formData.brand_info.description = "Modern women's clothing and accessories.";
        }
      }

      // Ensure navigation_columns exists with default values
      if (!formData.navigation_columns || !Array.isArray(formData.navigation_columns) || !formData.navigation_columns.length) {
        formData.navigation_columns = [
          {
            title: "Quick Links",
            links: [],
          },
          {
            title: "Information",
            links: [],
          },
        ];
      }

      // Use socialLinks as the primary storage for social media links
      if (!formData.socialLinks || !Array.isArray(formData.socialLinks)) {
        formData.socialLinks = [];
      }
      
      // Ensure each social link has all required fields
      formData.socialLinks = formData.socialLinks.map(link => ({
        platform: link.platform || "",
        url: link.url || "",
        icon: link.icon || ""
      }));
      
      // Ensure social_links exists for backward compatibility with all required fields
      formData.social_links = formData.socialLinks;
      
      // Ensure each navigation column has links array
      if (Array.isArray(formData.navigation_columns)) {
        formData.navigation_columns.forEach(column => {
          if (!column.links || !Array.isArray(column.links)) {
            column.links = [];
          }
        });
      }
      
      // Ensure quickLinks and informationLinks exist as arrays
      if (!formData.quickLinks || !Array.isArray(formData.quickLinks)) {
        formData.quickLinks = [];
      }
      
      if (!formData.informationLinks || !Array.isArray(formData.informationLinks)) {
        formData.informationLinks = [];
      }

      // Ensure newsletter exists with default values
      if (!formData.newsletter) {
        formData.newsletter = {
          enabled: true,
          headline: "Newsletter",
          description: "Subscribe to our newsletter for updates.",
          button_text: "Subscribe",
          success_message: "Thank you for subscribing!",
        };
      }

      // console.log("Initialized footer form with data:", formData);
      setFooterForm(formData);
    } else {
      // If no data is available, fetch it
      fetchFooterData();
    }
  }, [footerData, fetchFooterData]);



  // Setup autosave timer when editing starts
  useEffect(() => {
    if (isEditing) {
      // Clear any existing timer
      if (autosaveTimer) {
        clearInterval(autosaveTimer);
      }

      // Set new timer for autosave every 30 seconds
      const timer = setInterval(() => {
        handleAutosave();
      }, 30000); // 30 seconds

      setAutosaveTimer(timer);
    } else {
      // Clear timer when editing stops
      if (autosaveTimer) {
        clearInterval(autosaveTimer);
        setAutosaveTimer(null);
      }
    }

    // Cleanup on unmount
    return () => {
      if (autosaveTimer) {
        clearInterval(autosaveTimer);
      }
    };
  }, [
    isEditing,
    activeTab,
    homePageForm,
    aboutPageForm,
    contactPageForm,
    footerForm,
  ]);

  // Handle autosave based on active tab
  const handleAutosave = async () => {
    try {
      if (!isEditing) {
        // console.log("Not in editing mode, skipping autosave");
        return;
      }

      // console.log("Autosave triggered for tab:", activeTab);

      let result;

      switch (activeTab) {
        case "home":
          if (homePageForm) {
            // console.log("Autosaving home page data");
            result = await autosaveHomePageData(homePageForm);
            // console.log(
            //   "Home page autosave result:",
            //   result ? "Success" : "No result"
            // );
            if (result) {
              // We don't update the form here to avoid UI flickering during autosave
              // But we could if needed: setHomePageForm(JSON.parse(JSON.stringify(result)));
            }
          } else {
            // console.warn("No home page form data to autosave");
          }
          break;
        case "about":
          if (aboutPageForm) {
            // console.log("Autosaving about page data");
            result = await autosaveAboutPageData(aboutPageForm);
            // console.log(
            //   "About page autosave result:",
            //   result ? "Success" : "No result"
            // );
            if (result) {
              // We don't update the form here to avoid UI flickering during autosave
              // But we could if needed: setAboutPageForm(JSON.parse(JSON.stringify(result)));
            }
          } else {
            // console.warn("No about page form data to autosave");
          }
          break;
        case "contact":
          if (contactPageForm) {
            // console.log("Autosaving contact page data");
            result = await autosaveContactPageData(contactPageForm);
            // console.log(
            //   "Contact page autosave result:",
            //   result ? "Success" : "No result"
            // );
            if (result) {
              // We don't update the form here to avoid UI flickering during autosave
              // But we could if needed: setContactPageForm(JSON.parse(JSON.stringify(result)));
            }
          } else {
            // console.warn("No contact page form data to autosave");
          }
          break;
        case "footer":
          if (footerForm) {
            // console.log("Autosaving footer data");
            // Create a copy of the footer form for autosave
            const footerFormCopy = JSON.parse(JSON.stringify(footerForm));
            
            // Use the same logic as handleSaveFooter but for autosave
            // Update social_links from socialLinks for backward compatibility
            footerFormCopy.social_links = footerFormCopy.socialLinks || [];
            
            // Ensure each social link has the required fields
            footerFormCopy.social_links = footerFormCopy.social_links.map(link => ({
              platform: link.platform || "",
              url: link.url || "",
              icon: link.icon || ""
            }));
            
            // Ensure navigation_columns is initialized
            if (!footerFormCopy.navigation_columns) {
              footerFormCopy.navigation_columns = [];
            }
            
            // Ensure all required fields are present
            if (!footerFormCopy.quickLinks) footerFormCopy.quickLinks = [];
            if (!footerFormCopy.informationLinks) footerFormCopy.informationLinks = [];
            
            result = await autosaveFooterData(footerFormCopy);
            // console.log(
            //   "Footer autosave result:",
            //   result ? "Success" : "No result"
            // );
            if (result) {
              // We don't update the form here to avoid UI flickering during autosave
              // But we could if needed: setFooterForm(JSON.parse(JSON.stringify(result)));
            }
          } else {
            // console.warn("No footer form data to autosave");
          }
          break;
        default:
          // console.warn("Unknown tab for autosave:", activeTab);
          break;
      }

      if (result) {
        setLastAutosaved(new Date());
        // console.log("Autosave successful, timestamp updated");
        // Don't show toast for autosave to avoid disrupting user experience
      } else {
        // console.warn("Autosave completed but no result returned");
      }
    } catch (error) {
      // console.error("Autosave error:", error);
      // console.error(
      //   "Autosave error details:",
      //   error.response?.data?.error || error.message || "Unknown error"
      // );
      // Don't show toast for autosave errors to avoid disrupting user experience
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      // console.log("Save changes triggered for tab:", activeTab);

      let result;

      switch (activeTab) {
        case "home":
          if (homePageForm) {
            // console.log("Saving home page data:", homePageForm);
            result = await updateHomePageData(homePageForm);
            // console.log("Home page save result:", result);
            if (result) {
              // Update form with the returned data to ensure it's in sync with the server
              setHomePageForm(JSON.parse(JSON.stringify(result)));
              toast.success("Home page updated successfully");
            }
          }
          break;
        case "about":
          if (aboutPageForm) {
            // console.log("Saving about page data:", aboutPageForm);
            result = await updateAboutPageData(aboutPageForm);
            // console.log("About page save result:", result);
            if (result) {
              // Update form with the returned data to ensure it's in sync with the server
              setAboutPageForm(JSON.parse(JSON.stringify(result)));
              toast.success("About page updated successfully");
            }
          }
          break;
        case "contact":
          if (contactPageForm) {
            // console.log("Saving contact page data:", contactPageForm);
            result = await updateContactPageData(contactPageForm);
            // console.log("Contact page save result:", result);
            if (result) {
              // Update form with the returned data to ensure it's in sync with the server
              setContactPageForm(JSON.parse(JSON.stringify(result)));
              toast.success("Contact page updated successfully");
            }
          }
          break;
        case "footer":
          if (footerForm) {
            result = await handleSaveFooter();
            if (result) {
              toast.success("Footer updated successfully");
            }
          }
          break;
        default:
          break;
      }

      // console.log("Save successful, exiting edit mode");
      setIsEditing(false);
    } catch (error) {
      // console.error("Save changes error:", error);
      toast.error(
        "Failed to save changes: " +
          (error.response?.data?.error || error.message || "Unknown error")
      );
    }
  };
  
  // Handle save footer
  const handleSaveFooter = async () => {
    try {
      // console.log("Saving footer data:", footerForm);
      // Create a copy of the footer form to avoid modifying the original
      const footerFormCopy = JSON.parse(JSON.stringify(footerForm));
      
      // Update social_links from socialLinks for backward compatibility
      footerFormCopy.social_links = footerFormCopy.socialLinks || [];
      
      // Ensure each social link has the required fields
      footerFormCopy.social_links = footerFormCopy.social_links.map(link => ({
        platform: link.platform || "",
        url: link.url || "",
        icon: link.icon || ""
      }));
      
      // Ensure navigation_columns is initialized
      if (!footerFormCopy.navigation_columns) {
        footerFormCopy.navigation_columns = [];
      }
      
      // Ensure all required fields are present
      if (!footerFormCopy.quickLinks) footerFormCopy.quickLinks = [];
      if (!footerFormCopy.informationLinks) footerFormCopy.informationLinks = [];
      
      const result = await updateFooterData(footerFormCopy);
      // console.log("Footer save result:", result);
      if (result) {
        // Update form with the returned data to ensure it's in sync with the server
        setFooterForm(JSON.parse(JSON.stringify(result)));
      }
      return result;
    } catch (error) {
      // console.error("Save footer error:", error);
      toast.error(
        "Failed to save footer: " +
          (error.response?.data?.error || error.message || "Unknown error")
      );
      throw error;
    }
  };

  // Handle cancel editing
  const handleCancelEditing = () => {
    // Reset form data to original data using deep copy
    switch (activeTab) {
      case "home":
        if (homePageData) {
          setHomePageForm(JSON.parse(JSON.stringify(homePageData)));
          // console.log("Reset home page form to original data");
        }
        break;
      case "about":
        if (aboutPageData) {
          setAboutPageForm(JSON.parse(JSON.stringify(aboutPageData)));
          // console.log("Reset about page form to original data");
        }
        break;
      case "contact":
        if (contactPageData) {
          setContactPageForm(JSON.parse(JSON.stringify(contactPageData)));
          // console.log("Reset contact page form to original data");
        }
        break;
      case "footer":
        if (footerData) {
          setFooterForm(JSON.parse(JSON.stringify(footerData)));
          // console.log("Reset footer form to original data");
        }
        break;
      default:
        break;
    }

    setIsEditing(false);
    toast.success("Changes discarded");
  };

  // Handle form field changes
  const handleFormChange = (field, value) => {
    switch (activeTab) {
      case "home":
        setHomePageForm((prev) => {
          if (!prev) return prev; // Guard against null prev
          return {
            ...prev,
            [field]: value,
          };
        });
        break;
      case "about":
        setAboutPageForm((prev) => {
          if (!prev) return prev; // Guard against null prev
          return {
            ...prev,
            [field]: value,
          };
        });
        break;
      case "contact":
        setContactPageForm((prev) => {
          if (!prev) return prev; // Guard against null prev
          return {
            ...prev,
            [field]: value,
          };
        });
        break;
      case "footer":
        setFooterForm((prev) => {
          if (!prev) return prev; // Guard against null prev
          return {
            ...prev,
            [field]: value,
          };
        });
        break;
      default:
        break;
    }

    // Trigger autosave after a short delay
    if (isEditing) {
      clearTimeout(window.autosaveTimeout);
      window.autosaveTimeout = setTimeout(() => {
        handleAutosave();
      }, 2000); // 2 seconds delay
    }
  };

  // Specialized handler for footer nested form changes
  const handleFooterNestedFormChange = (
    section,
    nestedObject,
    field,
    value,
    blockIndex,
    index
  ) => {
    // // console.log(
    //   `handleFooterNestedFormChange called: section=${section}, nestedObject=${nestedObject}, field=${field}, value=${value}, blockIndex=${blockIndex}, index=${index}`
    // );

    // Create a deep copy of the footer form to avoid direct state mutation
    setFooterForm((prev) => {
      if (!prev) return prev; // Guard against null prev
      
      // console.log("Previous footer form state:", prev);
      const updated = JSON.parse(JSON.stringify(prev)); // Deep copy

      // Handle different sections of the footer form
      if (section === "navigation_columns") {
        // Ensure navigation_columns exists
        if (!updated.navigation_columns) {
          updated.navigation_columns = [];
        }

        // If we're updating a specific column
        if (typeof index === "number") {
          // Ensure the column exists
          if (!updated.navigation_columns[index]) {
            updated.navigation_columns[index] = {};
          }
          
          // If nestedObject is "links" and we have a blockIndex, we're updating a link within a column
          if (nestedObject === "links" && typeof blockIndex === "number") {
            // Ensure the links array exists
            if (!updated.navigation_columns[index].links) {
              updated.navigation_columns[index].links = [];
            }
            
            // Ensure the link at blockIndex exists
            if (!updated.navigation_columns[index].links[blockIndex]) {
              updated.navigation_columns[index].links[blockIndex] = {};
            }
            
            // Update the specific link
            updated.navigation_columns[index].links[blockIndex][field] = value;
          } else if (field && field.includes(".")) {
            // Handle dot notation for nested fields
            const fieldParts = field.split(".");
            let current = updated.navigation_columns[index];
            
            // Navigate to the nested object
            for (let i = 0; i < fieldParts.length - 1; i++) {
              const part = fieldParts[i];
              if (!current[part]) {
                current[part] = {};
              }
              current = current[part];
            }
            
            // Set the value on the last part
            current[fieldParts[fieldParts.length - 1]] = value;
          } else {
            // Direct property update
            updated.navigation_columns[index][field] = value;
          }
        }
      } else if (section === "quickLinks") {
        // Ensure quickLinks exists and is an array
        if (!updated.quickLinks || !Array.isArray(updated.quickLinks)) {
          updated.quickLinks = [];
        }
        
        // Update a specific quick link
        if (typeof index === "number") {
          // Ensure the quick link exists
          if (!updated.quickLinks[index]) {
            updated.quickLinks[index] = {};
          }
          
          updated.quickLinks[index][field] = value;
        }
      } else if (section === "informationLinks") {
        // Ensure informationLinks exists and is an array
        if (!updated.informationLinks || !Array.isArray(updated.informationLinks)) {
          updated.informationLinks = [];
        }
        
        // Update a specific information link
        if (typeof index === "number") {
          // Ensure the information link exists
          if (!updated.informationLinks[index]) {
            updated.informationLinks[index] = {};
          }
          
          updated.informationLinks[index][field] = value;
        }
      } else if (section === "socialLinks") {
        // Ensure socialLinks exists
        if (!updated.socialLinks) {
          updated.socialLinks = [];
        }
        
        // Update a specific social link
        if (typeof index === "number") {
          // Ensure the social link exists
          if (!updated.socialLinks[index]) {
            updated.socialLinks[index] = {
              platform: "",
              url: "",
              icon: ""
            };
          }
          
          updated.socialLinks[index][field] = value;
          
          // Ensure all required fields have at least empty string values
          if (!updated.socialLinks[index].platform) updated.socialLinks[index].platform = "";
          if (!updated.socialLinks[index].url) updated.socialLinks[index].url = "";
          if (!updated.socialLinks[index].icon) updated.socialLinks[index].icon = "";
          
          // Also update social_links for backward compatibility
          updated.social_links = updated.socialLinks;
        }
      } else if (section === "newsletter") {
        // Ensure newsletter exists
        if (!updated.newsletter) {
          updated.newsletter = {};
        }
        
        // If the field contains dots, it's a nested property
        if (field && field.includes(".")) {
          const fieldParts = field.split(".");
          let current = updated.newsletter;
          
          // Navigate to the nested object
          for (let i = 0; i < fieldParts.length - 1; i++) {
            const part = fieldParts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
          
          // Set the value on the last part
          current[fieldParts[fieldParts.length - 1]] = value;
        } else {
          // Direct property update
          updated.newsletter[field] = value;
        }
      } else if (section === "brand_info") {
        // Ensure brand_info exists
        if (!updated.brand_info) {
          updated.brand_info = {};
        }
        
        // If the field contains dots, it's a nested property
        if (field && field.includes(".")) {
          const fieldParts = field.split(".");
          let current = updated.brand_info;
          
          // Navigate to the nested object
          for (let i = 0; i < fieldParts.length - 1; i++) {
            const part = fieldParts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
          
          // Set the value on the last part
          current[fieldParts[fieldParts.length - 1]] = value;
        } else {
          // Direct property update
          updated.brand_info[field] = value;
        }
      } else if (section === "blocks") {
        // Special handling for blocks array
        // console.log("Handling blocks special case for footer");
        // Ensure blocks array exists
        if (!updated.blocks) {
          updated.blocks = [];
        }

        // Ensure block at blockIndex exists
        if (blockIndex !== undefined && !updated.blocks[blockIndex]) {
          updated.blocks[blockIndex] = {};
        }

        if (nestedObject && blockIndex !== undefined) {
          // Handle nested object/array within block
          if (!updated.blocks[blockIndex][nestedObject]) {
            updated.blocks[blockIndex][nestedObject] = {};
          }

          if (index !== undefined) {
            // Handle array item within nested object/array
            if (!updated.blocks[blockIndex][nestedObject][index]) {
              updated.blocks[blockIndex][nestedObject][index] = {};
            }

            if (field && field.includes(".")) {
              // Handle dot notation for nested fields
              const [parentField, childField] = field.split(".");
              if (
                !updated.blocks[blockIndex][nestedObject][index][
                  parentField
                ]
              ) {
                updated.blocks[blockIndex][nestedObject][index][
                  parentField
                ] = {};
              }
              updated.blocks[blockIndex][nestedObject][index][parentField][
                childField
              ] = value;
            } else {
              // Simple field in array item
              updated.blocks[blockIndex][nestedObject][index][field] =
                value;
            }
          } else {
            // Simple field in nested object
            updated.blocks[blockIndex][nestedObject][field] = value;
          }
        } else if (blockIndex !== undefined) {
          // Handle background_image special case
          if (field === "background_image" && typeof nestedObject === "string") {
            if (!updated.blocks[blockIndex].background_image) {
              updated.blocks[blockIndex].background_image = {};
            }
            updated.blocks[blockIndex].background_image[nestedObject] = value;
          } 
          // Handle side_image special case
          else if (nestedObject === "side_image") {
            if (!updated.blocks[blockIndex].side_image) {
              updated.blocks[blockIndex].side_image = {};
            }
            updated.blocks[blockIndex].side_image[field] = value;
            // console.log("Updated side_image:", updated.blocks[blockIndex].side_image);
          } else {
            // Simple field in block
            updated.blocks[blockIndex][field] = value;
          }
        }
      } else {
        // For any other direct properties of the footer form
        if (field && field.includes(".")) {
          // Handle dot notation for nested fields
          const fieldParts = field.split(".");
          let current = updated;
          
          // Navigate to the nested object
          for (let i = 0; i < fieldParts.length - 1; i++) {
            const part = fieldParts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }
          
          // Set the value on the last part
          current[fieldParts[fieldParts.length - 1]] = value;
        } else {
          // Direct property update on the root object
          updated[section] = value;
        }
      }

      // console.log("Updated footer form state:", updated);
      
      // Trigger autosave if editing is enabled
      if (isEditing) {
        setNeedsSaving(true);
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        setAutoSaveTimer(
          setTimeout(() => handleAutosave("footer"), AUTO_SAVE_DELAY)
        );
      }
      
      return updated;
    });
  };
  
  // Handle nested form field changes (for arrays and objects)
  const handleNestedFormChange = (
    section,
    nestedObject,
    field,
    value,
    blockIndex,
    formType,
    nestedIndex
  ) => {
    // console.log(
    //   `handleNestedFormChange called: section=${section}, nestedObject=${nestedObject}, field=${field}, value=${value}, blockIndex=${blockIndex}, formType=${formType}, nestedIndex=${nestedIndex}`
    // );

    // For backward compatibility, if nestedIndex is undefined but blockIndex is a number, assume it's the itemIndex
    let index = nestedIndex;
    if (
      index === undefined &&
      typeof blockIndex === "number" &&
      section !== "blocks"
    ) {
      index = blockIndex;
      blockIndex = undefined;
    }

    // Use formType if provided, otherwise fall back to activeTab
    const targetForm = formType || activeTab;
    
    // If the form is footer, use the specialized footer form handler
    if (targetForm === "footer" || targetForm === "footerForm") {
      return handleFooterNestedFormChange(section, nestedObject, field, value, blockIndex, index);
    }
    
    switch (targetForm) {
      case "home":
        // console.log("Updating home page form nested field");
        setHomePageForm((prev) => {
          if (!prev) return prev; // Guard against null prev

          // console.log("Previous home page form state:", prev);
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy

          // Special handling for blocks array
          if (section === "blocks") {
            // console.log("Handling blocks special case");
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
            }

            // Ensure block at blockIndex exists
            if (blockIndex !== undefined && !updated.blocks[blockIndex]) {
              updated.blocks[blockIndex] = {};
            }

            // Fix any incorrect '[object Object]' array that might be present
            if (blockIndex !== undefined && updated.blocks[blockIndex]['[object Object]'] && 
                Array.isArray(updated.blocks[blockIndex]['[object Object]'])) {
              // console.log("Fixing incorrect [object Object] array in block", blockIndex);
              delete updated.blocks[blockIndex]['[object Object]'];
            }

            if (nestedObject && blockIndex !== undefined) {
              // Handle nested object/array within block
              if (!updated.blocks[blockIndex][nestedObject]) {
                if (nestedObject === "categories") {
                  updated.blocks[blockIndex][nestedObject] = [];
                } else if (nestedObject === "banners") {
                  updated.blocks[blockIndex][nestedObject] = [];
                } else if (nestedObject === "slides") {
                  updated.blocks[blockIndex][nestedObject] = [];
                } else {
                  updated.blocks[blockIndex][nestedObject] = {};
                }
              }

              if (index !== undefined) {
                // Handle array item within nested object/array
                if (!updated.blocks[blockIndex][nestedObject][index]) {
                  updated.blocks[blockIndex][nestedObject][index] = {};
                }

                // Special handling for image fields in categories
                if (nestedObject === "categories" && Array.isArray(field)) {
                  // Handle nested objects like ["image", "url"] or ["video", "url"]
                  const [objectField, property] = field;
                  
                  // Ensure the object exists
                  if (!updated.blocks[blockIndex][nestedObject][index][objectField]) {
                    updated.blocks[blockIndex][nestedObject][index][objectField] = {};
                  }
                  // Update the property within the object
                  updated.blocks[blockIndex][nestedObject][index][objectField][property] = value;
                  console.log(`Updated category ${objectField}:`, updated.blocks[blockIndex][nestedObject][index][objectField]);
                }
                // For backward compatibility
                else if (nestedObject === "categories" && (field === "url" || field === "alt")) {
                  // Ensure image object exists
                  if (!updated.blocks[blockIndex][nestedObject][index]["image"]) {
                    updated.blocks[blockIndex][nestedObject][index]["image"] = {};
                  }
                  // Update the url or alt field within the image object
                  updated.blocks[blockIndex][nestedObject][index]["image"][field] = value;
                  // console.log("Updated category image:", updated.blocks[blockIndex][nestedObject][index]["image"]);
                } 
                // Special handling for slides with nested image objects
                else if (nestedObject === "slides" && Array.isArray(field)) {
                  // Handle nested image objects like ["desktop_image", "url"]
                  const [imageField, imageProperty] = field;
                  
                  // Handle different image field names for compatibility
                  let actualImageField = imageField;
                  
                  // For mobile images
                  if (imageField === "mobile_image") {
                    // Update both mobile_image and mobile_background_image
                    // Ensure mobile_image object exists
                    if (!updated.blocks[blockIndex][nestedObject][index]["mobile_image"]) {
                      updated.blocks[blockIndex][nestedObject][index]["mobile_image"] = {};
                    }
                    // Update mobile_image
                    updated.blocks[blockIndex][nestedObject][index]["mobile_image"][imageProperty] = value;
                    
                    // Ensure mobile_background_image object exists
                    if (!updated.blocks[blockIndex][nestedObject][index]["mobile_background_image"]) {
                      updated.blocks[blockIndex][nestedObject][index]["mobile_background_image"] = {};
                    }
                    // Update mobile_background_image
                    updated.blocks[blockIndex][nestedObject][index]["mobile_background_image"][imageProperty] = value;
                    
                    // console.log(`Updated slide mobile images:`, {
                    //   mobile_image: updated.blocks[blockIndex][nestedObject][index]["mobile_image"],
                    //   mobile_background_image: updated.blocks[blockIndex][nestedObject][index]["mobile_background_image"]
                    // });
                  }
                  
                  // For desktop images
                  else if (imageField === "desktop_image") {
                    // Update both desktop_image and background_image
                    // Ensure desktop_image object exists
                    if (!updated.blocks[blockIndex][nestedObject][index]["desktop_image"]) {
                      updated.blocks[blockIndex][nestedObject][index]["desktop_image"] = {};
                    }
                    // Update desktop_image
                    updated.blocks[blockIndex][nestedObject][index]["desktop_image"][imageProperty] = value;
                    
                    // Ensure background_image object exists
                    if (!updated.blocks[blockIndex][nestedObject][index]["background_image"]) {
                      updated.blocks[blockIndex][nestedObject][index]["background_image"] = {};
                    }
                    // Update background_image
                    updated.blocks[blockIndex][nestedObject][index]["background_image"][imageProperty] = value;
                    
                    // console.log(`Updated slide desktop images:`, {
                  //     desktop_image: updated.blocks[blockIndex][nestedObject][index]["desktop_image"],
                  //     background_image: updated.blocks[blockIndex][nestedObject][index]["background_image"]
                  //   });
                  }
                  else {
                    // Ensure the image object exists
                    if (!updated.blocks[blockIndex][nestedObject][index][actualImageField]) {
                      updated.blocks[blockIndex][nestedObject][index][actualImageField] = {};
                    }
                    
                    // Update the property within the image object
                    updated.blocks[blockIndex][nestedObject][index][actualImageField][imageProperty] = value;
                    // console.log(`Updated slide ${actualImageField}:`, updated.blocks[blockIndex][nestedObject][index][actualImageField]);
                  }
                }
                else if (field && typeof field === 'string' && field.includes(".")) {
                  // Handle dot notation for nested fields
                  const [parentField, childField] = field.split(".");
                  if (
                    !updated.blocks[blockIndex][nestedObject][index][
                      parentField
                    ]
                  ) {
                    updated.blocks[blockIndex][nestedObject][index][
                      parentField
                    ] = {};
                  }
                  updated.blocks[blockIndex][nestedObject][index][parentField][
                    childField
                  ] = value;
                } else {
                  // Simple field in array item
                  updated.blocks[blockIndex][nestedObject][index][field] =
                    value;
                }
              } else {
                // Simple field in nested object
                updated.blocks[blockIndex][nestedObject][field] = value;
              }
            } else if (blockIndex !== undefined) {
              // Simple field in block
              updated.blocks[blockIndex][field] = value;
            }
          }
          // Special handling for promotional_banners which has a nested banners array
          else if (section === "promotional_banners") {
            // console.log("Handling promotional_banners special case");
            // Ensure promotional_banners exists
            if (!updated.promotional_banners) {
              updated.promotional_banners = { banners: [] };
            }
            // Ensure banners array exists
            if (!updated.promotional_banners.banners) {
              updated.promotional_banners.banners = [];
            }

            if (index !== undefined) {
              // Ensure banner at index exists
              if (!updated.promotional_banners.banners[index]) {
                updated.promotional_banners.banners[index] = {};
              }

              if (nestedObject) {
                // Handle nested object within banner
                if (!updated.promotional_banners.banners[index][nestedObject]) {
                  updated.promotional_banners.banners[index][nestedObject] = {};
                }
                updated.promotional_banners.banners[index][nestedObject][
                  field
                ] = value;
              } else if (field && field.includes(".")) {
                // Handle dot notation for nested fields
                const [parentField, childField] = field.split(".");
                if (!updated.promotional_banners.banners[index][parentField]) {
                  updated.promotional_banners.banners[index][parentField] = {};
                }
                updated.promotional_banners.banners[index][parentField][
                  childField
                ] = value;
              } else {
                // Simple field in banner
                updated.promotional_banners.banners[index][field] = value;
              }
            } else {
              // Handle promotional_banners fields not in a banner
              // This branch is for fields directly in promotional_banners, not in banners array
              // Currently there are no such fields, but this is here for future extensibility
            }
          } else {
            // Regular handling for other sections
            // Ensure section exists
            if (!updated[section]) {
              // console.log(`Section ${section} doesn't exist, creating it`);
              updated[section] = {};
            }

            if (index !== undefined) {
              // Handling array items
              // Ensure array exists
              if (!Array.isArray(updated[section])) {
                // console.log(
                //   `Section ${section} is not an array, converting it`
                // );
                updated[section] = [];
              }
              // Ensure array item exists
              if (!updated[section][index]) {
                // console.log(
                //   `Item at index ${index} doesn't exist, creating it`
                // );
                updated[section][index] = {};
              }

              if (nestedObject) {
                // Handle nested object within array item
                if (!updated[section][index][nestedObject]) {
                  updated[section][index][nestedObject] = {};
                }
                updated[section][index][nestedObject][field] = value;
              } else if (field && field.includes(".")) {
                // Handle dot notation for nested fields
                const [parentField, childField] = field.split(".");
                if (!updated[section][index][parentField]) {
                  updated[section][index][parentField] = {};
                }
                updated[section][index][parentField][childField] = value;
              } else {
                // Simple field in array item
                updated[section][index][field] = value;
              }
            } else if (nestedObject) {
              // Handle nested object
              if (!updated[section][nestedObject]) {
                updated[section][nestedObject] = {};
              }
              updated[section][nestedObject][field] = value;
            } else {
              // Simple field in section
              updated[section][field] = value;
            }
          }

          // console.log("Updated home page form state:", updated);
          return updated;
        });
        break;
      case "about":
        setAboutPageForm((prev) => {
          if (!prev) return prev; // Guard against null prev

          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy
          
          // Special handling for blocks array
          if (section === "blocks") {
            // console.log("Handling blocks special case for about page");
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
            }

            // Ensure block at blockIndex exists
            if (blockIndex !== undefined && !updated.blocks[blockIndex]) {
              updated.blocks[blockIndex] = {};
            }

            if (nestedObject && blockIndex !== undefined) {
              // Handle nested object/array within block
              if (!updated.blocks[blockIndex][nestedObject]) {
                updated.blocks[blockIndex][nestedObject] = {};
              }

              if (index !== undefined) {
                // Handle array item within nested object/array
                if (!updated.blocks[blockIndex][nestedObject][index]) {
                  updated.blocks[blockIndex][nestedObject][index] = {};
                }

                if (field && field.includes(".")) {
                  // Handle dot notation for nested fields
                  const [parentField, childField] = field.split(".");
                  if (
                    !updated.blocks[blockIndex][nestedObject][index][
                      parentField
                    ]
                  ) {
                    updated.blocks[blockIndex][nestedObject][index][
                      parentField
                    ] = {};
                  }
                  updated.blocks[blockIndex][nestedObject][index][parentField][
                    childField
                  ] = value;
                } else {
                  // Simple field in array item
                  updated.blocks[blockIndex][nestedObject][index][field] =
                    value;
                }
              } else {
                // Simple field in nested object
                updated.blocks[blockIndex][nestedObject][field] = value;
              }
            } else if (blockIndex !== undefined) {
              // Handle background_image special case
              if (field === "background_image" && typeof nestedObject === "string") {
                if (!updated.blocks[blockIndex].background_image) {
                  updated.blocks[blockIndex].background_image = {};
                }
                updated.blocks[blockIndex].background_image[nestedObject] = value;
              } 
              // Handle side_image special case
              else if (nestedObject === "side_image") {
                if (!updated.blocks[blockIndex].side_image) {
                  updated.blocks[blockIndex].side_image = {};
                }
                updated.blocks[blockIndex].side_image[field] = value;
                // console.log("Updated side_image:", updated.blocks[blockIndex].side_image);
              } else {
                // Simple field in block
                updated.blocks[blockIndex][field] = value;
              }
            }
          } else {
            // Regular handling for other sections
            // Ensure section exists
            if (!updated[section]) {
              updated[section] = {};
            }

            if (index !== undefined) {
              // Handling array items
              // Ensure array exists
              if (!Array.isArray(updated[section])) {
                updated[section] = [];
              }
              // Ensure array item exists
              if (!updated[section][index]) {
                updated[section][index] = {};
              }

              if (nestedObject) {
                // Handle nested object within array item
                if (!updated[section][index][nestedObject]) {
                  updated[section][index][nestedObject] = {};
                }
                updated[section][index][nestedObject][field] = value;
              } else if (field && field.includes(".")) {
                // Handle dot notation for nested fields
                const [parentField, childField] = field.split(".");
                if (!updated[section][index][parentField]) {
                  updated[section][index][parentField] = {};
                }
                updated[section][index][parentField][childField] = value;
              } else {
                // Simple field in array item
                updated[section][index][field] = value;
              }
            } else if (nestedObject) {
              // Handle nested object
              if (!updated[section][nestedObject]) {
                updated[section][nestedObject] = {};
              }
              updated[section][nestedObject][field] = value;
            } else {
              // Simple field in section
              updated[section][field] = value;
            }
          }

          // console.log("Updated about page form state:", updated);
          return updated;
        });
        break;
      case "contact":
        setContactPageForm((prev) => {
          if (!prev) return prev; // Guard against null prev

          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy
          
          // Special handling for blocks array
          if (section === "blocks") {
            // console.log("Handling blocks special case for contact page");
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
            }

            // Ensure block at blockIndex exists
            if (blockIndex !== undefined && !updated.blocks[blockIndex]) {
              updated.blocks[blockIndex] = {};
            }

            if (nestedObject && blockIndex !== undefined) {
              // Handle nested object/array within block
              if (!updated.blocks[blockIndex][nestedObject]) {
                updated.blocks[blockIndex][nestedObject] = {};
              }

              if (index !== undefined) {
                // Handle array item within nested object/array
                if (!updated.blocks[blockIndex][nestedObject][index]) {
                  updated.blocks[blockIndex][nestedObject][index] = {};
                }

                if (field && field.includes(".")) {
                  // Handle dot notation for nested fields
                  const [parentField, childField] = field.split(".");
                  if (
                    !updated.blocks[blockIndex][nestedObject][index][
                      parentField
                    ]
                  ) {
                    updated.blocks[blockIndex][nestedObject][index][
                      parentField
                    ] = {};
                  }
                  updated.blocks[blockIndex][nestedObject][index][parentField][
                    childField
                  ] = value;
                } else {
                  // Simple field in array item
                  updated.blocks[blockIndex][nestedObject][index][field] =
                    value;
                }
              } else {
                // Simple field in nested object
                updated.blocks[blockIndex][nestedObject][field] = value;
              }
            } else if (blockIndex !== undefined) {
              // Handle background_image special case
              if (field === "background_image" && typeof nestedObject === "string") {
                if (!updated.blocks[blockIndex].background_image) {
                  updated.blocks[blockIndex].background_image = {};
                }
                updated.blocks[blockIndex].background_image[nestedObject] = value;
              } 
              // Handle side_image special case
              else if (nestedObject === "side_image") {
                if (!updated.blocks[blockIndex].side_image) {
                  updated.blocks[blockIndex].side_image = {};
                }
                updated.blocks[blockIndex].side_image[field] = value;
                // console.log("Updated side_image:", updated.blocks[blockIndex].side_image);
              } else {
                // Simple field in block
                updated.blocks[blockIndex][field] = value;
              }
            }
          } else {
            // Regular handling for other sections
            // Ensure section exists
            if (!updated[section]) {
              updated[section] = {};
            }

            if (index !== undefined) {
              // Handling array items
              // Ensure array exists
              if (!Array.isArray(updated[section])) {
                updated[section] = [];
              }
              // Ensure array item exists
              if (!updated[section][index]) {
                updated[section][index] = {};
              }

              if (nestedObject) {
                // Handle nested object within array item
                if (!updated[section][index][nestedObject]) {
                  updated[section][index][nestedObject] = {};
                }
                updated[section][index][nestedObject][field] = value;
              } else if (field && field.includes(".")) {
                // Handle dot notation for nested fields
                const [parentField, childField] = field.split(".");
                if (!updated[section][index][parentField]) {
                  updated[section][index][parentField] = {};
                }
                updated[section][index][parentField][childField] = value;
              } else {
                // Simple field in array item
                updated[section][index][field] = value;
              }
            } else if (nestedObject) {
              // Handle nested object
              if (!updated[section][nestedObject]) {
                updated[section][nestedObject] = {};
              }
              updated[section][nestedObject][field] = value;
            } else {
              // Simple field in section
              updated[section][field] = value;
            }
          }

          // console.log("Updated contact page form state:", updated);
          return updated;
        });
        break;
      case "footer":
        setFooterForm((prev) => {
          if (!prev) return prev; // Guard against null prev

          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy
          
          // Special handling for navigation_columns array
          if (section === "navigation_columns") {
            // console.log("Handling navigation_columns special case for footer");
            // Ensure navigation_columns array exists
            if (!updated.navigation_columns) {
              updated.navigation_columns = [];
            }

            // Ensure column at blockIndex exists
            if (blockIndex !== undefined && !updated.navigation_columns[blockIndex]) {
              updated.navigation_columns[blockIndex] = {};
            }

            if (nestedObject === "links" && blockIndex !== undefined) {
              // Handle links array within navigation column
              if (!updated.navigation_columns[blockIndex].links) {
                updated.navigation_columns[blockIndex].links = [];
              }

              if (nestedIndex !== undefined) {
                // Handle link item within links array
                if (!updated.navigation_columns[blockIndex].links[nestedIndex]) {
                  updated.navigation_columns[blockIndex].links[nestedIndex] = {};
                }

                // Set the field value in the link
                updated.navigation_columns[blockIndex].links[nestedIndex][field] = value;
              } else {
                // Simple field in links array
                updated.navigation_columns[blockIndex][nestedObject][field] = value;
              }
            } else {
              // Simple field in navigation column
              updated.navigation_columns[blockIndex][field] = value;
            }
          }
          // Special handling for blocks array
          else if (section === "blocks") {
            // console.log("Handling blocks special case for footer");
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
            }

            // Ensure block at blockIndex exists
            if (blockIndex !== undefined && !updated.blocks[blockIndex]) {
              updated.blocks[blockIndex] = {};
            }

            if (nestedObject && blockIndex !== undefined) {
              // Handle nested object/array within block
              if (!updated.blocks[blockIndex][nestedObject]) {
                updated.blocks[blockIndex][nestedObject] = {};
              }

              if (index !== undefined) {
                // Handle array item within nested object/array
                if (!updated.blocks[blockIndex][nestedObject][index]) {
                  updated.blocks[blockIndex][nestedObject][index] = {};
                }

                if (field && field.includes(".")) {
                  // Handle dot notation for nested fields
                  const [parentField, childField] = field.split(".");
                  if (
                    !updated.blocks[blockIndex][nestedObject][index][
                      parentField
                    ]
                  ) {
                    updated.blocks[blockIndex][nestedObject][index][
                      parentField
                    ] = {};
                  }
                  updated.blocks[blockIndex][nestedObject][index][parentField][
                    childField
                  ] = value;
                } else {
                  // Simple field in array item
                  updated.blocks[blockIndex][nestedObject][index][field] =
                    value;
                }
              } else {
                // Simple field in nested object
                updated.blocks[blockIndex][nestedObject][field] = value;
              }
            } else if (blockIndex !== undefined) {
              // Handle background_image special case
              if (field === "background_image" && typeof nestedObject === "string") {
                if (!updated.blocks[blockIndex].background_image) {
                  updated.blocks[blockIndex].background_image = {};
                }
                updated.blocks[blockIndex].background_image[nestedObject] = value;
              } 
              // Handle side_image special case
              else if (nestedObject === "side_image") {
                if (!updated.blocks[blockIndex].side_image) {
                  updated.blocks[blockIndex].side_image = {};
                }
                updated.blocks[blockIndex].side_image[field] = value;
                // console.log("Updated side_image:", updated.blocks[blockIndex].side_image);
              } else {
                // Simple field in block
                updated.blocks[blockIndex][field] = value;
              }
            }
          } 
          // Special handling for brand_info section
          else if (section === "brand_info") {
            // console.log("Handling brand_info special case for footer");
            // Ensure brand_info exists
            if (!updated.brand_info) {
              updated.brand_info = {};
            }
            
            // Set the field value in brand_info
            updated.brand_info[field] = value;
          }
          else {
            // Regular handling for other sections
            // Ensure section exists
            if (!updated[section]) {
              updated[section] = {};
            }

            if (index !== undefined) {
              // Handling array items
              // Ensure array exists
              if (!Array.isArray(updated[section])) {
                updated[section] = [];
              }
              // Ensure array item exists
              if (!updated[section][index]) {
                updated[section][index] = {};
              }

              if (nestedObject) {
                // Handle nested object within array item
                if (!updated[section][index][nestedObject]) {
                  updated[section][index][nestedObject] = {};
                }
                updated[section][index][nestedObject][field] = value;
              } else if (field && field.includes(".")) {
                // Handle dot notation for nested fields
                const [parentField, childField] = field.split(".");
                if (!updated[section][index][parentField]) {
                  updated[section][index][parentField] = {};
                }
                updated[section][index][parentField][childField] = value;
              } else {
                // Simple field in array item
                updated[section][index][field] = value;
              }
            } else if (nestedObject) {
              // Handle nested object
              if (!updated[section][nestedObject]) {
                updated[section][nestedObject] = {};
              }
              updated[section][nestedObject][field] = value;
            } else {
              // Simple field in section
              updated[section][field] = value;
            }
          }

          // console.log("Updated footer form state:", updated);
          return updated;
        });
        break;
      default:
        break;
    }

    // Trigger autosave after a short delay
    if (isEditing) {
      clearTimeout(window.autosaveTimeout);
      window.autosaveTimeout = setTimeout(() => {
        handleAutosave();
      }, 2000); // 2 seconds delay
    }
  };

  // Specialized handler for adding items to footer arrays
  const handleFooterAddArrayItem = (section, nestedObject, newItem, blockIndex) => {
    // console.log(
    //   `handleFooterAddArrayItem called: section=${section}, nestedObject=${nestedObject}, blockIndex=${blockIndex}, newItem=`,
    //   newItem
    // );

    // Create a deep copy of the footer form to avoid direct state mutation
    setFooterForm((prev) => {
      if (!prev) return prev; // Guard against null prev
      
      // console.log("Previous footer form state:", prev);
      const updated = JSON.parse(JSON.stringify(prev)); // Deep copy

      // Handle different sections of the footer form
      if (section === "navigation_columns") {
        // Ensure navigation_columns exists
        if (!updated.navigation_columns) {
          updated.navigation_columns = [];
        }
        
        // If nestedObject is "links" and we have a blockIndex, we're adding a link to a column
        if (nestedObject === "links" && typeof blockIndex === "number") {
          // Ensure the column exists
          if (!updated.navigation_columns[blockIndex]) {
            updated.navigation_columns[blockIndex] = {};
          }
          
          // Ensure the links array exists
          if (!updated.navigation_columns[blockIndex].links) {
            updated.navigation_columns[blockIndex].links = [];
          }
          
          // Add the new link to the column
          updated.navigation_columns[blockIndex].links.push({ ...newItem });
        } else {
          // Add a new navigation column
          updated.navigation_columns.push({ 
            title: "",
            links: [],
            ...newItem 
          });
        }
      } else if (section === "quickLinks") {
        // Ensure quickLinks exists and is an array
        if (!updated.quickLinks || !Array.isArray(updated.quickLinks)) {
          updated.quickLinks = [];
        }
        
        // Add a new quick link
        updated.quickLinks.push({ 
          label: "",
          url: "",
          ...newItem 
        });
      } else if (section === "informationLinks") {
        // Ensure informationLinks exists and is an array
        if (!updated.informationLinks || !Array.isArray(updated.informationLinks)) {
          updated.informationLinks = [];
        }
        
        // Add a new information link
        updated.informationLinks.push({ 
          label: "",
          url: "",
          ...newItem 
        });
      } else if (section === "socialLinks") {
        // Ensure socialLinks exists
        if (!updated.socialLinks) {
          updated.socialLinks = [];
        }
        
        // Add a new social link with all required fields
        const socialLink = { 
          platform: "",
          url: "",
          icon: "",
          ...newItem 
        };
        
        // Ensure all required fields have at least empty string values
        if (!socialLink.platform) socialLink.platform = "";
        if (!socialLink.url) socialLink.url = "";
        if (!socialLink.icon) socialLink.icon = "";
        
        updated.socialLinks.push(socialLink);
        
        // Also update social_links for backward compatibility
        updated.social_links = updated.socialLinks;
      } else if (section === "blocks") {
        // Ensure blocks array exists
        if (!updated.blocks) {
          updated.blocks = [];
        }

        // If blockIndex is provided and nestedObject exists, we're adding to a nested array within a block
        if (blockIndex !== undefined && nestedObject) {
          // Ensure block at blockIndex exists
          if (!updated.blocks[blockIndex]) {
            updated.blocks[blockIndex] = {};
          }
          
          // Ensure nested array exists
          if (!updated.blocks[blockIndex][nestedObject]) {
            updated.blocks[blockIndex][nestedObject] = [];
          }

          // Add item to nested array
          updated.blocks[blockIndex][nestedObject].push({ ...newItem });
        } else {
          // Add a new block
          updated.blocks.push({ ...newItem });
        }
      }

      // console.log("Updated footer form state:", updated);
      
      // Trigger autosave if editing is enabled
      if (isEditing) {
        setNeedsSaving(true);
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        setAutoSaveTimer(
          setTimeout(() => handleAutosave("footer"), AUTO_SAVE_DELAY)
        );
      }
      
      return updated;
    });
  };

  // Add item to array in form
  const handleAddArrayItem = (section, nestedArray, template, blockIndex, formType) => {
    // console.log(
    //   `handleAddArrayItem called: section=${section}, nestedArray=${nestedArray}, blockIndex=${blockIndex}, formType=${formType}, template=`,
    //   template
    // );
    
    // Use formType if provided, otherwise fall back to activeTab
    const targetForm = formType || activeTab;
    
    // If the form is footer, use the specialized footer array handler
    if (targetForm === "footer" || targetForm === "footerForm") {
      return handleFooterAddArrayItem(section, nestedArray, template, blockIndex);
    }

    switch (activeTab) {
      case "home":
        // console.log("Adding item to home page form array");
        setHomePageForm((prev) => {
          // console.log("Previous home page form state:", prev);
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy

          // Special handling for blocks array
          if (section === "blocks") {
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
            }

            // If template is a complete block, add it directly to blocks array
            if (template.blockType) {
              // Check if we're adding a promotional banner
              if (template.blockType === "promotional_banner") {
                // Count existing promotional banners
                const promotionalBannerCount = updated.blocks.filter(
                  block => block.blockType === "promotional_banner"
                ).length;
                
                // Check if we've reached the limit
                if (promotionalBannerCount >= 5) {
                  alert("Maximum limit of 5 promotional banners reached!");
                  return prev; // Return previous state without changes
                }
              }
              
              // Find the highest order value to place the new block at the end
              const maxOrder = updated.blocks.reduce(
                (max, block) => (block.order > max ? block.order : max),
                0
              );
              
              // Add order property if not present
              if (!template.order) {
                template.order = maxOrder + 1;
              }
              
              // Add the block to the blocks array
              updated.blocks.push({ ...template });
            } 
            // Handle nested array within a block
            else if (blockIndex !== undefined && nestedArray) {
              // Ensure block at blockIndex exists
              if (!updated.blocks[blockIndex]) {
                updated.blocks[blockIndex] = {};
              }
              
              // Ensure nested array exists
              if (!updated.blocks[blockIndex][nestedArray]) {
                updated.blocks[blockIndex][nestedArray] = [];
              }

              // Add item to nested array
              updated.blocks[blockIndex][nestedArray].push({ ...template });
              // console.log(`Added item to ${nestedArray} array:`, template);
            }
          }
          // For backward compatibility - Special handling for promotional_banners which has a nested banners array
          else if (section === "promotional_banners") {
            // Ensure promotional_banners exists
            if (!updated.promotional_banners) {
              updated.promotional_banners = { banners: [] };
            }
            // Ensure banners array exists
            if (!updated.promotional_banners.banners) {
              updated.promotional_banners.banners = [];
            }
            updated.promotional_banners.banners = [
              ...updated.promotional_banners.banners,
              { ...template },
            ];
            
            // Also add to blocks array for new structure
            if (!updated.blocks) {
              updated.blocks = [];
            }
            
            // Find the highest order value
            const maxOrder = updated.blocks.reduce(
              (max, block) => (block.order > max ? block.order : max),
              0
            );
            
            // Create a promotional_banner block
            const bannerBlock = {
              blockType: "promotional_banner",
              ...template,
              order: maxOrder + 1
            };
            
            // Add to blocks array
            updated.blocks.push(bannerBlock);
          }
          // If nestedArray is provided, add to nested array
          else if (nestedArray) {
            // Ensure section exists
            if (!updated[section]) {
              updated[section] = {};
            }
            // Ensure nested array exists
            if (!updated[section][nestedArray]) {
              updated[section][nestedArray] = [];
            }
            updated[section][nestedArray] = [
              ...updated[section][nestedArray],
              { ...template },
            ];
          } else {
            // Add directly to section array
            updated[section] = [...(updated[section] || []), { ...template }];
          }

          // console.log("Updated home page form state:", updated);
          return updated;
        });
        break;
      case "about":
        // console.log("Adding item to about page form array");
        setAboutPageForm((prev) => {
          // console.log("Previous about page form state:", prev);
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy

          // If nestedArray is provided, add to nested array
          if (nestedArray) {
            // Ensure section exists
            if (!updated[section]) {
              updated[section] = {};
            }
            // Ensure nested array exists
            if (!updated[section][nestedArray]) {
              updated[section][nestedArray] = [];
            }
            updated[section][nestedArray] = [
              ...updated[section][nestedArray],
              { ...template },
            ];
          } else {
            // Add directly to section array
            updated[section] = [...(updated[section] || []), { ...template }];
          }

          // console.log("Updated about page form state:", updated);
          return updated;
        });
        break;
      case "contact":
        // console.log("Adding item to contact page form array");
        setContactPageForm((prev) => {
          // console.log("Previous contact page form state:", prev);
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy

          // Special handling for blocks array
          if (section === "blocks") {
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
            }

            // Ensure block at blockIndex exists
            if (blockIndex !== undefined && !updated.blocks[blockIndex]) {
              updated.blocks[blockIndex] = {};
            }

            // Ensure nested array exists
            if (blockIndex !== undefined && nestedArray) {
              if (!updated.blocks[blockIndex][nestedArray]) {
                updated.blocks[blockIndex][nestedArray] = [];
              }

              // Add item to nested array
              updated.blocks[blockIndex][nestedArray].push(template);
            }
          }
          // If nestedArray is provided, add to nested array
          else if (nestedArray) {
            // Ensure section exists
            if (!updated[section]) {
              updated[section] = {};
            }
            // Ensure nested array exists
            if (!updated[section][nestedArray]) {
              updated[section][nestedArray] = [];
            }
            updated[section][nestedArray] = [
              ...updated[section][nestedArray],
              { ...template },
            ];
          } else {
            // Add directly to section array
            updated[section] = [...(updated[section] || []), { ...template }];
          }

          // console.log("Updated contact page form state:", updated);
          return updated;
        });
        break;
      case "footer":
        // console.log("Adding item to footer form array");
        setFooterForm((prev) => {
          // console.log("Previous footer form state:", prev);
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy

          // Special handling for blocks array
          if (section === "blocks") {
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
            }

            // Ensure block at blockIndex exists
            if (blockIndex !== undefined && !updated.blocks[blockIndex]) {
              updated.blocks[blockIndex] = {};
            }

            // Ensure nested array exists
            if (blockIndex !== undefined && nestedArray) {
              if (!updated.blocks[blockIndex][nestedArray]) {
                updated.blocks[blockIndex][nestedArray] = [];
              }

              // Add item to nested array
              updated.blocks[blockIndex][nestedArray].push(template);
            }
          }
          // If nestedArray is provided, add to nested array
          else if (nestedArray) {
            // Ensure section exists
            if (!updated[section]) {
              updated[section] = {};
            }
            // Ensure nested array exists
            if (!updated[section][nestedArray]) {
              updated[section][nestedArray] = [];
            }
            updated[section][nestedArray] = [
              ...updated[section][nestedArray],
              { ...template },
            ];
          } else {
            // Add directly to section array
            updated[section] = [...(updated[section] || []), { ...template }];
          }

          // console.log("Updated footer form state:", updated);
          return updated;
        });
        break;
      default:
        break;
    }

    // Trigger autosave after a short delay
    if (isEditing) {
      clearTimeout(window.autosaveTimeout);
      window.autosaveTimeout = setTimeout(() => {
        handleAutosave();
      }, 2000); // 2 seconds delay
    }
  };

  // Remove item from array in form
  const handleRemoveArrayItem = (section, nestedArray, index, blockIndex) => {
    switch (activeTab) {
      case "home":
        setHomePageForm((prev) => {
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy

          // Special handling for blocks array
          if (section === "blocks" && blockIndex !== undefined) {
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
              return updated;
            }

            // If nestedArray is not provided, remove the entire block at blockIndex
            if (!nestedArray) {
              updated.blocks = updated.blocks.filter(
                (_, i) => i !== blockIndex
              );
              return updated;
            }

            // Ensure block at blockIndex exists
            if (!updated.blocks[blockIndex]) {
              return updated;
            }

            // Remove item from nested array
            if (nestedArray && updated.blocks[blockIndex][nestedArray]) {
              updated.blocks[blockIndex][nestedArray] = updated.blocks[
                blockIndex
              ][nestedArray].filter((_, i) => i !== index);
            }
          }
          // Special handling for promotional_banners which has a nested banners array
          else if (section === "promotional_banners") {
            if (
              updated.promotional_banners &&
              updated.promotional_banners.banners
            ) {
              updated.promotional_banners.banners =
                updated.promotional_banners.banners.filter(
                  (_, i) => i !== index
                );
            }
          } else {
            // Original handling for other sections
            updated[section] = updated[section].filter((_, i) => i !== index);
          }
          return updated;
        });
        break;
      case "about":
        setAboutPageForm((prev) => {
          const updated = { ...prev };
          updated[section] = updated[section].filter((_, i) => i !== index);
          return updated;
        });
        break;
      case "contact":
        setContactPageForm((prev) => {
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy

          // Special handling for blocks array
          if (section === "blocks" && blockIndex !== undefined) {
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
              return updated;
            }

            // If nestedArray is not provided, remove the entire block at blockIndex
            if (!nestedArray) {
              updated.blocks = updated.blocks.filter(
                (_, i) => i !== blockIndex
              );
              return updated;
            }

            // Ensure block at blockIndex exists
            if (!updated.blocks[blockIndex]) {
              return updated;
            }

            // Remove item from nested array
            if (nestedArray && updated.blocks[blockIndex][nestedArray]) {
              updated.blocks[blockIndex][nestedArray] = updated.blocks[
                blockIndex
              ][nestedArray].filter((_, i) => i !== index);
            }
          } else {
            // Original handling for other sections
            if (updated[section]) {
              updated[section] = updated[section].filter((_, i) => i !== index);
            }
          }
          return updated;
        });
        break;
      case "footer":
        setFooterForm((prev) => {
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy

          // Special handling for blocks array
          if (section === "blocks" && blockIndex !== undefined) {
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
              return updated;
            }

            // If nestedArray is not provided, remove the entire block at blockIndex
            if (!nestedArray) {
              updated.blocks = updated.blocks.filter(
                (_, i) => i !== blockIndex
              );
              return updated;
            }

            // Ensure block at blockIndex exists
            if (!updated.blocks[blockIndex]) {
              return updated;
            }

            // Remove item from nested array
            if (nestedArray && updated.blocks[blockIndex][nestedArray]) {
              updated.blocks[blockIndex][nestedArray] = updated.blocks[
                blockIndex
              ][nestedArray].filter((_, i) => i !== index);
            }
          } 
          // Special handling for quickLinks
          else if (section === "quickLinks") {
            // Ensure quickLinks exists and is an array
            if (!updated.quickLinks || !Array.isArray(updated.quickLinks)) {
              updated.quickLinks = [];
              return updated;
            }
            
            // Remove the item at the specified index
            updated.quickLinks = updated.quickLinks.filter((_, i) => i !== index);
          }
          // Special handling for informationLinks
          else if (section === "informationLinks") {
            // Ensure informationLinks exists and is an array
            if (!updated.informationLinks || !Array.isArray(updated.informationLinks)) {
              updated.informationLinks = [];
              return updated;
            }
            
            // Remove the item at the specified index
            updated.informationLinks = updated.informationLinks.filter((_, i) => i !== index);
          } else {
            // Original handling for other sections
            if (updated[section]) {
              updated[section] = updated[section].filter((_, i) => i !== index);
            }
          }
          return updated;
        });
        break;
      default:
        break;
    }

    // Trigger autosave after a short delay
    if (isEditing) {
      clearTimeout(window.autosaveTimeout);
      window.autosaveTimeout = setTimeout(() => {
        handleAutosave();
      }, 2000); // 2 seconds delay
    }
  };

  // Handle block field changes for promotional banners
  const handleBlockChange = (blockIndex, field, value) => {
    // console.log(`handleBlockChange called: blockIndex=${blockIndex}, field=${field}, value=${value}`);
    
    setHomePageForm((prev) => {
      if (!prev) return prev; // Guard against null prev
      
      const updated = JSON.parse(JSON.stringify(prev)); // Deep copy
      
      // Ensure blocks array exists
      if (!updated.blocks) {
        updated.blocks = [];
      }
      
      // Ensure block at blockIndex exists
      if (!updated.blocks[blockIndex]) {
        updated.blocks[blockIndex] = {};
      }
      
      // Update the field in the block
      updated.blocks[blockIndex][field] = value;
      
      // console.log("Updated home page form state:", updated);
      return updated;
    });
    
    // Trigger autosave after a short delay
    if (isEditing) {
      clearTimeout(window.autosaveTimeout);
      window.autosaveTimeout = setTimeout(() => {
        handleAutosave();
      }, 2000); // 2 seconds delay
    }
  };
  
  // Handle block image changes for promotional banners
  const handleBlockImageChange = (blockIndex, imageField, field, value) => {
    // console.log(`handleBlockImageChange called: blockIndex=${blockIndex}, imageField=${imageField}, field=${field}, value=${value}`);
    
    setHomePageForm((prev) => {
      if (!prev) return prev; // Guard against null prev
      
      const updated = JSON.parse(JSON.stringify(prev)); // Deep copy
      
      // Ensure blocks array exists
      if (!updated.blocks) {
        updated.blocks = [];
      }
      
      // Ensure block at blockIndex exists
      if (!updated.blocks[blockIndex]) {
        updated.blocks[blockIndex] = {};
      }
      
      // Ensure image field object exists (banner_image, image, etc.)
      if (!updated.blocks[blockIndex][imageField]) {
        updated.blocks[blockIndex][imageField] = {};
      }
      
      // Update the field in the image object
      updated.blocks[blockIndex][imageField][field] = value;
      
      // console.log("Updated home page form state:", updated);
      return updated;
    });
    
    // Trigger autosave after a short delay
    if (isEditing) {
      clearTimeout(window.autosaveTimeout);
      window.autosaveTimeout = setTimeout(() => {
        handleAutosave();
      }, 2000); // 2 seconds delay
    }
  };
  
  // Move array item up or down
  const handleMoveArrayItem = (
    section,
    nestedArray,
    index,
    direction,
    blockIndex
  ) => {
    if (direction !== "up" && direction !== "down") return;

    const moveItem = (array, fromIndex, toIndex) => {
      const item = array[fromIndex];
      const newArray = [...array];
      newArray.splice(fromIndex, 1);
      newArray.splice(toIndex, 0, item);
      return newArray;
    };

    switch (activeTab) {
      case "home":
        setHomePageForm((prev) => {
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy
          const newIndex = direction === "up" ? index - 1 : index + 1;

          // Special handling for blocks array
          if (section === "blocks" && blockIndex !== undefined) {
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
              return updated;
            }

            // Ensure block at blockIndex exists
            if (!updated.blocks[blockIndex]) {
              return updated;
            }

            // Move item in nested array
            if (nestedArray && updated.blocks[blockIndex][nestedArray]) {
              const nestedArray = updated.blocks[blockIndex][nestedArray];
              if (newIndex < 0 || newIndex >= nestedArray.length)
                return updated;
              updated.blocks[blockIndex][nestedArray] = moveItem(
                nestedArray,
                index,
                newIndex
              );
            }
          }
          // Special handling for promotional_banners which has a nested banners array
          else if (section === "promotional_banners") {
            if (
              !updated.promotional_banners ||
              !updated.promotional_banners.banners
            ) {
              return prev;
            }
            const banners = updated.promotional_banners.banners;
            if (newIndex < 0 || newIndex >= banners.length) return prev;
            updated.promotional_banners.banners = moveItem(
              banners,
              index,
              newIndex
            );
          } else {
            // Original handling for other sections
            if (newIndex < 0 || newIndex >= updated[section].length)
              return prev;
            updated[section] = moveItem(updated[section], index, newIndex);
          }
          return updated;
        });
        break;
      case "about":
        setAboutPageForm((prev) => {
          const updated = { ...prev };
          const newIndex = direction === "up" ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= updated[section].length) return prev;
          updated[section] = moveItem(updated[section], index, newIndex);
          return updated;
        });
        break;
      case "contact":
        setContactPageForm((prev) => {
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy
          const newIndex = direction === "up" ? index - 1 : index + 1;

          // Special handling for blocks array
          if (section === "blocks" && blockIndex !== undefined) {
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
              return updated;
            }

            // Ensure block at blockIndex exists
            if (!updated.blocks[blockIndex]) {
              return updated;
            }

            // Move item in nested array
            if (nestedArray && updated.blocks[blockIndex][nestedArray]) {
              const nestedArr = updated.blocks[blockIndex][nestedArray];
              if (newIndex < 0 || newIndex >= nestedArr.length)
                return updated;
              updated.blocks[blockIndex][nestedArray] = moveItem(
                nestedArr,
                index,
                newIndex
              );
            }
          } else {
            // Original handling for other sections
            if (!updated[section]) return prev;
            if (newIndex < 0 || newIndex >= updated[section].length) return prev;
            updated[section] = moveItem(updated[section], index, newIndex);
          }
          return updated;
        });
        break;
      case "footer":
        setFooterForm((prev) => {
          const updated = JSON.parse(JSON.stringify(prev)); // Deep copy
          const newIndex = direction === "up" ? index - 1 : index + 1;

          // Special handling for blocks array
          if (section === "blocks" && blockIndex !== undefined) {
            // Ensure blocks array exists
            if (!updated.blocks) {
              updated.blocks = [];
              return updated;
            }

            // Ensure block at blockIndex exists
            if (!updated.blocks[blockIndex]) {
              return updated;
            }

            // Move item in nested array
            if (nestedArray && updated.blocks[blockIndex][nestedArray]) {
              const nestedArr = updated.blocks[blockIndex][nestedArray];
              if (newIndex < 0 || newIndex >= nestedArr.length)
                return updated;
              updated.blocks[blockIndex][nestedArray] = moveItem(
                nestedArr,
                index,
                newIndex
              );
            }
          } 
          // Special handling for quickLinks
          else if (section === "quickLinks") {
            // Ensure quickLinks exists and is an array
            if (!updated.quickLinks || !Array.isArray(updated.quickLinks)) {
              updated.quickLinks = [];
              return updated;
            }
            
            if (newIndex < 0 || newIndex >= updated.quickLinks.length) return prev;
            updated.quickLinks = moveItem(updated.quickLinks, index, newIndex);
          }
          // Special handling for informationLinks
          else if (section === "informationLinks") {
            // Ensure informationLinks exists and is an array
            if (!updated.informationLinks || !Array.isArray(updated.informationLinks)) {
              updated.informationLinks = [];
              return updated;
            }
            
            if (newIndex < 0 || newIndex >= updated.informationLinks.length) return prev;
            updated.informationLinks = moveItem(updated.informationLinks, index, newIndex);
          } else {
            // Original handling for other sections
            if (!updated[section]) return prev;
            if (newIndex < 0 || newIndex >= updated[section].length) return prev;
            updated[section] = moveItem(updated[section], index, newIndex);
          }
          return updated;
        });
        break;
      default:
        break;
    }

    // Trigger autosave after a short delay
    if (isEditing) {
      clearTimeout(window.autosaveTimeout);
      window.autosaveTimeout = setTimeout(() => {
        handleAutosave();
      }, 2000); // 2 seconds delay
    }
  };



  // Export enquiries to CSV
  const exportEnquiriesToCSV = () => {
    if (!enquiries || !enquiries.data || enquiries.data.length === 0) {
      toast.error("No enquiries to export");
      return;
    }

    // Create CSV content
    const headers = ["Name", "Email", "Subject", "Message", "Status", "Date"];
    const csvRows = [
      headers.join(","),
      ...enquiries.data.map((enquiry) => {
        const values = [
          `"${enquiry.name || ""}"`,
          `"${enquiry.email || ""}"`,
          `"${enquiry.subject || ""}"`,
          `"${enquiry.message?.replace(/"/g, '""') || ""}"`,
          `"${enquiry.status || ""}"`,
          `"${new Date(enquiry.createdAt).toLocaleString() || ""}"`,
        ];
        return values.join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `enquiries_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render loading state
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-500">Loading content...</p>
    </div>
  );

  // Render error state
  const renderError = (message) => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md text-center">
        <p className="font-medium">Error loading content</p>
        <p className="text-sm mt-1">{message || "Please try again later"}</p>
      </div>
      <Button
        variant="primary"
        className="mt-4"
        onClick={() => {
          switch (activeTab) {
            case "home":
              fetchHomePageData();
              break;
            case "about":
              fetchAboutPageData();
              break;
            case "contact":
              fetchContactPageData();
              break;
            case "footer":
              fetchFooterData();
              break;
            default:
              break;
          }
        }}
      >
        <ArrowPathIcon className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );

  // Render content editor toolbar
  const renderEditorToolbar = () => (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-2">
        <h2 className="text-lg font-medium text-gray-800">
          {activeTab === "home" && "Home Page"}
          {activeTab === "about" && "About Page"}
          {activeTab === "contact" && "Contact Page"}
          {activeTab === "footer" && "Footer"}
        </h2>
        {lastAutosaved && isEditing && (
          <span className="text-xs text-gray-500">
            Last autosaved: {new Date(lastAutosaved).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {!isEditing ? (
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
            disabled={
              loadingHomePage ||
              loadingAboutPage ||
              loadingContactPage ||
              loadingFooter
            }
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Content
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleCancelEditing}>
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveChanges}>
              <CheckIcon className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          {isPreviewMode ? "Edit Mode" : "Preview"}
        </Button>
      </div>
    </div>
  );

  // State for active home page section
  const [activeHomeSection, setActiveHomeSection] = useState("hero");
  const [activeFooterSection, setActiveFooterSection] = useState("brand");
  
  // State for active about page section
  const [activeAboutSection, setActiveAboutSection] = useState("header");
  
  // State for active contact page section
  const [activeContactSection, setActiveContactSection] = useState("header");

  // Render home page editor
  const renderHomePageEditor = () => {
    if (loadingHomePage) return renderLoading();
    if (homePageError) return renderError(homePageError);
    if (!homePageForm) return renderError("Home page data not available");

    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {renderEditorToolbar()}

          <div className="p-6">
            <p className="text-gray-500 mb-6">
              Edit your home page content here. Changes will be automatically
              saved every 30 seconds while editing.
            </p>

            {/* Home Page Section Navigation */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-2">
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeHomeSection === "hero" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveHomeSection("hero")}
              >
                Hero Section
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeHomeSection === "category" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveHomeSection("category")}
              >
                Shop by Category
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeHomeSection === "promotional" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveHomeSection("promotional")}
              >
                Promotional Banners
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeHomeSection === "newsletter" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveHomeSection("newsletter")}
              >
                Newsletter Section
              </button>
            </div>

            <div className="space-y-8">
              {/* Hero Section */}
              {activeHomeSection === "hero" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-700">Hero Section</h3>
                    {isEditing && (
                      <button
                        type="button"
                        className="p-1 text-red-500 hover:text-red-700"
                        onClick={() =>
                          handleRemoveArrayItem("blocks", null, null, 0)
                        }
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure your main hero banner that appears at the top of the
                    home page.
                  </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Headline"
                    value={
                      homePageForm.blocks && homePageForm.blocks[0]
                        ? homePageForm.blocks[0].headline || ""
                        : ""
                    }
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "headline",
                        e.target.value,
                        0
                      )
                    }
                    disabled={!isEditing}
                  />
                  <Input
                    label="Subheadline"
                    value={
                      homePageForm.blocks && homePageForm.blocks[0]
                        ? homePageForm.blocks[0].subheadline || ""
                        : ""
                    }
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "subheadline",
                        e.target.value,
                        0
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                {/* Hero Slides Management */}
                {homePageForm.blocks && 
                 homePageForm.blocks[0] && 
                 homePageForm.blocks[0].slides && 
                 homePageForm.blocks[0].slides.map((slide, slideIndex) => (
                  <div key={slideIndex} className="border border-gray-200 rounded-md p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Slide {slideIndex + 1}</h4>
                      <div className="flex space-x-2">
                        {isEditing && slideIndex > 0 && (
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "blocks",
                                "slides",
                                slideIndex,
                                "up",
                                0
                              )
                            }
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                        )}
                        {isEditing && slideIndex < (homePageForm.blocks[0].slides.length - 1) && (
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "blocks",
                                "slides",
                                slideIndex,
                                "down",
                                0
                              )
                            }
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                        )}
                        {isEditing && homePageForm.blocks[0].slides.length > 1 && (
                          <button
                            type="button"
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() =>
                              handleRemoveArrayItem(
                                "blocks",
                                "slides",
                                slideIndex,
                                0
                              )
                            }
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <Input
                      label="Headline"
                      value={slide.headline || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          "slides",
                          "headline",
                          e.target.value,
                          0,
                          "home",
                          slideIndex
                        )
                      }
                      disabled={!isEditing}
                      className="mb-2"
                      placeholder="Enter slide headline"
                    />

                    <Input
                      label="Subheadline"
                      value={slide.subheadline || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          "slides",
                          "subheadline",
                          e.target.value,
                          0,
                          "home",
                          slideIndex
                        )
                      }
                      disabled={!isEditing}
                      className="mb-2"
                      placeholder="Enter slide subheadline"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <Input
                        label="CTA Text"
                        value={slide.cta_text || ""}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "blocks",
                            "slides",
                            "cta_text",
                            e.target.value,
                            0,
                            "home",
                            slideIndex
                          )
                        }
                        disabled={!isEditing}
                        placeholder="Enter call-to-action text"
                      />
                      <Input
                        label="CTA Link"
                        value={slide.cta_link || ""}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "blocks",
                            "slides",
                            "cta_link",
                            e.target.value,
                            0,
                            "home",
                            slideIndex
                          )
                        }
                        disabled={!isEditing}
                        placeholder="Enter call-to-action link"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Overlay Style
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        value={slide.overlay_style || "dark"}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "blocks",
                            "slides",
                            "overlay_style",
                            e.target.value,
                            0,
                            "home",
                            slideIndex
                          )
                        }
                        disabled={!isEditing}
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Desktop Background Image
                      </label>
                      <div className="space-y-3">
                        <ImageUpload
                          label=""
                          value={(slide.desktop_image && slide.desktop_image.url) ? 
                            slide.desktop_image.url : 
                            (slide.background_image && slide.background_image.url) ? 
                              slide.background_image.url : ""}
                          onChange={(url) =>
                            handleNestedFormChange(
                              "blocks",
                              "slides",
                              ["desktop_image", "url"],
                              url,
                              0,
                              "home",
                              slideIndex
                            )
                          }
                          disabled={!isEditing}
                          isHeroSection={true}
                        />
                        <Input
                          label="Alt Text"
                          value={(slide.desktop_image && slide.desktop_image.alt) ? 
                            slide.desktop_image.alt : 
                            (slide.background_image && slide.background_image.alt) ? 
                              slide.background_image.alt : ""}
                          onChange={(e) =>
                            handleNestedFormChange(
                              "blocks",
                              "slides",
                              ["desktop_image", "alt"],
                              e.target.value,
                              0,
                              "home",
                              slideIndex
                            )
                          }
                          disabled={!isEditing}
                          placeholder="Enter image description"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Background Image
                      </label>
                      <div className="space-y-3">
                        <ImageUpload
                          label=""
                          value={(slide.mobile_image && slide.mobile_image.url) ? 
                            slide.mobile_image.url : 
                            (slide.mobile_background_image && slide.mobile_background_image.url) ? 
                              slide.mobile_background_image.url : ""}
                          onChange={(url) =>
                            handleNestedFormChange(
                              "blocks",
                              "slides",
                              ["mobile_image", "url"],
                              url,
                              0,
                              "home",
                              slideIndex
                            )
                          }
                          disabled={!isEditing}
                          isHeroSection={true}
                        />
                        <Input
                          label="Alt Text"
                          value={(slide.mobile_image && slide.mobile_image.alt) ? 
                            slide.mobile_image.alt : 
                            (slide.mobile_background_image && slide.mobile_background_image.alt) ? 
                              slide.mobile_background_image.alt : ""}
                          onChange={(e) =>
                            handleNestedFormChange(
                              "blocks",
                              "slides",
                              ["mobile_image", "alt"],
                              e.target.value,
                              0,
                              "home",
                              slideIndex
                            )
                          }
                          disabled={!isEditing}
                          placeholder="Enter mobile image description"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Slide Button */}
                {isEditing && (
                  <button
                    type="button"
                    className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mb-4 flex items-center justify-center"
                    onClick={() =>
                      handleAddArrayItem(
                        "blocks",
                        "slides",
                        {
                          headline: "New Slide Headline",
                          subheadline: "New slide subheadline text",
                          cta_text: "Shop Now",
                          cta_link: "/shop",
                          overlay_style: "dark",
                          desktop_image: { url: "", alt: "Hero background" },
                          background_image: { url: "", alt: "Hero background" },
                          mobile_image: { url: "", alt: "Hero mobile background" },
                          mobile_background_image: { url: "", alt: "Hero mobile background" }
                        },
                        0,
                        "home"
                      )
                    }
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Slide
                  </button>
                )}
              </div>
              )}

              {/* Shop by Category Section */}
              {activeHomeSection === "category" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-700">
                      Shop by Category
                    </h3>
                    {isEditing && (
                      <button
                        type="button"
                        className="p-1 text-red-500 hover:text-red-700"
                        onClick={() =>
                          handleRemoveArrayItem("blocks", null, null, 1, "home")
                        }
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Manage the category grid section.
                  </p>

                {homePageForm &&
                homePageForm.blocks &&
                homePageForm.blocks[1] &&
                homePageForm.blocks[1]?.categories
                  ? homePageForm.blocks[1].categories.map((category, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-md p-3 mb-3"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Category {index + 1}</h4>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              className="p-1 text-gray-500 hover:text-gray-700"
                              onClick={() =>
                                handleMoveArrayItem(
                                  "blocks",
                                  "categories",
                                  index,
                                  "up",
                                  1,
                                  "home"
                                )
                              }
                              disabled={!isEditing || index === 0}
                            >
                              <ArrowUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="p-1 text-gray-500 hover:text-gray-700"
                              onClick={() =>
                                handleMoveArrayItem(
                                  "blocks",
                                  "categories",
                                  index,
                                  "down",
                                  1,
                                  "home"
                                )
                              }
                              disabled={
                                !isEditing ||
                                index ===
                                  (homePageForm.blocks &&
                                  homePageForm.blocks[1] &&
                                  homePageForm.blocks[1].categories
                                    ? homePageForm.blocks[1].categories.length -
                                      1
                                    : 0)
                              }
                            >
                              <ArrowDownIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="p-1 text-red-500 hover:text-red-700"
                              onClick={() =>
                                handleRemoveArrayItem(
                                  "blocks",
                                  "categories",
                                  index,
                                  1,
                                  "home"
                                )
                              }
                              disabled={!isEditing}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <Input
                            label="Label"
                            value={category.label || ""}
                            onChange={(e) =>
                              handleNestedFormChange(
                                "blocks",
                                "categories",
                                "label",
                                e.target.value,
                                1,
                                "home",
                                index
                              )
                            }
                            disabled={!isEditing}
                          />
                          <Input
                            label="Collection Link"
                            value={category.collection_link || ""}
                            onChange={(e) =>
                              handleNestedFormChange(
                                "blocks",
                                "categories",
                                "collection_link",
                                e.target.value,
                                1,
                                "home",
                                index
                              )
                            }
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Media Type
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 mb-3"
                            value={category.media_type || "image"}
                            onChange={(e) =>
                              handleNestedFormChange(
                                "blocks",
                                "categories",
                                "media_type",
                                e.target.value,
                                1,
                                "home",
                                index
                              )
                            }
                            disabled={!isEditing}
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                          
                          {(category.media_type === "video" || !category.media_type) && (
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category Image (Fallback)
                              </label>
                              <ImageUpload
                                label=""
                                value={category.image?.url || ""}
                                onChange={(url) =>
                                  handleNestedFormChange(
                                    "blocks",
                                    "categories",
                                    ["image", "url"],
                                    url,
                                    1,
                                    "home",
                                    index
                                  )
                                }
                                disabled={!isEditing}
                              />
                              <Input
                                label="Alt Text"
                                value={category.image?.alt || ""}
                                onChange={(e) =>
                                  handleNestedFormChange(
                                    "blocks",
                                    "categories",
                                    ["image", "alt"],
                                    e.target.value,
                                    1,
                                    "home",
                                    index
                                  )
                                }
                                disabled={!isEditing}
                                placeholder="Enter image description"
                              />
                            </div>
                          )}
                          
                          {category.media_type === "video" && (
                            <div className="space-y-3 mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category Video
                              </label>
                              <VideoUpload
                                value={category.video?.video_url || ""}
                                onChange={(url) =>
                                  handleNestedFormChange(
                                    "blocks",
                                    "categories",
                                    ["video", "video_url"],
                                    url,
                                    1,
                                    "home",
                                    index
                                  )
                                }
                                disabled={!isEditing}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  : []}

                {isEditing && (
                  <button
                    type="button"
                    className="flex items-center text-sm text-teal-600 hover:text-teal-800 mt-2"
                    onClick={() =>
                      handleAddArrayItem(
                        "blocks",
                        {
                          label: "",
                          collection_link: "",
                          media_type: "image",
                          image: { url: "", alt: "" },
                          video: { video_url: "" },
                        },
                        "categories",
                        1
                      )
                    }
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Category
                  </button>
                )}
              </div>
 )}
              {/* Promotional Banners */}
              {activeHomeSection === "promotional" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">Promotional Banners</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Manage promotional banners that appear throughout the home page.
                  </p>
                
                {isEditing && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      type="button"
                      className="flex items-center text-sm bg-teal-600 text-white px-3 py-2 rounded-md hover:bg-teal-700"
                      onClick={() =>
                        handleAddArrayItem(
                          "blocks",
                          null,
                          {
                            blockType: "promotional_banner",
                            headline: "Festival Collection",
                            subheadline: "Celebrate in style with our festive collection",
                            cta_text: "Shop Now",
                            cta_link: "/shop",
                            align: "left",
                            order: 5,
                            banner_image: {
                              url: "/images/banners/festival-collection.jpg",
                              alt: "Festival Collection"
                            }
                          }
                        )
                      }
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Festival Banner
                    </button>
                    <button
                      type="button"
                      className="flex items-center text-sm bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700"
                      onClick={() =>
                        handleAddArrayItem(
                          "blocks",
                          null,
                          {
                            blockType: "promotional_banner",
                            headline: "Inclusive Fashion For All",
                            subheadline: "Our plus size collection celebrates every body with stylish, comfortable pieces designed to make you look and feel amazing.",
                            cta_text: "Shop Plus Size",
                            cta_link: "/products/category/plus-size",
                            align: "left",
                            order: 8,
                            banner_image: {
                              url: "https://images.unsplash.com/photo-1610030469668-8e4a7c2f1d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
                              alt: "Plus Size Collection"
                            }
                          }
                        )
                      }
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Plus Size Banner
                    </button>
                    <button
                      type="button"
                      className="flex items-center text-sm bg-pink-600 text-white px-3 py-2 rounded-md hover:bg-pink-700"
                      onClick={() =>
                        handleAddArrayItem(
                          "blocks",
                          null,
                          {
                            blockType: "promotional_banner",
                            headline: "Ready, Set, Summer!",
                            subheadline: "Discover our new collection of summer dresses that will keep you cool and stylish all season long.",
                            cta_text: "Shop Dresses",
                            cta_link: "/products/category/dresses",
                            align: "left",
                            order: 6,
                            banner_image: {
                              url: "/images/banners/summer-dresses.jpg",
                              alt: "Ready Set Summer Collection"
                            }
                          }
                        )
                      }
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Summer Banner
                    </button>
                    <button
                      type="button"
                      className="flex items-center text-sm bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700"
                      onClick={() =>
                        handleAddArrayItem(
                          "blocks",
                          null,
                          {
                            blockType: "promotional_banner",
                            headline: "",
                            subheadline: "",
                            cta_text: "",
                            cta_link: "",
                            align: "left",
                            banner_image: {
                              url: "",
                              alt: ""
                            }
                          }
                        )
                      }
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Generic Banner
                    </button>
                  </div>
                )}
                
                {homePageForm && homePageForm.blocks
                  ? homePageForm.blocks
                      .filter(block => block.blockType === "promotional_banner")
                      .map((banner, i) => (
                        <div
                          key={i}
                          className="border border-gray-200 rounded-md p-3 mb-3"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">
                              Promotional Banner {i + 1}
                            </h4>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                className="p-1 text-gray-500 hover:text-gray-700"
                                onClick={() => {
                                  // Find the actual index in the blocks array
                                  const blockIndex = homePageForm.blocks.findIndex(
                                    (block, idx) => block.blockType === "promotional_banner" && 
                                    homePageForm.blocks.filter(b => b.blockType === "promotional_banner").indexOf(block) === i
                                  );
                                  if (blockIndex > 0) {
                                    handleMoveArrayItem("blocks", blockIndex, "up");
                                  }
                                }}
                                disabled={!isEditing || i === 0}
                              >
                                <ArrowUpIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="p-1 text-gray-500 hover:text-gray-700"
                                onClick={() => {
                                  // Find the actual index in the blocks array
                                  const blockIndex = homePageForm.blocks.findIndex(
                                    (block, idx) => block.blockType === "promotional_banner" && 
                                    homePageForm.blocks.filter(b => b.blockType === "promotional_banner").indexOf(block) === i
                                  );
                                  handleMoveArrayItem("blocks", blockIndex, "down");
                                }}
                                disabled={!isEditing || i === homePageForm.blocks.filter(block => block.blockType === "promotional_banner").length - 1}
                              >
                                <ArrowDownIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="p-1 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  // Find the actual index in the blocks array
                                  const blockIndex = homePageForm.blocks.findIndex(
                                    (block, idx) => block.blockType === "promotional_banner" && 
                                    homePageForm.blocks.filter(b => b.blockType === "promotional_banner").indexOf(block) === i
                                  );
                                  handleRemoveArrayItem("blocks", null, null, blockIndex);
                                }}
                                disabled={!isEditing}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Headline & Subheadline */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <Input
                              label="Headline"
                              value={banner.headline || ""}
                              onChange={(e) => {
                                // Find the actual index in the blocks array
                                const blockIndex = homePageForm.blocks.findIndex(
                                  (block, idx) => block.blockType === "promotional_banner" && 
                                  homePageForm.blocks.filter(b => b.blockType === "promotional_banner").indexOf(block) === i
                                );
                                handleBlockChange(
                                  blockIndex,
                                  "headline",
                                  e.target.value
                                );
                              }}
                              disabled={!isEditing}
                            />
                            <Input
                              label="Subheadline"
                              value={banner.subheadline || ""}
                              onChange={(e) => {
                                // Find the actual index in the blocks array
                                const blockIndex = homePageForm.blocks.findIndex(
                                  (block, idx) => block.blockType === "promotional_banner" && 
                                  homePageForm.blocks.filter(b => b.blockType === "promotional_banner").indexOf(block) === i
                                );
                                handleBlockChange(
                                  blockIndex,
                                  "subheadline",
                                  e.target.value
                                );
                              }}
                              disabled={!isEditing}
                            />
                          </div>

                    {/* CTA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="CTA Text"
                        value={banner.cta_text || ""}
                        onChange={(e) => {
                          // Find the actual index in the blocks array
                          const blockIndex = homePageForm.blocks.findIndex(
                            (block, idx) => block.blockType === "promotional_banner" && 
                            homePageForm.blocks.filter(b => b.blockType === "promotional_banner").indexOf(block) === i
                          );
                          handleBlockChange(
                            blockIndex,
                            "cta_text",
                            e.target.value
                          );
                        }}
                        disabled={!isEditing}
                      />
                      <Input
                        label="CTA Link"
                        value={banner.cta_link || ""}
                        onChange={(e) => {
                          // Find the actual index in the blocks array
                          const blockIndex = homePageForm.blocks.findIndex(
                            (block, idx) => block.blockType === "promotional_banner" && 
                            homePageForm.blocks.filter(b => b.blockType === "promotional_banner").indexOf(block) === i
                          );
                          handleBlockChange(
                            blockIndex,
                            "cta_link",
                            e.target.value
                          );
                        }}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Alignment */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alignment
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={banner.align || "left"}
                        onChange={(e) => {
                          // Find the actual index in the blocks array
                          const blockIndex = homePageForm.blocks.findIndex(
                            (block, idx) => block.blockType === "promotional_banner" && 
                            homePageForm.blocks.filter(b => b.blockType === "promotional_banner").indexOf(block) === i
                          );
                          handleBlockChange(
                            blockIndex,
                            "align",
                            e.target.value
                          );
                        }}
                        disabled={!isEditing}
                      >
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>

                    {/* Image */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Banner Image
                      </label>
                      <div className="space-y-3">
                        <ImageUpload
                          label=""
                          value={banner.banner_image?.url || ""}
                          onChange={(url) => {
                            // Find the actual index in the blocks array
                            const blockIndex = homePageForm.blocks.findIndex(
                              (block, idx) => block.blockType === "promotional_banner" && 
                              homePageForm.blocks.filter(b => b.blockType === "promotional_banner").indexOf(block) === i
                            );
                            handleBlockImageChange(
                              blockIndex,
                              "banner_image",
                              "url",
                              url
                            );
                          }}
                          disabled={!isEditing}
                        />
                        <Input
                          label="Alt Text"
                          value={banner.banner_image?.alt || ""}
                          onChange={(e) => {
                            // Find the actual index in the blocks array
                            const blockIndex = homePageForm.blocks.findIndex(
                              (block, idx) => block.blockType === "promotional_banner" && 
                              homePageForm.blocks.filter(b => b.blockType === "promotional_banner").indexOf(block) === i
                            );
                            handleBlockImageChange(
                              blockIndex,
                              "banner_image",
                              "alt",
                              e.target.value
                            );
                          }}
                          disabled={!isEditing}
                          placeholder="Enter image description"
                        />
                      </div>
                    </div>
                  </div>
                ))
                : null}
              </div>
              )}

              {/* Newsletter Section */}
              {activeHomeSection === "newsletter" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-700">
                    Newsletter Section
                  </h3>
                  {isEditing && (
                    <button
                      type="button"
                      className="p-1 text-red-500 hover:text-red-700"
                      onClick={() =>
                        handleRemoveArrayItem("blocks", null, null, 9)
                      }
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Configure the newsletter signup section.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Headline"
                    value={homePageForm.newsletter_signup?.headline || "Newsletter"}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "newsletter_signup",
                        null,
                        "headline",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                  <Input
                    label="Subtext"
                    value={homePageForm.newsletter_signup?.subtext || "Subscribe to our newsletter for updates."}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "newsletter_signup",
                        null,
                        "subtext",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="mb-4">
                  <Input
                    label="Button Text"
                    value={homePageForm.newsletter_signup?.button_text || "Subscribe"}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "newsletter_signup",
                        null,
                        "button_text",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="mb-4">
                  <Input
                    label="Success Message"
                    value={homePageForm.newsletter_signup?.success_message || "Thank you for subscribing!"}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "newsletter_signup",
                        null,
                        "success_message",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="mb-4">
                  <Input
                    label="Placeholder Text"
                    value={homePageForm.newsletter_signup?.placeholder_text || "Your email address"}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "newsletter_signup",
                        null,
                        "placeholder_text",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This text will appear as placeholder in the email input field.
                  </p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="newsletter_bg_color"
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                      checked={homePageForm.newsletter_signup?.use_teal_background || homePageForm.newsletter_signup?.bg_color === "bg-teal" || false}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "newsletter_signup",
                          null,
                          "use_teal_background",
                          e.target.checked
                        )
                      }
                      disabled={!isEditing}
                    />
                    <label
                      htmlFor="newsletter_bg_color"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Use Teal Background Color
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    When enabled, the newsletter section will have a teal background.
                  </p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="newsletter_text_color"
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                      checked={homePageForm.newsletter_signup?.use_white_text || homePageForm.newsletter_signup?.text_color === "text-white" || false}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "newsletter_signup",
                          null,
                          "use_white_text",
                          e.target.checked
                        )
                      }
                      disabled={!isEditing}
                    />
                    <label
                      htmlFor="newsletter_text_color"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Use White Text Color
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    When enabled, the newsletter section will use white text.
                  </p>
                </div>
              </div>
              )}
            </div>

            {/* More sections... */}
          </div>
        </div>
      </div>
    );
  };

  // Render about page editor
  const renderAboutPageEditor = () => {
    if (loadingAboutPage) return renderLoading();
    if (aboutPageError) return renderError(aboutPageError);
    if (!aboutPageForm) return renderError("About page data not available");

    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {renderEditorToolbar()}

          <div className="p-6">
            <p className="text-gray-500 mb-6">
              Edit your about page content here. Changes will be automatically
              saved every 30 seconds while editing.
            </p>

            {/* About Page Section Navigation */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-2">
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeAboutSection === "header" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveAboutSection("header")}
              >
                Page Header
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeAboutSection === "story" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveAboutSection("story")}
              >
                Our Story
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeAboutSection === "vision" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveAboutSection("vision")}
              >
                Our Vision
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeAboutSection === "mission" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveAboutSection("mission")}
              >
                Our Mission
              </button>
              {/* Meet Our Team, and Call to Action buttons removed */}
            </div>

            <div className="space-y-8">
              {/* Page Header Section */}
              {activeAboutSection === "header" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Page Header</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Configure the page header section.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Headline"
                    value={aboutPageForm.blocks[0]?.headline || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "headline",
                        e.target.value,
                        0
                      )
                    }
                    disabled={!isEditing}
                  />
                  <Input
                    label="Subheadline"
                    value={aboutPageForm.blocks[0]?.subheadline || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "subheadline",
                        e.target.value,
                        0
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="mb-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Image
                  </label>
                  <div className="space-y-3">
                    <ImageUpload
                      label=""
                      value={aboutPageForm.blocks[0]?.background_image?.url || ""}
                      onChange={(url) =>
                        handleNestedFormChange(
                          "blocks",
                          "background_image",
                          "url",
                          url,
                          0
                        )
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Alt Text"
                      value={aboutPageForm.blocks[0]?.background_image?.alt || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          "background_image",
                          "alt",
                          e.target.value,
                          0
                        )
                      }
                      disabled={!isEditing}
                      placeholder="Enter image description"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Our Story Section */}
              {activeAboutSection === "story" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Our Story</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Edit the company story section.
                </p>

                <div className="mb-4">
                  <Input
                    label="Section Title"
                    value={aboutPageForm.blocks[1]?.title || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "title",
                        e.target.value,
                        1
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Story Content
                  </label>
                  <div className="relative">
                    <textarea
                      id="story-rich-text-textarea"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 h-32"
                      value={aboutPageForm.blocks[1]?.rich_text_story || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "rich_text_story",
                          e.target.value,
                          1
                        )
                      }
                      disabled={!isEditing}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You can use basic HTML formatting tags.
                    </p>
                    {isEditing && (
                      <div className="mt-1 flex items-center">
                        <button
                          type="button"
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded mr-2"
                          onClick={() => {
                            const textarea = document.getElementById("story-rich-text-textarea");
                            if (textarea) {
                              const cursorPos = textarea.selectionStart;
                              const textBefore = textarea.value.substring(0, cursorPos);
                              const textAfter = textarea.value.substring(cursorPos);
                              const newValue = textBefore + "\n\n" + textAfter;
                              
                              handleNestedFormChange(
                                "blocks",
                                null,
                                "rich_text_story",
                                newValue,
                                1
                              );
                              
                              // Restore cursor position after state update
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(cursorPos + 2, cursorPos + 2);
                              }, 0);
                            }
                          }}
                        >
                          Add Line Break
                        </button>
                        <p className="text-xs text-gray-500">Place cursor where you want to add a paragraph break</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Story Paragraphs
                  </label>
                  {aboutPageForm.blocks[1]?.paragraphs && aboutPageForm.blocks[1].paragraphs.map((paragraph, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Paragraph {index + 1}</h4>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "blocks",
                                "paragraphs",
                                index,
                                "up",
                                1
                              )
                            }
                            disabled={!isEditing || index === 0}
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "blocks",
                                "paragraphs",
                                index,
                                "down",
                                1
                              )
                            }
                            disabled={
                              !isEditing ||
                              index === aboutPageForm.blocks[1].paragraphs.length - 1
                            }
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() =>
                              handleRemoveArrayItem(
                                "blocks",
                                "paragraphs",
                                index,
                                1
                              )
                            }
                            disabled={!isEditing}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          id={`story-paragraph-textarea-${index}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                          value={paragraph || ""}
                          onChange={(e) =>
                            handleNestedFormChange(
                              "blocks",
                              "paragraphs",
                              null,
                              e.target.value,
                              1,
                              index
                            )
                          }
                          disabled={!isEditing}
                          rows={3}
                        />
                        {isEditing && (
                          <div className="mt-1 flex items-center">
                            <button
                              type="button"
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded mr-2"
                              onClick={() => {
                                const textarea = document.getElementById(`story-paragraph-textarea-${index}`);
                                if (textarea) {
                                  const cursorPos = textarea.selectionStart;
                                  const textBefore = textarea.value.substring(0, cursorPos);
                                  const textAfter = textarea.value.substring(cursorPos);
                                  const newValue = textBefore + "\n\n" + textAfter;
                                  
                                  handleNestedFormChange(
                                    "blocks",
                                    "paragraphs",
                                    null,
                                    newValue,
                                    1,
                                    index
                                  );
                                  
                                  // Restore cursor position after state update
                                  setTimeout(() => {
                                    textarea.focus();
                                    textarea.setSelectionRange(cursorPos + 2, cursorPos + 2);
                                  }, 0);
                                }
                              }}
                            >
                              Add Line Break
                            </button>
                            <button
                              type="button"
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded mr-2 ml-2"
                              onClick={() => handleAddArrayItem("blocks", "", "paragraphs", 1)}
                            >
                              Add New Paragraph
                            </button>
                            <p className="text-xs text-gray-500">Place cursor where you want to add a paragraph break</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isEditing && (
                    <button
                      type="button"
                      className="flex items-center text-sm text-teal-600 hover:text-teal-800 mt-2"
                      onClick={() =>
                        handleAddArrayItem(
                          "blocks",
                          "",
                          "paragraphs",
                          1
                        )
                      }
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Paragraph
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Side Image
                  </label>
                  <div className="space-y-3">
                    <ImageUpload
                      label=""
                      value={aboutPageForm.blocks[1]?.side_image?.url || ""}
                      onChange={(url) =>
                        handleNestedFormChange(
                          "blocks",
                          "side_image",
                          "url",
                          url,
                          1
                        )
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Alt Text"
                      value={aboutPageForm.blocks[1]?.side_image?.alt || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          "side_image",
                          "alt",
                          e.target.value,
                          1
                        )
                      }
                      disabled={!isEditing}
                      placeholder="Enter image description"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Our Vision Section */}
              {activeAboutSection === "vision" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Our Vision</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Edit the company vision section.
                </p>

                <div className="mb-4">
                  <Input
                    label="Section Title"
                    value={aboutPageForm.blocks[2]?.title || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "title",
                        e.target.value,
                        2
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>
                
                {isEditing && (
                  <div className="mb-4">
                    <textarea
                      id="vision-section-paragraph"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Add a paragraph here..."
                      rows={3}
                      onChange={(e) => {
                        // Create a new paragraph if none exists
                        if (!aboutPageForm.blocks[2]?.paragraphs || aboutPageForm.blocks[2].paragraphs.length === 0) {
                          handleAddArrayItem(
                            "blocks",
                            e.target.value,
                            "paragraphs",
                            2
                          );
                        } else {
                          // Update the first paragraph
                          handleNestedFormChange(
                            "blocks",
                            "paragraphs",
                            null,
                            e.target.value,
                            2,
                            0
                          );
                        }
                      }}
                    />
                    <div className="mt-1 flex items-center">
                      <button
                        type="button"
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded mr-2"
                        onClick={() => {
                          const textarea = document.getElementById("vision-section-paragraph");
                          if (textarea) {
                            const cursorPos = textarea.selectionStart;
                            const textBefore = textarea.value.substring(0, cursorPos);
                            const textAfter = textarea.value.substring(cursorPos);
                            textarea.value = textBefore + "\n\n" + textAfter;
                            
                            // Create a new paragraph if none exists
                            if (!aboutPageForm.blocks[2]?.paragraphs || aboutPageForm.blocks[2].paragraphs.length === 0) {
                              handleAddArrayItem(
                                "blocks",
                                textarea.value,
                                "paragraphs",
                                2
                              );
                            } else {
                              // Update the first paragraph
                              handleNestedFormChange(
                                "blocks",
                                "paragraphs",
                                null,
                                textarea.value,
                                2,
                                0
                              );
                            }
                            
                            // Restore cursor position after state update
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(cursorPos + 2, cursorPos + 2);
                            }, 0);
                          }
                        }}
                      >
                        Add Line Break
                      </button>
                      <button
                        type="button"
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded mr-2 ml-2"
                        onClick={() => handleAddArrayItem("blocks", "", "paragraphs", 2)}
                      >
                        Add New Paragraph
                      </button>
                      <p className="text-xs text-gray-500">Place cursor where you want to add a paragraph break</p>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vision Paragraphs
                  </label>
                  {aboutPageForm.blocks[2]?.paragraphs && aboutPageForm.blocks[2].paragraphs.map((paragraph, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Paragraph {index + 1}</h4>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "blocks",
                                "paragraphs",
                                index,
                                "up",
                                2
                              )
                            }
                            disabled={!isEditing || index === 0}
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "blocks",
                                "paragraphs",
                                index,
                                "down",
                                2
                              )
                            }
                            disabled={
                              !isEditing ||
                              index === aboutPageForm.blocks[2].paragraphs.length - 1
                            }
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() =>
                              handleRemoveArrayItem(
                                "blocks",
                                "paragraphs",
                                index,
                                2
                              )
                            }
                            disabled={!isEditing}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          id={`vision-textarea-${index}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                          value={paragraph || ""}
                          onChange={(e) =>
                            handleNestedFormChange(
                              "blocks",
                              "paragraphs",
                              null,
                              e.target.value,
                              2,
                              index
                            )
                          }
                          disabled={!isEditing}
                          rows={3}
                        />
                        {isEditing && (
                          <div className="mt-1 flex items-center">
                            <button
                              type="button"
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded mr-2"
                              onClick={() => {
                                const textarea = document.getElementById(`vision-textarea-${index}`);
                                if (textarea) {
                                  const cursorPos = textarea.selectionStart;
                                  const textBefore = textarea.value.substring(0, cursorPos);
                                  const textAfter = textarea.value.substring(cursorPos);
                                  const newValue = textBefore + "\n\n" + textAfter;
                                  
                                  handleNestedFormChange(
                                    "blocks",
                                    "paragraphs",
                                    null,
                                    newValue,
                                    2,
                                    index
                                  );
                                  
                                  // Restore cursor position after state update
                                  setTimeout(() => {
                                    textarea.focus();
                                    textarea.setSelectionRange(cursorPos + 2, cursorPos + 2);
                                  }, 0);
                                }
                              }}
                            >
                              Add Line Break
                            </button>
                            <button
                              type="button"
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded mr-2 ml-2"
                              onClick={() => handleAddArrayItem("blocks", "", "paragraphs", 2)}
                            >
                              Add New Paragraph
                            </button>
                            <p className="text-xs text-gray-500">Place cursor where you want to add a paragraph break</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isEditing && (
                    <button
                      type="button"
                      className="flex items-center text-sm text-teal-600 hover:text-teal-800 mt-2"
                      onClick={() =>
                        handleAddArrayItem(
                          "blocks",
                          "",
                          "paragraphs",
                          2
                        )
                      }
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Paragraph
                    </button>
                  )}
                </div>
              </div>
              )}

              {/* Our Mission Section */}
              {activeAboutSection === "mission" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Our Mission</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Edit the company mission section.
                </p>

                <div className="mb-4">
                  <Input
                    label="Section Title"
                    value={aboutPageForm.blocks[3]?.title || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "title",
                        e.target.value,
                        3
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>
                
                {isEditing && (
                  <div className="mb-4">
                    <textarea
                      id="mission-section-paragraph"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Add a paragraph here..."
                      rows={3}
                      onChange={(e) => {
                        // Create a new paragraph if none exists
                        if (!aboutPageForm.blocks[3]?.paragraphs || aboutPageForm.blocks[3].paragraphs.length === 0) {
                          handleAddArrayItem(
                            "blocks",
                            e.target.value,
                            "paragraphs",
                            3
                          );
                        } else {
                          // Update the first paragraph
                          handleNestedFormChange(
                            "blocks",
                            "paragraphs",
                            null,
                            e.target.value,
                            3,
                            0
                          );
                        }
                      }}
                    />
                    <div className="mt-1 flex items-center">
                      <button
                        type="button"
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded mr-2"
                        onClick={() => {
                          const textarea = document.getElementById("mission-section-paragraph");
                          if (textarea) {
                            const cursorPos = textarea.selectionStart;
                            const textBefore = textarea.value.substring(0, cursorPos);
                            const textAfter = textarea.value.substring(cursorPos);
                            textarea.value = textBefore + "\n\n" + textAfter;
                            
                            // Create a new paragraph if none exists
                            if (!aboutPageForm.blocks[3]?.paragraphs || aboutPageForm.blocks[3].paragraphs.length === 0) {
                              handleAddArrayItem(
                                "blocks",
                                textarea.value,
                                "paragraphs",
                                3
                              );
                            } else {
                              // Update the first paragraph
                              handleNestedFormChange(
                                "blocks",
                                "paragraphs",
                                null,
                                textarea.value,
                                3,
                                0
                              );
                            }
                            
                            // Restore cursor position after state update
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(cursorPos + 2, cursorPos + 2);
                            }, 0);
                          }
                        }}
                      >
                        Add Line Break
                      </button>
                      <button
                        type="button"
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded mr-2 ml-2"
                        onClick={() => handleAddArrayItem("blocks", "", "paragraphs", 3)}
                      >
                        Add New Paragraph
                      </button>
                      <p className="text-xs text-gray-500">Place cursor where you want to add a paragraph break</p>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mission Paragraphs
                  </label>
                  {aboutPageForm.blocks[3]?.paragraphs && aboutPageForm.blocks[3].paragraphs.map((paragraph, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Paragraph {index + 1}</h4>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "blocks",
                                "paragraphs",
                                index,
                                "up",
                                3
                              )
                            }
                            disabled={!isEditing || index === 0}
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "blocks",
                                "paragraphs",
                                index,
                                "down",
                                3
                              )
                            }
                            disabled={
                              !isEditing ||
                              index === aboutPageForm.blocks[3].paragraphs.length - 1
                            }
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() =>
                              handleRemoveArrayItem(
                                "blocks",
                                "paragraphs",
                                index,
                                3
                              )
                            }
                            disabled={!isEditing}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          id={`mission-textarea-${index}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                          value={paragraph || ""}
                          onChange={(e) =>
                            handleNestedFormChange(
                              "blocks",
                              "paragraphs",
                              null,
                              e.target.value,
                              3,
                              index
                            )
                          }
                          disabled={!isEditing}
                          rows={3}
                        />
                        {isEditing && (
                          <div className="mt-1 flex items-center">
                            <button
                              type="button"
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded mr-2"
                              onClick={() => {
                                const textarea = document.getElementById(`mission-textarea-${index}`);
                                if (textarea) {
                                  const cursorPos = textarea.selectionStart;
                                  const textBefore = textarea.value.substring(0, cursorPos);
                                  const textAfter = textarea.value.substring(cursorPos);
                                  const newValue = textBefore + "\n\n" + textAfter;
                                  
                                  handleNestedFormChange(
                                    "blocks",
                                    "paragraphs",
                                    null,
                                    newValue,
                                    3,
                                    index
                                  );
                                  
                                  // Restore cursor position after state update
                                  setTimeout(() => {
                                    textarea.focus();
                                    textarea.setSelectionRange(cursorPos + 2, cursorPos + 2);
                                  }, 0);
                                }
                              }}
                            >
                              Add Line Break
                            </button>
                            <button
                              type="button"
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded mr-2 ml-2"
                              onClick={() => handleAddArrayItem("blocks", "", "paragraphs", 3)}
                            >
                              Add New Paragraph
                            </button>
                            <p className="text-xs text-gray-500">Place cursor where you want to add a paragraph break</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isEditing && (
                    <button
                      type="button"
                      className="flex items-center text-sm text-teal-600 hover:text-teal-800 mt-2"
                      onClick={() =>
                        handleAddArrayItem(
                          "blocks",
                          "",
                          "paragraphs",
                          3
                        )
                      }
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Paragraph
                    </button>
                  )}
                </div>
              </div>
              )}

              {/* Meet Our Team Section removed */}

              {/* CTA Strip Section removed */}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render contact page editor
  const renderContactPageEditor = () => {
    if (loadingContactPage) return renderLoading();
    if (contactPageError) return renderError(contactPageError);
    if (!contactPageForm) return renderError("Contact page data not available");

    // Find blocks by their blockType
    const pageHeaderBlock = contactPageForm.blocks?.find(block => block.blockType === 'page_header');
    const contactInfoBlock = contactPageForm.blocks?.find(block => block.blockType === 'contact_info');
    const enquiryFormBlock = contactPageForm.blocks?.find(block => block.blockType === 'enquiry_form');
    const socialLinksBlock = contactPageForm.blocks?.find(block => block.blockType === 'social_links_row');

    // Get block indices for updating
    const getBlockIndex = (blockType) => {
      return contactPageForm.blocks?.findIndex(block => block.blockType === blockType) || 0;
    };

    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {renderEditorToolbar()}

          <div className="p-6">
            <p className="text-gray-500 mb-6">
              Edit your contact page content here. Changes will be automatically
              saved every 30 seconds while editing.
            </p>

            {/* Contact Page Section Navigation */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-2">
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeContactSection === "header" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveContactSection("header")}
              >
                Page Header
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeContactSection === "info" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveContactSection("info")}
              >
                Contact Information
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeContactSection === "form" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveContactSection("form")}
              >
                Enquiry Form
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeContactSection === "social" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveContactSection("social")}
              >
                Social Links
              </button>
            </div>

            <div className="space-y-8">
              {/* Page Header Section */}
              {activeContactSection === "header" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Page Header</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Configure the page header section.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Headline"
                    value={pageHeaderBlock?.headline || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "headline",
                        e.target.value,
                        getBlockIndex('page_header')
                      )
                    }
                    disabled={!isEditing}
                  />
                  <Input
                    label="Subheadline"
                    value={pageHeaderBlock?.subheadline || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "subheadline",
                        e.target.value,
                        getBlockIndex('page_header')
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                {/* <div className="mb-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Image
                  </label>
                  <div className="space-y-3">
                    <ImageUpload
                      label=""
                      value={pageHeaderBlock?.background_image?.url || ""}
                      onChange={(url) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "background_image",
                          "url",
                          url,
                          getBlockIndex('page_header')
                        )
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Alt Text"
                      value={pageHeaderBlock?.background_image?.alt || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "background_image",
                          "alt",
                          e.target.value,
                          getBlockIndex('page_header')
                        )
                      }
                      disabled={!isEditing}
                      placeholder="Enter image description"
                    />
                  </div>
                </div> */}
              </div>
              )}

              {/* Contact Information Section */}
              {activeContactSection === "info" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">
                  Contact Information
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Edit contact details and business hours.
                </p>

                <div className="mb-4">
                  <Input
                    label="Section Headline"
                    value={contactInfoBlock?.headline || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "headline",
                        e.target.value,
                        getBlockIndex('contact_info')
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-4">
                    <Input
                      label="Location Title"
                      value={contactInfoBlock?.location_title || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "location_title",
                          e.target.value,
                          getBlockIndex('contact_info')
                        )
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Location Subtitle"
                      value={contactInfoBlock?.location_subtitle || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "location_subtitle",
                          e.target.value,
                          getBlockIndex('contact_info')
                        )
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Address Line 1"
                      value={contactInfoBlock?.address_line1 || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "address_line1",
                          e.target.value,
                          getBlockIndex('contact_info')
                        )
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Address Line 2"
                      value={contactInfoBlock?.address_line2 || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "address_line2",
                          e.target.value,
                          getBlockIndex('contact_info')
                        )
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Address Line 3"
                      value={contactInfoBlock?.address_line3 || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "address_line3",
                          e.target.value,
                          getBlockIndex('contact_info')
                        )
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Address Line 4"
                      value={contactInfoBlock?.address_line4 || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "address_line4",
                          e.target.value,
                          getBlockIndex('contact_info')
                        )
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="General Email"
                      value={contactInfoBlock?.general_email || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "general_email",
                          e.target.value,
                          getBlockIndex('contact_info')
                        )
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Support Email"
                      value={contactInfoBlock?.support_email || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "support_email",
                          e.target.value,
                          getBlockIndex('contact_info')
                        )
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Phone"
                      value={contactInfoBlock?.phone || ""}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "phone",
                          e.target.value,
                          getBlockIndex('contact_info')
                        )
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Hours (Weekday)
                  </label>
                  <Input
                    value={contactInfoBlock?.business_hours_weekday || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "business_hours_weekday",
                        e.target.value,
                        getBlockIndex('contact_info')
                      )
                    }
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: Monday-Friday: 9am-6pm EST
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Hours (Weekend)
                  </label>
                  <Input
                    value={contactInfoBlock?.business_hours_sat || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "business_hours_sat",
                        e.target.value,
                        getBlockIndex('contact_info')
                      )
                    }
                    disabled={!isEditing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: Saturday: 10am-4pm EST
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Map Embed URL
                  </label>
                  <Input
                    value={contactInfoBlock?.map_embed_url || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "map_embed_url",
                        e.target.value,
                        getBlockIndex('contact_info')
                      )
                    }
                    disabled={!isEditing}
                    placeholder="https://www.google.com/maps/embed?..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the Google Maps embed URL.
                  </p>
                </div>
              </div>
              )}

              {/* Enquiry Form Section */}
              {activeContactSection === "form" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Enquiry Form</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Configure the contact form settings.
                </p>

                <div className="mb-4">
                  <Input
                    label="Form Headline"
                    value={contactPageForm.blocks.find(block => block.blockType === 'enquiry_form')?.headline || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "headline",
                        e.target.value,
                        getBlockIndex('enquiry_form')
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    value={contactPageForm.blocks.find(block => block.blockType === 'enquiry_form')?.description || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "description",
                        e.target.value,
                        getBlockIndex('enquiry_form')
                      )
                    }
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Success Message
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    value={contactPageForm.blocks.find(block => block.blockType === 'enquiry_form')?.success_message || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "success_message",
                        e.target.value,
                        getBlockIndex('enquiry_form')
                      )
                    }
                    disabled={!isEditing}
                    rows={2}
                  />
                </div>

                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable_form"
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                      checked={contactPageForm.blocks.find(block => block.blockType === 'enquiry_form')?.enabled || false}
                      onChange={(e) =>
                        handleNestedFormChange(
                          "blocks",
                          null,
                          "enabled",
                          e.target.checked,
                          getBlockIndex('enquiry_form')
                        )
                      }
                      disabled={!isEditing}
                    />
                    <label
                      htmlFor="enable_form"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Enable enquiry form
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    When disabled, the form will not be shown to visitors.
                  </p>
                </div>
              </div>
              )}

              {/* Social Links Section */}
              {activeContactSection === "social" && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">Social Links</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Manage social media links.
                </p>

                <div className="mb-4">
                  <Input
                    label="Section Headline"
                    value={contactPageForm.blocks.find(block => block.blockType === 'social_links_row')?.headline || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        "blocks",
                        null,
                        "headline",
                        e.target.value,
                        getBlockIndex('social_links_row')
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                {contactPageForm.blocks.find(block => block.blockType === 'social_links_row')?.links &&
                  contactPageForm.blocks.find(block => block.blockType === 'social_links_row').links.map((link, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-3 mb-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Social Link {index + 1}</h4>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "blocks",
                                "links",
                                index,
                                "up",
                                getBlockIndex('social_links_row')
                              )
                            }
                            disabled={!isEditing || index === 0}
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "blocks",
                                "links",
                                index,
                                "down",
                                getBlockIndex('social_links_row')
                              )
                            }
                            disabled={
                              !isEditing ||
                              index ===
                                contactPageForm.blocks.find(block => block.blockType === 'social_links_row').links.length -
                                  1
                            }
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() =>
                              handleRemoveArrayItem(
                                "blocks",
                                "links",
                                index,
                                getBlockIndex('social_links_row')
                              )
                            }
                            disabled={!isEditing}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Platform"
                          value={link.platform || ""}
                          onChange={(e) =>
                            handleNestedFormChange(
                              "blocks",
                              "links",
                              "platform",
                              e.target.value,
                              getBlockIndex('social_links_row'),
                              index
                            )
                          }
                          disabled={!isEditing}
                        />
                        <Input
                          label="URL"
                          value={link.url || ""}
                          onChange={(e) =>
                            handleNestedFormChange(
                              "blocks",
                              "links",
                              "url",
                              e.target.value,
                              getBlockIndex('social_links_row'),
                              index
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="mt-2">
                        <Input
                          label="Icon"
                          value={link.icon || ""}
                          onChange={(e) =>
                            handleNestedFormChange(
                              "blocks",
                              "links",
                              "icon",
                              e.target.value,
                              getBlockIndex('social_links_row'),
                              index
                            )
                          }
                          disabled={!isEditing}
                          placeholder="fa-facebook, fa-twitter, etc."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter Font Awesome icon class name.
                        </p>
                      </div>
                    </div>
                  ))}

                {isEditing && (
                  <button
                    type="button"
                    className="flex items-center text-sm text-teal-600 hover:text-teal-800 mt-2"
                    onClick={() =>
                      handleAddArrayItem(
                        "blocks",
                        {
                          platform: "",
                          url: "",
                          icon: "",
                        },
                        "links",
                        getBlockIndex('social_links_row')
                      )
                    }
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Social Link
                  </button>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render footer editor
  const renderFooterEditor = () => {
    if (loadingFooter) return renderLoading();
    if (footerError) return renderError(footerError);
    if (!footerForm) return renderError("Footer data not available");

    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {renderEditorToolbar()}

          <div className="p-6">
            <p className="text-gray-500 mb-6">
              Edit your global footer content here. Changes will be
              automatically saved every 30 seconds while editing.
            </p>

            {/* Footer Section Navigation */}
            <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-2">
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeFooterSection === "brand" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveFooterSection("brand")}
              >
                Brand Information
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeFooterSection === "quick" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveFooterSection("quick")}
              >
                Quick Links
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeFooterSection === "info" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveFooterSection("info")}
              >
                Information Links
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeFooterSection === "nav" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveFooterSection("nav")}
              >
                Footer Navigation
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeFooterSection === "newsletter" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveFooterSection("newsletter")}
              >
                Newsletter Signup
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeFooterSection === "social" ? "bg-teal-100 text-teal-800" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => setActiveFooterSection("social")}
              >
                Social Media Links
              </button>
            </div>

            <div className="space-y-8">
              {/* Brand Information Section */}
              {activeFooterSection === "brand" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">
                  Brand Information
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Edit brand name and description.
                </p>

                <div className="mb-4">
                  <Input
                    label="Brand Name"
                    value={footerForm.brand_info?.name || ""}
                    onChange={(e) =>
                      handleFooterNestedFormChange(
                        "brand_info",
                        null,
                        "name",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    value={footerForm.brand_info?.description || ""}
                    onChange={(e) =>
                      handleFooterNestedFormChange(
                        "brand_info",
                        null,
                        "description",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-4">
                    {footerForm.brand_info?.logo_url && (
                      <div className="w-24 h-24 relative border border-gray-200 rounded-md overflow-hidden">
                        <img
                          src={footerForm.brand_info.logo_url}
                          alt="Brand Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        label="Logo URL"
                        value={footerForm.brand_info?.logo_url || ""}
                        onChange={(e) =>
                          handleFooterNestedFormChange(
                            "brand_info",
                            null,
                            "logo_url",
                            e.target.value
                          )
                        }
                        disabled={!isEditing}
                      />
                      <Input
                        label="Logo Alt Text"
                        value={footerForm.brand_info?.logo_alt || ""}
                        onChange={(e) =>
                          handleFooterNestedFormChange(
                            "brand_info",
                            null,
                            "logo_alt",
                            e.target.value
                          )
                        }
                        disabled={!isEditing}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Input
                    label="Copyright Text"
                    value={footerForm.brand_info?.copyright_text || ""}
                    onChange={(e) =>
                      handleFooterNestedFormChange(
                        "brand_info",
                        null,
                        "copyright_text",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                    placeholder="© 2023 Your Brand Name. All rights reserved."
                  />
                </div>
              </div>
              )}

              {/* Quick Links Section */}
              {activeFooterSection === "quick" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">
                  Quick Links
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Manage quick links in the footer.
                </p>

                <div className="mb-4">
                  <Input
                    label="Section Title"
                    value={footerForm.quickLinksTitle || ""}
                    onChange={(e) =>
                      handleFooterNestedFormChange(
                        "quickLinksTitle",
                        null,
                        null,
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                {/* Quick Links */}
                {footerForm.quickLinks && Array.isArray(footerForm.quickLinks) &&
                  footerForm.quickLinks.map((link, linkIndex) => (
                    <div
                      key={linkIndex}
                      className="border border-gray-200 rounded-md p-3 mb-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Link {linkIndex + 1}</h4>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "quickLinks",
                                undefined,
                                linkIndex,
                                "up",
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={!isEditing || linkIndex === 0}
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "quickLinks",
                                undefined,
                                linkIndex,
                                "down",
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={
                              !isEditing ||
                              linkIndex === footerForm.quickLinks.length - 1
                            }
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() =>
                              handleRemoveArrayItem(
                                "quickLinks",
                                undefined,
                                linkIndex,
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={!isEditing}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Link Text"
                          value={link.label || ""}
                          onChange={(e) =>
                            handleFooterNestedFormChange(
                              "quickLinks",
                              null,
                              "label",
                              e.target.value,
                              null,
                              linkIndex
                            )
                          }
                          disabled={!isEditing}
                        />
                        <Input
                          label="Link URL"
                          value={link.url || ""}
                          onChange={(e) =>
                            handleFooterNestedFormChange(
                              "quickLinks",
                              null,
                              "url",
                              e.target.value,
                              null,
                              linkIndex
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  ))}

                {isEditing && (
                  <button
                    type="button"
                    className="flex items-center text-sm text-teal-600 hover:text-teal-800 mt-2"
                    onClick={() =>
                      handleFooterAddArrayItem(
                        "quickLinks",
                        null,
                        {
                          label: "",
                          url: "",
                        }
                      )
                    }
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Quick Link
                  </button>
                )}
              </div>
              )}

              {/* Information Links Section */}
              {activeFooterSection === "info" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">
                  Information Links
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Manage information links in the footer.
                </p>

                <div className="mb-4">
                  <Input
                    label="Section Title"
                    value={footerForm.informationTitle || ""}
                    onChange={(e) =>
                      handleFooterNestedFormChange(
                        "informationTitle",
                        null,
                        null,
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                {/* Information Links */}
                {footerForm.informationLinks && Array.isArray(footerForm.informationLinks) &&
                  footerForm.informationLinks.map((link, linkIndex) => (
                    <div
                      key={linkIndex}
                      className="border border-gray-200 rounded-md p-3 mb-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Link {linkIndex + 1}</h4>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "informationLinks",
                                undefined,
                                linkIndex,
                                "up",
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={!isEditing || linkIndex === 0}
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "informationLinks",
                                undefined,
                                linkIndex,
                                "down",
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={
                              !isEditing ||
                              linkIndex === footerForm.informationLinks.length - 1
                            }
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() =>
                              handleRemoveArrayItem(
                                "informationLinks",
                                undefined,
                                linkIndex,
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={!isEditing}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Link Text"
                          value={link.label || ""}
                          onChange={(e) =>
                            handleFooterNestedFormChange(
                              "informationLinks",
                              null,
                              "label",
                              e.target.value,
                              null,
                              linkIndex
                            )
                          }
                          disabled={!isEditing}
                        />
                        <Input
                          label="Link URL"
                          value={link.url || ""}
                          onChange={(e) =>
                            handleFooterNestedFormChange(
                              "informationLinks",
                              null,
                              "url",
                              e.target.value,
                              null,
                              linkIndex
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  ))}

                {isEditing && (
                  <button
                    type="button"
                    className="flex items-center text-sm text-teal-600 hover:text-teal-800 mt-2"
                    onClick={() =>
                      handleFooterAddArrayItem(
                        "informationLinks",
                        null,
                        {
                          label: "",
                          url: "",
                        }
                      )
                    }
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Information Link
                  </button>
                )}
              </div>
              )}

              {/* Footer Navigation Section */}
              {activeFooterSection === "nav" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">
                  Footer Navigation
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Manage footer navigation columns and links.
                </p>

                {/* Navigation Columns */}
                {footerForm.navigation_columns && Array.isArray(footerForm.navigation_columns) &&
                  footerForm.navigation_columns.map((column, columnIndex) => (
                    <div
                      key={columnIndex}
                      className="border border-gray-200 rounded-md p-3 mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">
                          Navigation Column {columnIndex + 1}
                        </h4>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "navigation_columns",
                                undefined,
                                columnIndex,
                                "up",
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={!isEditing || columnIndex === 0}
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "navigation_columns",
                                undefined,
                                columnIndex,
                                "down",
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={
                              !isEditing ||
                              columnIndex ===
                                footerForm.navigation_columns.length - 1
                            }
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() =>
                              handleRemoveArrayItem(
                                "navigation_columns",
                                undefined,
                                columnIndex,
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={!isEditing}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <Input
                          label="Column Title"
                          value={column.title || ""}
                          onChange={(e) =>
                            handleFooterNestedFormChange(
                              "navigation_columns",
                              null,
                              "title",
                              e.target.value,
                              columnIndex,
                              "footerForm"
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>

                      {/* Links within this column */}
                      <div className="ml-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Links
                        </h5>

                        {column.links && Array.isArray(column.links) &&
                          column.links.map((link, linkIndex) => (
                            <div
                              key={linkIndex}
                              className="border border-gray-200 rounded-md p-3 mb-2"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h6 className="text-sm font-medium">
                                  Link {linkIndex + 1}
                                </h6>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    className="p-1 text-gray-500 hover:text-gray-700"
                                    onClick={() =>
                                      handleMoveArrayItem(
                                        "navigation_columns",
                                        "links",
                                        linkIndex,
                                        "up",
                                        columnIndex,
                                        "footerForm"
                                      )
                                    }
                                    disabled={!isEditing || linkIndex === 0}
                                  >
                                    <ArrowUpIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="p-1 text-gray-500 hover:text-gray-700"
                                    onClick={() =>
                                      handleMoveArrayItem(
                                        "navigation_columns",
                                        "links",
                                        linkIndex,
                                        "down",
                                        columnIndex,
                                        "footerForm"
                                      )
                                    }
                                    disabled={
                                      !isEditing ||
                                      linkIndex === column.links.length - 1
                                    }
                                  >
                                    <ArrowDownIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="p-1 text-red-500 hover:text-red-700"
                                    onClick={() =>
                                      handleRemoveArrayItem(
                                        "navigation_columns",
                                        "links",
                                        linkIndex,
                                        columnIndex,
                                        "footerForm"
                                      )
                                    }
                                    disabled={!isEditing}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                  label="Link Text"
                                  value={link.text || ""}
                                  onChange={(e) =>
                                    handleFooterNestedFormChange(
                                      "navigation_columns",
                                      "links",
                                      "text",
                                      e.target.value,
                                      columnIndex,
                                      linkIndex
                                    )
                                  }
                                  disabled={!isEditing}
                                />
                                <Input
                                  label="Link URL"
                                  value={link.url || ""}
                                  onChange={(e) =>
                                    handleFooterNestedFormChange(
                                      "navigation_columns",
                                      "links",
                                      "url",
                                      e.target.value,
                                      columnIndex,
                                      linkIndex
                                    )
                                  }
                                  disabled={!isEditing}
                                />
                              </div>
                            </div>
                          ))}

                        {isEditing && (
                          <button
                            type="button"
                            className="flex items-center text-sm text-teal-600 hover:text-teal-800 mt-2"
                            onClick={() =>
                              handleAddArrayItem(
                                "navigation_columns",
                                "links",
                                {
                                  text: "",
                                  url: "",
                                },
                                columnIndex,
                                "footerForm"
                              )
                            }
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Link
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                {isEditing && (
                  <button
                    type="button"
                    className="flex items-center text-sm text-teal-600 hover:text-teal-800 mt-2"
                    onClick={() =>
                      handleFooterAddArrayItem(
                        "navigation_columns",
                        null,
                        {
                          title: "",
                          links: [{ text: "", url: "" }],
                        }
                      )
                    }
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Navigation Column
                  </button>
                )}
              </div>
              )}

              {/* Newsletter Signup Section */}
              {activeFooterSection === "newsletter" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">
                  Newsletter Signup
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Configure the newsletter signup section.
                </p>

                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="show_newsletter"
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                      checked={footerForm.newsletter?.enabled || false}
                      onChange={(e) =>
                        handleFooterNestedFormChange(
                          "newsletter",
                          null,
                          "enabled",
                          e.target.checked
                        )
                      }
                      disabled={!isEditing}
                    />
                    <label
                      htmlFor="show_newsletter"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Show newsletter signup in footer
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <Input
                    label="Newsletter Headline"
                    value={footerForm.newsletterHeadline || ""}
                    onChange={(e) =>
                      handleFooterNestedFormChange(
                        "newsletterHeadline",
                        null,
                        null,
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Newsletter Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    value={footerForm.newsletterSubtext || ""}
                    onChange={(e) =>
                      handleFooterNestedFormChange(
                        "newsletterSubtext",
                        null,
                        null,
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                    rows={2}
                  />
                </div>

                <div className="mb-4">
                  <Input
                    label="Button Text"
                    value={footerForm.newsletter?.button_text || ""}
                    onChange={(e) =>
                      handleFooterNestedFormChange(
                        "newsletter",
                        null,
                        "button_text",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="mb-4">
                  <Input
                    label="Success Message"
                    value={footerForm.newsletter?.success_message || ""}
                    onChange={(e) =>
                      handleFooterNestedFormChange(
                        "newsletter",
                        null,
                        "success_message",
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
              )}

              {/* Social Media Links */}
              {activeFooterSection === "social" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-700 mb-2">
                  Social Media Links
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Manage social media links in the footer.
                </p>

                {footerForm.socialLinks && Array.isArray(footerForm.socialLinks) &&
                  footerForm.socialLinks.map((link, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-3 mb-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Social Link {index + 1}</h4>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "socialLinks",
                                undefined,
                                index,
                                "up",
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={!isEditing || index === 0}
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700"
                            onClick={() =>
                              handleMoveArrayItem(
                                "socialLinks",
                                undefined,
                                index,
                                "down",
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={
                              !isEditing ||
                              index === footerForm.socialLinks .length - 1
                            }
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-500 hover:text-red-700"
                            onClick={() =>
                              handleRemoveArrayItem(
                                "socialLinks",
                                undefined,
                                index,
                                undefined,
                                "footerForm"
                              )
                            }
                            disabled={!isEditing}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Platform"
                          value={link.platform || ""}
                          onChange={(e) =>
                            handleFooterNestedFormChange(
                              "socialLinks",
                              null,
                              "platform",
                              e.target.value,
                              null,
                              index
                            )
                          }
                          disabled={!isEditing}
                        />
                        <Input
                          label="URL"
                          value={link.url || ""}
                          onChange={(e) =>
                            handleFooterNestedFormChange(
                              "socialLinks",
                              null,
                              "url",
                              e.target.value,
                              null,
                              index
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="mt-2">
                        <Input
                          label="Icon"
                          value={link.icon || ""}
                          onChange={(e) =>
                            handleFooterNestedFormChange(
                              "socialLinks",
                              null,
                              "icon",
                              e.target.value,
                              null,
                              index
                            )
                          }
                          disabled={!isEditing}
                          placeholder="fa-facebook, fa-twitter, etc."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter Font Awesome icon class name.
                        </p>
                      </div>
                    </div>
                  ))}

                {isEditing && (
                  <button
                    type="button"
                    className="flex items-center text-sm text-teal-600 hover:text-teal-800 mt-2"
                    onClick={() =>
                      handleFooterAddArrayItem(
                        "socialLinks",
                        null,
                        {
                          platform: "",
                          url: "",
                          icon: "",
                        }
                      )
                    }
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Social Link
                  </button>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="h-full">
      <Tab.Group
        selectedIndex={[
          "home",
          "about",
          "contact",
          "footer"
        ].indexOf(activeTab)}
        onChange={(index) =>
          setActiveTab(
            ["home", "about", "contact", "footer"][index]
          )
        }
      >
        <Tab.List className="flex border-b border-gray-200 bg-white">
          <Tab
            className={({ selected }) => `
            px-4 py-2 text-sm font-medium border-b-2 focus:outline-none whitespace-nowrap
            ${selected ? "border-java-500 text-java-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
          `}
          >
            Home Page
          </Tab>
          <Tab
            className={({ selected }) => `
            px-4 py-2 text-sm font-medium border-b-2 focus:outline-none whitespace-nowrap
            ${selected ? "border-java-500 text-java-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
          `}
          >
            About Page
          </Tab>
          <Tab
            className={({ selected }) => `
            px-4 py-2 text-sm font-medium border-b-2 focus:outline-none whitespace-nowrap
            ${selected ? "border-java-500 text-java-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
          `}
          >
            Contact Page
          </Tab>
          <Tab
            className={({ selected }) => `
            px-4 py-2 text-sm font-medium border-b-2 focus:outline-none whitespace-nowrap
            ${selected ? "border-java-500 text-java-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
          `}
          >
            Footer
          </Tab>

        </Tab.List>

        <Tab.Panels className="flex-1 overflow-auto">
          <Tab.Panel className="h-full">{renderHomePageEditor()}</Tab.Panel>
          <Tab.Panel className="h-full">{renderAboutPageEditor()}</Tab.Panel>
          <Tab.Panel className="h-full">{renderContactPageEditor()}</Tab.Panel>
          <Tab.Panel className="h-full">{renderFooterEditor()}</Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default SiteContentManagement;