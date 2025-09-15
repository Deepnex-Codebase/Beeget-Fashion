// Product Configuration - Dynamic validation and field definitions

export const PRODUCT_CONFIG = {
  // Required variant fields configuration
  VARIANT_FIELDS: {
    REQUIRED: [
      'sellingPrice',
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
      'sku',
      'kurtaWaistSize',
      'kurtaLengthSize',
      'kurtaHipSize',
      'bottomWaistSize',
      'bottomLengthSize',
      'bottomHipSize',
      'duppattaLengthSize'
    ]
  },

  // Field validation rules
  VALIDATION_RULES: {
    sellingPrice: {
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
    attributes: {
      type: 'object',
      required: true,
      message: 'Variant attributes are required'
    },
    kurtaWaistSize: {
      type: 'number',
      min: 0,
      required: false,
      message: 'Valid kurta waist size is required'
    },
    kurtaLengthSize: {
      type: 'number',
      min: 0,
      required: false,
      message: 'Valid kurta length size is required'
    },
    kurtaHipSize: {
      type: 'number',
      min: 0,
      required: false,
      message: 'Valid kurta hip size is required'
    },
    bottomWaistSize: {
      type: 'number',
      min: 0,
      required: false,
      message: 'Valid bottom waist size is required'
    },
    bottomLengthSize: {
      type: 'number',
      min: 0,
      required: false,
      message: 'Valid bottom length size is required'
    },
    bottomHipSize: {
      type: 'number',
      min: 0,
      required: false,
      message: 'Valid bottom hip size is required'
    },
    duppattaLengthSize: {
      type: 'number',
      min: 0,
      required: false,
      message: 'Valid duppatta length size is required'
    }
  },

  // Product level required fields
  PRODUCT_REQUIRED_FIELDS: [
    'title',
    'description', 
    'category',
    'variants'
  ],

  // Default values
  DEFAULTS: {
    gstRate: 18
  }
};

// Helper function to validate variant field
export const validateVariantField = (fieldName, value, variantIndex = 0) => {
  const rule = PRODUCT_CONFIG.VALIDATION_RULES[fieldName];
  if (!rule) return { isValid: true };

  // Check if required field is empty
  if (rule.required && (value === undefined || value === null || value === '')) {
    return {
      isValid: false,
      message: `Variant at index ${variantIndex} is missing required field (${fieldName})`,
      field: fieldName
    };
  }

  // Skip validation if field is optional and empty
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { isValid: true };
  }

  // Type validation
  if (rule.type === 'number') {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return {
        isValid: false,
        message: `Variant at index ${variantIndex} has invalid ${fieldName}`,
        field: fieldName
      };
    }
    if (rule.min !== undefined && numValue < rule.min) {
      return {
        isValid: false,
        message: `Variant at index ${variantIndex} has invalid ${fieldName}`,
        field: fieldName
      };
    }
  }

  if (rule.type === 'integer') {
    const intValue = parseInt(value);
    if (isNaN(intValue)) {
      return {
        isValid: false,
        message: `Variant at index ${variantIndex} has invalid ${fieldName}`,
        field: fieldName
      };
    }
    if (rule.min !== undefined && intValue < rule.min) {
      return {
        isValid: false,
        message: `Variant at index ${variantIndex} has invalid ${fieldName}`,
        field: fieldName
      };
    }
  }

  if (rule.type === 'object') {
    if (typeof value !== 'object' || value === null) {
      return {
        isValid: false,
        message: `Variant at index ${variantIndex} has invalid ${fieldName}`,
        field: fieldName
      };
    }
  }

  return { isValid: true };
};

// Helper function to validate all variant fields
export const validateVariant = (variant, variantIndex = 0) => {
  const errors = [];
  
  // Check all required fields
  PRODUCT_CONFIG.VARIANT_FIELDS.REQUIRED.forEach(fieldName => {
    const validation = validateVariantField(fieldName, variant[fieldName], variantIndex);
    if (!validation.isValid) {
      errors.push(validation);
    }
  });

  // Check optional fields if they exist
  PRODUCT_CONFIG.VARIANT_FIELDS.OPTIONAL.forEach(fieldName => {
    if (variant[fieldName] !== undefined && variant[fieldName] !== null && variant[fieldName] !== '') {
      const validation = validateVariantField(fieldName, variant[fieldName], variantIndex);
      if (!validation.isValid) {
        errors.push(validation);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to validate product
export const validateProduct = (productData) => {
  const errors = [];
  
  // Check required product fields
  PRODUCT_CONFIG.PRODUCT_REQUIRED_FIELDS.forEach(fieldName => {
    if (!productData[fieldName]) {
      errors.push({
        isValid: false,
        message: `Missing required product field: ${fieldName}`,
        field: fieldName
      });
    }
  });

  // Validate variants array
  if (productData.variants) {
    if (!Array.isArray(productData.variants)) {
      errors.push({
        isValid: false,
        message: 'Variants must be an array',
        field: 'variants'
      });
    } else if (productData.variants.length === 0) {
      errors.push({
        isValid: false,
        message: 'Product must have at least one variant',
        field: 'variants'
      });
    } else {
      // Validate each variant
      productData.variants.forEach((variant, index) => {
        const variantValidation = validateVariant(variant, index);
        if (!variantValidation.isValid) {
          errors.push(...variantValidation.errors);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default PRODUCT_CONFIG;