import mongoose from "mongoose";

const GSTSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    orderDate: {
      type: Date,
      required: true,
    },
    taxableAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalGST: {
      type: Number,
      required: true,
      default: 0,
    },
    cgst: {
      type: Number,
      required: true,
      default: 0,
    },
    sgst: {
      type: Number,
      required: true,
      default: 0,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        gstRate: {
          type: Number,
          required: true,
          default: 0,
        },
        gstAmount: {
          type: Number,
          required: true,
          default: 0,
        },
        taxableAmount: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

// Static method to calculate GST from an order
GSTSchema.statics.calculateFromOrder = async function (order) {
  // Calculate CGST and SGST (assuming equal split of GST)
  const cgst = order.totalGST / 2;
  const sgst = order.totalGST / 2;
  
  // Extract month and year from order date
  const orderDate = new Date(order.order_date);
  const month = orderDate.getMonth() + 1; // JavaScript months are 0-indexed
  const year = orderDate.getFullYear();
  
  // Map order items to GST items
  const items = order.order_items.map(item => ({
    productId: item.productId,
    gstRate: item.gstRate || 0,
    gstAmount: item.gstAmount || 0,
    taxableAmount: item.sellingPrice * item.qty,
  }));
  
  // Calculate taxable amount (sum of all items' taxable amounts)
  const taxableAmount = items.reduce((sum, item) => sum + item.taxableAmount, 0);
  
  return {
    orderId: order._id,
    orderNumber: order.order_id,
    orderDate,
    taxableAmount,
    totalGST: order.totalGST || 0,
    cgst,
    sgst,
    month,
    year,
    items,
  };
};

// Method to get monthly GST report
GSTSchema.statics.getMonthlyReport = async function () {
  const report = await this.aggregate([
    {
      $group: {
        _id: { month: "$month", year: "$year" },
        taxableAmount: { $sum: "$taxableAmount" },
        totalGST: { $sum: "$totalGST" },
        cgst: { $sum: "$cgst" },
        sgst: { $sum: "$sgst" },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id.month",
        year: "$_id.year",
        taxableAmount: 1,
        totalGST: 1,
        cgst: 1,
        sgst: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);
  
  return report;
};

// Method to get yearly GST report
GSTSchema.statics.getYearlyReport = async function () {
  const report = await this.aggregate([
    {
      $group: {
        _id: { year: "$year" },
        taxableAmount: { $sum: "$taxableAmount" },
        totalGST: { $sum: "$totalGST" },
        cgst: { $sum: "$cgst" },
        sgst: { $sum: "$sgst" },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        taxableAmount: 1,
        totalGST: 1,
        cgst: 1,
        sgst: 1,
      },
    },
    { $sort: { year: 1 } },
  ]);
  
  return report;
};

// Method to get total GST collected
GSTSchema.statics.getTotalGSTCollected = async function () {
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        taxableAmount: { $sum: "$taxableAmount" },
        totalGST: { $sum: "$totalGST" },
        cgst: { $sum: "$cgst" },
        sgst: { $sum: "$sgst" },
      },
    },
    {
      $project: {
        _id: 0,
        taxableAmount: 1,
        totalGST: 1,
        cgst: 1,
        sgst: 1,
      },
    },
  ]);
  
  return result[0] || { taxableAmount: 0, totalGST: 0, cgst: 0, sgst: 0 };
};

const GST = mongoose.model("GST", GSTSchema);

export default GST;