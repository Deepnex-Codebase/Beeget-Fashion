import GST from "../models/gst.model.js";
import Order from "../models/order.model.js";

/**
 * Service to handle GST-related operations
 */
export const GSTService = {
  /**
   * Process an order and create/update GST record
   * @param {Object} order - Order object
   * @returns {Promise<Object>} - Created/updated GST record
   */
  processOrder: async (order) => {
    try {
      const gstData = await GST.calculateFromOrder(order);
      
      // Check if GST record already exists for this order
      const existingGST = await GST.findOne({ orderId: order._id });
      
      if (existingGST) {
        // Update existing record
        Object.assign(existingGST, gstData);
        await existingGST.save();
        return existingGST;
      } else {
        // Create new record
        const newGST = new GST(gstData);
        await newGST.save();
        return newGST;
      }
    } catch (error) {
      console.error("Error processing order for GST:", error);
      throw error;
    }
  },
  
  /**
   * Process all orders to create/update GST records
   * @returns {Promise<Object>} - Result of processing
   */
  processAllOrders: async () => {
    try {
      const orders = await Order.find({});
      let processed = 0;
      let errors = 0;
      
      for (const order of orders) {
        try {
          await GSTService.processOrder(order);
          processed++;
        } catch (error) {
          console.error(`Error processing order ${order._id} for GST:`, error);
          errors++;
        }
      }
      
      return { processed, errors };
    } catch (error) {
      console.error("Error processing all orders for GST:", error);
      throw error;
    }
  },
  
  /**
   * Get total GST collected
   * @returns {Promise<Object>} - Total GST collected
   */
  getTotalGSTCollected: async () => {
    try {
      return await GST.getTotalGSTCollected();
    } catch (error) {
      console.error("Error getting total GST collected:", error);
      throw error;
    }
  },
  
  /**
   * Get monthly GST report
   * @returns {Promise<Array>} - Monthly GST report
   */
  getMonthlyReport: async () => {
    try {
      const report = await GST.getMonthlyReport();
      
      // Map month numbers to month names
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      
      return report.map(item => ({
        ...item,
        monthName: monthNames[item.month - 1]
      }));
    } catch (error) {
      console.error("Error getting monthly GST report:", error);
      throw error;
    }
  },
  
  /**
   * Get yearly GST report
   * @returns {Promise<Array>} - Yearly GST report
   */
  getYearlyReport: async () => {
    try {
      return await GST.getYearlyReport();
    } catch (error) {
      console.error("Error getting yearly GST report:", error);
      throw error;
    }
  },
  
  /**
   * Get GST summary for dashboard
   * @returns {Promise<Object>} - GST summary
   */
  getGSTSummary: async () => {
    try {
      const totalGST = await GST.getTotalGSTCollected();
      const monthlyReport = await GSTService.getMonthlyReport();
      
      return {
        totalGST: totalGST.totalGST || 0,
        taxableAmount: totalGST.taxableAmount || 0,
        cgst: totalGST.cgst || 0,
        sgst: totalGST.sgst || 0,
        monthlyReport
      };
    } catch (error) {
      console.error("Error getting GST summary:", error);
      throw error;
    }
  }
};

export default GSTService;