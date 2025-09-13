import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../utils/api";
import { toast } from "react-hot-toast";
import Button from "../components/Common/Button";
import Layout from "../components/Layout/Layout";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderStatus, setOrderStatus] = useState("");

  // Fetch order details
  const {
    data: orderDetails,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["order-details", orderId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/orders/${orderId}`);
        // console.log("Order API response:", response.data);
        return response.data.data.order; // Access the order object correctly
      } catch (error) {
        // console.error("Error fetching order details:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data) {
        // console.log("Order data loaded:", data);
        setOrderStatus(data.status || "");
      }
    },
    onError: () => {
      toast.error("Failed to fetch order details");
    },
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "processing":
        return "bg-yellow-50 text-yellow-600";
      case "ready-to-ship":
        return "bg-blue-50 text-blue-600";
      case "shipped":
        return "bg-indigo-50 text-indigo-600";
      case "delivered":
        return "bg-green-50 text-green-600";
      case "cancelled":
        return "bg-red-50 text-red-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  // Get payment status badge color
  const getPaymentStatusBadgeColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-50 text-green-600";
      case "pending":
        return "bg-yellow-50 text-yellow-600";
      case "failed":
        return "bg-red-50 text-red-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-java-200 border-t-java-400 rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">
              Error Loading Order
            </h2>
            <p className="text-gray-600 mb-6">
              {error?.message || "Failed to load order details"}
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/admin/dashboard")}
              className="mx-auto"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Order Details
            </h1>
            <p className="text-gray-500">View and manage order information</p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/admin/dashboard")}
            className="text-sm flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Button>
        </div>

        {orderDetails ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Order Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Order #{orderDetails.order_id}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Placed on {formatDate(orderDetails.createdAt)}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col md:items-end">
                  <div className="text-lg font-semibold text-gray-800 mb-2">
                    {formatCurrency(
                      orderDetails.total || orderDetails.totalAmount
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        orderDetails.statusHistory[
                          orderDetails.statusHistory.length - 1
                        ]?.status || orderDetails.orderStatus
                      )}`}
                    >
                      {(
                        orderDetails.statusHistory[
                          orderDetails.statusHistory.length - 1
                        ]?.status || orderDetails.orderStatus
                      )
                        ?.charAt(0)
                        .toUpperCase() +
                        (
                          orderDetails.statusHistory[
                            orderDetails.statusHistory.length - 1
                          ]?.status || orderDetails.orderStatus
                        )?.slice(1) || "N/A"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadgeColor(orderDetails.payment?.status || orderDetails.paymentStatus)}`}
                    >
                      {(
                        orderDetails.payment?.status ||
                        orderDetails.paymentStatus
                      )
                        ?.charAt(0)
                        .toUpperCase() +
                        (
                          orderDetails.payment?.status ||
                          orderDetails.paymentStatus
                        )?.slice(1) || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Customer Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-800 font-medium">
                    {orderDetails.userId?.name || "Guest Customer"}
                  </p>
                  <p className="text-gray-600">
                    {orderDetails.userId?.email ||
                      orderDetails.shipping?.address?.email ||
                      orderDetails.email ||
                      "N/A"}
                  </p>
                  <p className="text-gray-600 mt-2">
                    Payment Method:{" "}
                    {orderDetails.payment?.method ||
                      orderDetails.paymentMethod ||
                      "N/A"}
                  </p>
                  <p className="text-gray-600">Order ID: {orderDetails.order_id}</p>
                </div>
              </div>

              {/* Shipping Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Shipping Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {orderDetails.shipping?.address ||
                  orderDetails.shippingAddress ? (
                    <>
                      <p className="text-gray-800 font-medium">
                        {orderDetails.shipping?.address?.name ||
                          orderDetails.shippingAddress?.name}
                      </p>
                      <p className="text-gray-600">
                        {orderDetails.shipping?.address?.line1 ||
                          orderDetails.shipping?.address?.line2 ||
                          orderDetails.shippingAddress?.line1}
                      </p>
                      <p className="text-gray-600">
                        {orderDetails.shipping?.address?.city ||
                          orderDetails.shippingAddress?.city}
                        {orderDetails.shipping?.address?.city ||
                        orderDetails.shippingAddress?.city
                          ? ", "
                          : ""}
                        {orderDetails.shipping?.address?.state ||
                          orderDetails.shippingAddress?.state}
                        {orderDetails.shipping?.address?.state ||
                        orderDetails.shippingAddress?.state
                          ? " "
                          : ""}
                        {orderDetails.shipping?.address?.pincode ||
                          orderDetails.shippingAddress?.pincode}
                      </p>
                      <p className="text-gray-600">
                        {orderDetails.shipping?.address?.country ||
                          orderDetails.shippingAddress?.country ||
                          "India"}
                      </p>
                      <p className="text-gray-600 mt-2">
                        Phone:{" "}
                        {orderDetails.shipping?.address?.phone ||
                          orderDetails.shippingAddress?.phone}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600">
                      No shipping information available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Order Items
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      {/* <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th> */}
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(orderDetails.order_items || orderDetails.items) &&
                      (orderDetails.order_items || orderDetails.items).map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 mr-4">
                                {item.productId &&
                                item.productId.images &&
                                item.productId.images[0] ? (
                                  <img
                                    src={item.productId.images[0]}
                                    alt={item.productId.title}
                                    className="h-12 w-12 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-6 w-6 text-gray-400"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.productId
                                    ? item.productId.title
                                    : "Product Unavailable"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  SKU: {item.variantSku || item.sku || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.mrp || item.price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.qty || item.quantity}
                          </td>
                          {/* <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.size ||
                              (item.attributes && item.attributes.size) ||
                              "N/A"}
                          </td> */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(
                              (item.mrp || item.price) * (item.qty || item.quantity)
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row md:justify-between">
                <div className="md:w-1/2">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Order Notes
                  </h3>
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <p className="text-gray-600">
                      {orderDetails.notes || "No notes for this order"}
                    </p>
                  </div>

                  {/* Tracking Information */}
                  {orderDetails.trackingInfo && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">
                        Tracking Information
                      </h3>
                      <div className="bg-white p-4 rounded-md border border-gray-200">
                        <p className="text-gray-600">
                          <span className="font-medium">Courier: </span>
                          {orderDetails.trackingInfo.courierPartner || "N/A"}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">AWB Number: </span>
                          {orderDetails.trackingInfo.awbNumber || "N/A"}
                        </p>
                        {orderDetails.dispatchDate && (
                          <p className="text-gray-600">
                            <span className="font-medium">Dispatched On: </span>
                            {formatDate(orderDetails.dispatchDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:w-1/3 mt-6 md:mt-0">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Order Summary
                  </h3>
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-800 font-medium">
                        {formatCurrency(
                          orderDetails.subtotal ||
                            orderDetails.totalAmount ||
                            orderDetails.total
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-800 font-medium">
                        {formatCurrency(orderDetails.shippingCost || 0)}
                      </span>
                    </div>
                    {(orderDetails.discount > 0 ||
                      orderDetails.coupon?.discount > 0) && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-green-600 font-medium">
                          -
                          {formatCurrency(
                            orderDetails.discount ||
                              orderDetails.coupon?.discount ||
                              0
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-800 font-medium">
                        {formatCurrency(
                          orderDetails.tax || orderDetails.totalGST || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 font-semibold">
                      <span className="text-gray-800">Total</span>
                      <span className="text-gray-900">
                        {formatCurrency(
                          parseFloat(orderDetails.subtotal - (orderDetails.discount || orderDetails.coupon?.discount || 0) + (orderDetails.tax || orderDetails.totalGST || 0))
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-600 mb-4">
              Order Not Found
            </h2>
            <p className="text-gray-500 mb-6">
              The order you are looking for does not exist or has been removed.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/admin/dashboard")}
              className="mx-auto"
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetails;
