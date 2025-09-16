import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      unique: true,
      required: true,
    },

    order_date: {
      type: String,
      required: true,
    },

    /**
     * Shiprocket Channel ID (optional for integration)
     * This field is optional and allows orders to be sent without a channel ID
     * If SHIPROCKET_CHANNEL_ID is set in environment, it will be used as default
     */
    channel_id: {
      type: String,
      required: false,
      default: process.env.SHIPROCKET_CHANNEL_ID || ''
    },

    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },

    guestSessionId: {
      type: String,
    },

    order_items: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variantSku: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: false,
        },
        hsn: {
          type: String,
          required: false,
        },
        qty: {
          type: Number,
          required: true,
          min: 1,
        },
        weight: {
          type: Number,
          required: false,
        },
        length: {
          type: Number,
          required: false,
        },
        breadth: {
          type: Number,
          required: false,
        },
        height: {
          type: Number,
          required: false,
        },
        mrp: {
          type: Number,
          required: true,
          min: 0,
        },
        sellingPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        gstRate: {
          type: Number,
          default: 0,
        },
        gstAmount: {
          type: Number,
          default: 0,
        },
        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    
    // For backward compatibility
    items: {
      type: Array,
      default: function() {
        return this.order_items;
      }
    },

 pickup_location: {
  type: String,
  default: process.env.SHIPROCKET_PICKUP_LOCATION || "Home",
},


    // Comment for order (e.g. Reseller information)
    comment: {
      type: String,
    },

    // Billing information
    billing: {
      customer_name: {
        type: String,
        required: true,
      },
      last_name: {
        type: String,
      },
      address: {
        type: String,
        required: true,
      },
      address_2: {
        type: String,
      },
      city: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: "India",
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },

    // Flag to indicate if shipping address is same as billing
    shipping_is_billing: {
      type: Boolean,
      default: true,
    },

    // Shipping information
    shipping: {
      customer_name: {
        type: String,
      },
      last_name: {
        type: String,
      },
      address: {
        type: String,
      },
      address_2: {
        type: String,
      },
      city: {
        type: String,
      },
      pincode: {
        type: String,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
        default: "India",
      },
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
      courier: String,
      trackingId: String,
      shipmentId: String, // Shiprocket shipment ID
    },

    payment: {
      method: {
        type: String,
        enum: ["COD", "ONLINE", "CASHFREE"],
        required: true,
      },
      cfOrderId: String,
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
        default: "PENDING",
      },
    },

    coupon: {
      code: String,
      discountType: {
        type: String,
        enum: ["PERCENTAGE", "FLAT"],
      },
      value: Number,
      discount: {
        type: Number,
        default: 0,
      },
    },

    subtotal: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalGST: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // Shipping charges
    shipping_charges: {
      type: Number,
      default: 0,
    },

    // Gift wrap charges
    giftwrap_charges: {
      type: Number,
      default: 0,
    },

    // Transaction charges
    transaction_charges: {
      type: Number,
      default: 0,
    },

    // Package dimensions
    length: {
      type: Number,
      default: 0,
    },
    breadth: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "CREATED",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
        "PAYMENT_FAILED",
        "STOCK_ISSUE",
      ],
      default: "CREATED",
    },

    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],

    returnRequest: {
      reason: String,
      images: [String],
      status: {
        type: String,
        enum: ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"],
      },
    },

    exchangeRequest: {
      newVariant: String,
      status: {
        type: String,
        enum: ["REQUESTED", "APPROVED", "COMPLETED"],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
OrderSchema.index({ userId: 1 });
OrderSchema.index({ channelId: 1 }); // 👈 Channel wise search
OrderSchema.index({ "shipping.trackingId": 1 });
OrderSchema.index({ userId: 1, "shipping.trackingId": 1 });

OrderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

OrderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: Date.now(),
    });
  }
  next();
});

// Post-save hook to process GST data
OrderSchema.post('save', async function(doc) {
  try {
    // Import GSTService dynamically to avoid circular dependency
    const { default: GSTService } = await import('../services/gst.service.js');
    await GSTService.processOrder(doc);
  } catch (error) {
    console.error('Error processing GST data for order:', error);
  }
});

const Order = mongoose.model("Order", OrderSchema);

export default Order;
