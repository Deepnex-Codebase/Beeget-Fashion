/**
 * GST Utility Functions for Price Calculations
 * Handles conversion between GST-inclusive and GST-exclusive pricing
 */

import gstConfig from '../config/gstConfig';

/**
 * Convert GST-exclusive price to GST-inclusive price
 * @param {number} exclusivePrice - Price without GST
 * @param {number} gstRate - GST rate (default: 5%)
 * @returns {number} GST-inclusive price
 */
export const convertToGSTInclusive = (exclusivePrice, gstRate = 5) => {
  if (!exclusivePrice || isNaN(exclusivePrice)) return 0;
  
  const { totalRate } = gstConfig.getGSTBreakdown(gstRate);
  const inclusivePrice = exclusivePrice * (1 + totalRate);
  
  return Math.round(inclusivePrice * 100) / 100;
};

/**
 * Convert GST-inclusive price to GST-exclusive price
 * @param {number} inclusivePrice - Price including GST
 * @param {number} gstRate - GST rate (default: 5%)
 * @returns {number} GST-exclusive price
 */
export const convertToGSTExclusive = (inclusivePrice, gstRate = 5) => {
  if (!inclusivePrice || isNaN(inclusivePrice)) return 0;
  
  const { totalRate } = gstConfig.getGSTBreakdown(gstRate);
  const exclusivePrice = inclusivePrice / (1 + totalRate);
  
  return Math.round(exclusivePrice * 100) / 100;
};

/**
 * Calculate GST amount from GST-inclusive price
 * @param {number} inclusivePrice - Price including GST
 * @param {number} gstRate - GST rate (default: 5%)
 * @returns {object} GST breakdown
 */
export const calculateGSTFromInclusive = (inclusivePrice, gstRate = 5) => {
  if (!inclusivePrice || isNaN(inclusivePrice)) {
    return {
      inclusivePrice: 0,
      exclusivePrice: 0,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0
    };
  }
  
  const { totalRate, cgstRate, sgstRate } = gstConfig.getGSTBreakdown(gstRate);
  const exclusivePrice = inclusivePrice / (1 + totalRate);
  const gstAmount = inclusivePrice - exclusivePrice;
  const cgstAmount = exclusivePrice * cgstRate;
  const sgstAmount = exclusivePrice * sgstRate;
  
  return {
    inclusivePrice: Math.round(inclusivePrice * 100) / 100,
    exclusivePrice: Math.round(exclusivePrice * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100
  };
};

/**
 * Format price for display with currency symbol
 * @param {number} price - Price to format
 * @param {boolean} showCurrency - Whether to show currency symbol
 * @returns {string} Formatted price
 */
export const formatPriceDisplay = (price, showCurrency = true) => {
  if (!price || isNaN(price)) return showCurrency ? '₹0' : '0';
  
  const formattedPrice = Math.round(price).toLocaleString('en-IN');
  return showCurrency ? `₹${formattedPrice}` : formattedPrice;
};

/**
 * Validate price input
 * @param {string|number} price - Price to validate
 * @returns {boolean} Whether price is valid
 */
export const isValidPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0;
};

/**
 * Convert variant prices to GST-inclusive format
 * @param {object} variant - Product variant object
 * @returns {object} Variant with GST-inclusive prices
 */
export const convertVariantToGSTInclusive = (variant) => {
  const gstRate = variant.gstRate || 5;
  
  return {
    ...variant,
    sellingPrice: variant.sellingPrice ? convertToGSTInclusive(variant.sellingPrice, gstRate) : '',
    mrp: variant.mrp ? convertToGSTInclusive(variant.mrp, gstRate) : '',
    wrongDefectivePrice: variant.wrongDefectivePrice ? convertToGSTInclusive(variant.wrongDefectivePrice, gstRate) : ''
  };
};

/**
 * Convert variant prices to GST-exclusive format (for API)
 * @param {object} variant - Product variant object with GST-inclusive prices
 * @returns {object} Variant with GST-exclusive prices
 */
export const convertVariantToGSTExclusive = (variant) => {
  const gstRate = variant.gstRate || 5;
  
  return {
    ...variant,
    sellingPrice: variant.sellingPrice ? convertToGSTExclusive(variant.sellingPrice, gstRate) : '',
    mrp: variant.mrp ? convertToGSTExclusive(variant.mrp, gstRate) : '',
    wrongDefectivePrice: variant.wrongDefectivePrice ? convertToGSTExclusive(variant.wrongDefectivePrice, gstRate) : ''
  };
};

/**
 * Get price display text with GST information
 * @param {number} inclusivePrice - GST-inclusive price
 * @param {number} gstRate - GST rate
 * @returns {string} Price display text
 */
export const getPriceDisplayText = (inclusivePrice, gstRate = 5) => {
  const { exclusivePrice } = calculateGSTFromInclusive(inclusivePrice, gstRate);
  const { display } = gstConfig.getGSTBreakdown(gstRate);
  
  return `${formatPriceDisplay(inclusivePrice)} (incl. ${display.totalPercentage} GST)`;
};