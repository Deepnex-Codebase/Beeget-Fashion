/**
 * GST Configuration File
 * This file contains all GST related configurations and constants
 */

const gstConfig = {
  // Current GST rates
  CGST_RATE: 0.025, // 2.5%
  SGST_RATE: 0.025, // 2.5%
  
  // Computed total GST rate
  get TOTAL_GST_RATE() {
    return this.CGST_RATE + this.SGST_RATE;
  },
  
  // Display values for UI
  DISPLAY: {
    CGST_PERCENTAGE: '2.5%',
    SGST_PERCENTAGE: '2.5%',
    TOTAL_PERCENTAGE: '5%'
  },
  
  // GST Rate options for product configuration
  GST_RATE_OPTIONS: [
    { value: 0, label: '0%', cgst: 0, sgst: 0 },
    { value: 5, label: '5%', cgst: 2.5, sgst: 2.5 },
    { value: 12, label: '12%', cgst: 6, sgst: 6 },
    { value: 18, label: '18%', cgst: 9, sgst: 9 },
    { value: 28, label: '28%', cgst: 14, sgst: 14 }
  ],
  
  // Get GST breakdown for a given rate
  getGSTBreakdown: function(rateValue) {
    const option = this.GST_RATE_OPTIONS.find(opt => opt.value === Number(rateValue)) || 
                  this.GST_RATE_OPTIONS.find(opt => opt.value === 5); // Default to 5% if not found
    
    return {
      totalRate: option.value / 100,
      cgstRate: option.cgst / 100,
      sgstRate: option.sgst / 100,
      display: {
        totalPercentage: option.label,
        cgstPercentage: `${option.cgst}%`,
        sgstPercentage: `${option.sgst}%`
      }
    };
  },
  
  // Calculate GST amounts for a given sales amount
  calculateGST: function(salesAmount, rateValue = 5) {
    const { totalRate, cgstRate, sgstRate } = this.getGSTBreakdown(rateValue);
    
    // Calculate taxable amount (sales amount excluding GST)
    // Formula: taxableAmount = salesAmount / (1 + GST_RATE)
    const taxableAmount = salesAmount / (1 + totalRate);
    
    // Calculate GST amounts
    const cgstAmount = taxableAmount * cgstRate;
    const sgstAmount = taxableAmount * sgstRate;
    const totalGST = cgstAmount + sgstAmount;
    
    return {
      totalSales: salesAmount,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      totalGST: Math.round(totalGST * 100) / 100,
      cgst: Math.round(cgstAmount * 100) / 100,
      sgst: Math.round(sgstAmount * 100) / 100
    };
  }
};

export default gstConfig;