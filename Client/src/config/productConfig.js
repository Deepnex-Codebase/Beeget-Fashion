// Product Configuration - Dynamic options for all dropdowns

export const PRODUCT_CONFIG = {
  // Color options
  COLORS: [
    'Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 
    'Purple', 'Orange', 'Brown', 'Grey'
  ],

  // Fabric options
  FABRICS: [
    'Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Rayon', 'Denim',
    'Chiffon', 'Georgette', 'Crepe', 'Net', 'Satin', 'Velvet', 'Lycra',
    'Spandex', 'Cotton Blend', 'Poly Cotton'
  ],

  // Fit/Shape options
  FIT_SHAPES: [
    'Regular', 'Slim', 'Loose', 'Tight', 'Oversized', 'A-Line',
    'Straight', 'Flared', 'Bodycon', 'Relaxed'
  ],

  // Length options
  LENGTHS: [
    'Crop', 'Short', 'Regular', 'Long', 'Maxi', 'Mini', 'Midi',
    'Knee Length', 'Ankle Length', 'Floor Length'
  ],

  // Neck Type options
  NECK_TYPES: [
    'Round Neck', 'V Neck', 'Scoop Neck', 'High Neck', 'Boat Neck',
    'Off Shoulder', 'Halter Neck', 'Square Neck', 'Sweetheart',
    'Collar', 'Mandarin Collar', 'Peter Pan Collar'
  ],

  // Occasion options
  OCCASIONS: [
    'Casual', 'Formal', 'Party', 'Wedding', 'Festival', 'Office',
    'Sports', 'Beach', 'Travel', 'Date Night', 'Ethnic', 'Western'
  ],

  // Pattern options
  PATTERNS: [
    'Solid', 'Printed', 'Striped', 'Checked', 'Polka Dots', 'Floral',
    'Abstract', 'Geometric', 'Animal Print', 'Embroidered', 'Embellished'
  ],

  // Print Type options
  PRINT_TYPES: [
    'Digital Print', 'Screen Print', 'Block Print', 'Tie Dye', 'Batik',
    'Foil Print', 'Rubber Print', 'Discharge Print', 'Sublimation Print',
    'Heat Transfer'
  ],

  // Sleeve Type options
  SLEEVE_TYPES: [
    'Sleeveless', 'Short Sleeve', '3/4 Sleeve', 'Long Sleeve', 'Full Sleeve',
    'Cap Sleeve', 'Bell Sleeve', 'Puff Sleeve', 'Bishop Sleeve', 'Raglan Sleeve'
  ],

  // Stitching Type options
  STITCHING_TYPES: [
    'Machine Stitched', 'Hand Stitched', 'Overlock', 'French Seam',
    'Flat Fell Seam', 'Blind Hem', 'Serged', 'Zigzag Stitch',
    'Chain Stitch', 'Lock Stitch'
  ],

  // Country of Origin options
  COUNTRIES: [
    'India', 'China', 'Bangladesh', 'Vietnam', 'Turkey', 'Pakistan',
    'Sri Lanka', 'Thailand', 'Indonesia', 'Myanmar', 'Cambodia', 'Nepal'
  ],

  // Brand options
  BRANDS: [
    'Nike', 'Adidas', 'Puma', 'Zara', 'H&M', 'Uniqlo', 'Forever 21',
    'Mango', 'Bershka', 'Pull & Bear', 'Other'
  ],

  // Embellishment options
  EMBELLISHMENTS: [
    'None', 'Embroidery', 'Sequins', 'Beads', 'Lace', 'Applique',
    'Rhinestones', 'Patches', 'Studs', 'Tassels', 'Fringe'
  ],

  // Ornamentation options (alias for embellishments)
  ORNAMENTATIONS: [
    'None', 'Embroidery', 'Sequins', 'Beads', 'Lace', 'Applique',
    'Rhinestones', 'Patches', 'Studs', 'Tassels', 'Fringe'
  ],

  // Sleeve Length options
  SLEEVE_LENGTHS: [
    'Sleeveless', 'Short Sleeve', '3/4 Sleeve', 'Long Sleeve', 'Full Sleeve',
    'Cap Sleeve', 'Bell Sleeve', 'Puff Sleeve', 'Bishop Sleeve', 'Raglan Sleeve'
  ],

  // Sleeve Styling options
  SLEEVE_STYLINGS: [
    'Regular', 'Rolled Up', 'Cuffed', 'Gathered', 'Pleated', 'Ruffled',
    'Balloon', 'Lantern', 'Flared', 'Fitted'
  ],
  
  // Stitch Type options
  STITCH_TYPES: [
    'Regular', 'Overlock', 'Flatlock', 'Coverstitch', 'Zigzag', 'Blind Stitch',
    'Chain Stitch', 'Lock Stitch', 'Bartack', 'Buttonhole'
  ],

  // Hem Styling options
  HEM_STYLINGS: [
    'Regular', 'Rolled Up', 'Cuffed', 'Gathered', 'Pleated', 'Ruffled',
    'Balloon', 'Lantern', 'Flared', 'Fitted'
  ],

  // GST Rate options
  GST_RATES: [
    { value: '0', label: '0%' },
    { value: '5', label: '5%' },
    { value: '12', label: '12%' },
    { value: '18', label: '18%' },
    { value: '28', label: '28%' }
  ],

  // Combo Pack options
  COMBO_PACKS: [1, 2, 3, 4, 5, 6],

  // Required variant fields configuration
  VARIANT_FIELDS: {
    REQUIRED: [
      'price',
      'mrp', 
      'stock',
      'bustSize',
      'shoulderSize', 
      'waistSize',
      'sizeLength',
      'attributes'
    ],
    OPTIONAL: [
      'wrongDefectivePrice',
      'hipSize',
      'sku'
    ]
  },

  // Field validation rules
  VALIDATION_RULES: {
    // Product level fields
    title: {
      type: 'string',
      required: true,
      message: 'Product name is required'
    },
    description: {
      type: 'string',
      required: true,
      message: 'Product description is required'
    },
    category: {
      type: 'string',
      required: true,
      message: 'Product category is required'
    },
    gstRate: {
      type: 'string',
      required: true,
      message: 'GST rate is required'
    },
    // Variant level fields
    price: {
      type: 'number',
      min: 0.01,
      required: true,
      message: 'Valid selling price is required'
    },
    mrp: {
      type: 'number', 
      min: 0.01,
      required: true,
      message: 'Valid MRP is required'
    },
    stock: {
      type: 'integer',
      min: 0,
      required: true,
      message: 'Valid stock quantity is required'
    },
    bustSize: {
      type: 'number',
      min: 0.01,
      required: true,
      message: 'Valid bust size is required'
    },
    attributes: {
      type: 'object',
      required: true,
      message: 'Variant attributes are required'
    },
    shoulderSize: {
      type: 'number',
      min: 0.01, 
      required: true,
      message: 'Valid shoulder size is required'
    },
    waistSize: {
      type: 'number',
      min: 0.01,
      required: true,
      message: 'Valid waist size is required'
    },
    sizeLength: {
      type: 'number',
      min: 0.01,
      required: true,
      message: 'Valid size length is required'
    },
    wrongDefectivePrice: {
      type: 'number',
      min: 0,
      required: false,
      message: 'Valid return price is required'
    },
    hipSize: {
      type: 'number',
      min: 0.01,
      required: false,
      message: 'Valid hip size is required'
    },

  },

  // Field labels for display
  FIELD_LABELS: {
    price: 'Selling Price',
    wrongDefectivePrice: 'Return Price',
    mrp: 'MRP',
    stock: 'Inventory',
    sku: 'Product SKU',
    bustSize: 'Bust',
    shoulderSize: 'Shoulder', 
    waistSize: 'Waist',
    sizeLength: 'Length',
    hipSize: 'Hip',
    printPatternType: 'Print Type',
    comboOf: 'Combo Pack',
    fitShape: 'Fit',
    styleCode: 'Product Code',
    manufacturerDetails: 'Manufacturer Info',
    packerDetails: 'Packer Info',
    countryOfOrigin: 'Country of Origin',
    attributes: 'Attributes'
  }
};

