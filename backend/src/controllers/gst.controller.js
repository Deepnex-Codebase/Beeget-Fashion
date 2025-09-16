import GSTService from "../services/gst.service.js";

export const GSTController = {
  /**
   * Process all orders to create/update GST records
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  processAllOrders: async (req, res) => {
    try {
      const result = await GSTService.processAllOrders();
      res.status(200).json({
        success: true,
        message: `Processed ${result.processed} orders for GST (${result.errors} errors)`,
        data: result
      });
    } catch (error) {
      console.error("Error in processAllOrders controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process orders for GST",
        error: error.message
      });
    }
  },

  /**
   * Get GST summary for dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getGSTSummary: async (req, res) => {
    try {
      const summary = await GSTService.getGSTSummary();
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error("Error in getGSTSummary controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get GST summary",
        error: error.message
      });
    }
  },

  /**
   * Get monthly GST report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getMonthlyReport: async (req, res) => {
    try {
      const report = await GSTService.getMonthlyReport();
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error("Error in getMonthlyReport controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get monthly GST report",
        error: error.message
      });
    }
  },

  /**
   * Get yearly GST report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getYearlyReport: async (req, res) => {
    try {
      const report = await GSTService.getYearlyReport();
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error("Error in getYearlyReport controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get yearly GST report",
        error: error.message
      });
    }
  }
};

export default GSTController;