// Helper function to get dropdown options
export const getDropdownOptions = (optionType) => {
  // Map common option types to their config keys
  const optionMap = {
    'colors': 'COLORS',
    'fabrics': 'FABRICS',
    'fitShapes': 'FIT_SHAPES',
    'lengths': 'LENGTHS',
    'neckTypes': 'NECK_TYPES',
    'occasions': 'OCCASIONS',
    'patterns': 'PATTERNS',
    'printTypes': 'PRINT_TYPES',
    'sleeveTypes': 'SLEEVE_TYPES',
    'stitchingTypes': 'STITCHING_TYPES',
    'countries': 'COUNTRIES',
    'brands': 'BRANDS',
    'embellishments': 'EMBELLISHMENTS',
    'ornamentations': 'ORNAMENTATIONS',
    'sleeveLengths': 'SLEEVE_LENGTHS',
    'sleeveStylings': 'SLEEVE_STYLINGS',
    'hemStylings': 'HEM_STYLINGS',
    'stitchTypes': 'STITCH_TYPES',
    'gstRates': 'GST_RATES',
    'comboPacks': 'COMBO_PACKS'
  };

  // Get the correct config key
  const configKey = optionMap[optionType] || optionType.toUpperCase();
  const options = PRODUCT_CONFIG[configKey] || [];
  
  // Handle special case for GST rates which have value/label structure
  if (optionType === 'gstRates') {
    return options.map(item => item.value);
  }
  
  // Handle special case for combo packs
  if (optionType === 'comboPacks') {
    return PRODUCT_CONFIG.COMBO_PACKS || [];
  }
  
  return options;
};

// Helper function to validate field
export const validateField = (fieldName, value) => {
  const rule = PRODUCT_CONFIG.VALIDATION_RULES[fieldName];
  if (!rule) return { isValid: true };

  // Check if required field is empty
  if (rule.required) {
    // Handle special case for number fields
    if (rule.type === 'number' || rule.type === 'integer') {
      if (value === undefined || value === null || value === '' || isNaN(parseFloat(value))) {
        return {
          isValid: false,
          message: rule.message
        };
      }
    } else if (!value || value.toString().trim() === '') {
      return {
        isValid: false,
        message: rule.message
      };
    }
  }

  // Skip validation if field is optional and empty
  if (!rule.required && (!value || value.toString().trim() === '')) {
    return { isValid: true };
  }

  // Type validation
  if (rule.type === 'number') {
    // Skip if value is empty and not required (already handled above)
    if (value === undefined || value === null || value === '') {
      // This case is already handled in the required check above
      return { isValid: true };
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return {
        isValid: false,
        message: 'Please enter a valid number'
      };
    }
    if (rule.min !== undefined && numValue < rule.min) {
      return {
        isValid: false,
        message: `Value must be at least ${rule.min}`
      };
    }
  }

  if (rule.type === 'integer') {
    // Skip if value is empty and not required (already handled above)
    if (value === undefined || value === null || value === '') {
      // This case is already handled in the required check above
      return { isValid: true };
    }
    
    const intValue = parseInt(value);
    if (isNaN(intValue)) {
      return {
        isValid: false,
        message: 'Please enter a valid integer'
      };
    }
    if (rule.min !== undefined && intValue < rule.min) {
      return {
        isValid: false,
        message: rule.message
      };
    }
  }
  
    if (rule.type === 'object') {
    // First check if value is null or undefined
    if (value === null || value === undefined) {
      return {
        isValid: false,
        message: rule.message
      };
    }
    
    // Then check if it's an object
    if (typeof value !== 'object') {
      return {
        isValid: false,
        message: rule.message
      };
    }
    
    // Safely check if object has keys
    try {
      if (Object.keys(value).length === 0) {
        return {
          isValid: false,
          message: rule.message
        };
      }
    } catch (error) {
      return {
        isValid: false,
        message: rule.message
      };
    }
  }

  return { isValid: true };
};

// Helper function to get field label
export const getFieldLabel = (fieldName) => {
  return PRODUCT_CONFIG.FIELD_LABELS[fieldName] || fieldName;
};

export default PRODUCT_CONFIG;