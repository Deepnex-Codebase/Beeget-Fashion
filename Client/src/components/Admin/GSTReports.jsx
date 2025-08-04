import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "../../utils/api";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const GSTReports = () => {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(
    Math.ceil((new Date().getMonth() + 1) / 3)
  );
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Fetch order stats data with more detailed error handling and fallback mechanism
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["order-stats"],
    queryFn: async () => {
      try {
        // First try to get data from the dashboard endpoint
        const response = await axios.get("/orders/stats/dashboard");
        // console.log("API Response Data:", response.data.data);

        // Validate data structure
        if (!response.data.data) {
          // console.error("Invalid API response: data is missing");

          throw new Error("Invalid API response: data is missing");
        }

        // Check if salesByPeriod exists
        if (!response.data.data.salesByPeriod) {
          // console.error("Invalid data structure: salesByPeriod is missing");

          // Try to get orders directly as fallback
          // console.log("Attempting to fetch orders directly as fallback...");
          const ordersResponse = await axios.get("/orders?limit=100");

          if (
            !ordersResponse.data ||
            !ordersResponse.data.data ||
            !ordersResponse.data.data.orders
          ) {
            throw new Error(
              "Both stats API and orders API failed to provide valid data"
            );
          }

          // Process orders to create a compatible data structure
          const orders = ordersResponse.data.data.orders;
          const processedData = processOrdersIntoStats(orders);
          return processedData;
        }

        // Check if monthly data exists
        if (!response.data.data.salesByPeriod.monthly) {
          // console.error(
            // "Invalid data structure: monthly sales data is missing"
          // );

          // Try to get orders directly as fallback
          // console.log("Attempting to fetch orders directly as fallback...");
          const ordersResponse = await axios.get("/orders?limit=100");

          if (
            !ordersResponse.data ||
            !ordersResponse.data.data ||
            !ordersResponse.data.data.orders
          ) {
            throw new Error(
              "Both stats API and orders API failed to provide valid data"
            );
          }

          // Process orders to create a compatible data structure
          const orders = ordersResponse.data.data.orders;
          const processedData = processOrdersIntoStats(orders);
          return processedData;
        }

        if (response.data.data.salesByPeriod.monthly.length === 0) {
          // console.warn("No monthly sales data available");

          // Try to get orders directly as fallback
          // console.log("Attempting to fetch orders directly as fallback...");
          const ordersResponse = await axios.get("/orders?limit=100");

          if (
            !ordersResponse.data ||
            !ordersResponse.data.data ||
            !ordersResponse.data.data.orders
          ) {
            throw new Error(
              "Both stats API and orders API failed to provide valid data"
            );
          }

          // Process orders to create a compatible data structure
          const orders = ordersResponse.data.data.orders;
          const processedData = processOrdersIntoStats(orders);
          return processedData;
        }

        return response.data.data;
      } catch (err) {
        // console.error("Error fetching order stats:", err);

        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    onError: (error) => {
      // console.error("Error in order stats query:", error);
    },
  });

  // Function to process orders into a stats-compatible structure
  const processOrdersIntoStats = (orders) => {
    // console.log(
      // "Processing orders into stats format:",
      // orders.length,
      // "orders"
    // );

    if (!orders || orders.length === 0) {
      // console.warn("No orders found in the data");
      return {
        totalSales: 0,
        salesByPeriod: {
          monthly: [],
        },
      };
    }

    // Filter only paid orders
    const paidOrders = orders.filter(
      (order) =>
        order.paymentStatus === "paid" ||
        order.paymentStatus === "completed" ||
        (order.payment && order.payment.status === "PAID")
    );

    if (paidOrders.length === 0) {
      // console.warn("No paid orders found in the data");
      return {
        totalSales: 0,
        salesByPeriod: {
          monthly: [],
        },
      };
    }

    // Calculate total sales from paid orders
    const totalSales = paidOrders.reduce((sum, order) => {
      // Handle different order total field names
      const total = order.total || order.totalAmount || 0;
      const numericTotal =
        typeof total === "number"
          ? total
          : typeof total === "string"
            ? parseFloat(total)
            : 0;
      return sum + (isNaN(numericTotal) ? 0 : numericTotal);
    }, 0);

    // Group orders by month
    const monthlyData = {};

    paidOrders.forEach((order) => {
      try {
        if (!order.createdAt) {
          // console.warn("Order missing createdAt:", order._id || "unknown");
          return;
        }

        const orderDate = new Date(order.createdAt);
        if (isNaN(orderDate.getTime())) {
          // console.warn("Invalid order date:", order.createdAt);
          return;
        }

        // Format as YYYY-MM
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
        const period = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}-01`; // First day of the month

        // Get order total
        const total = order.total || order.totalAmount || 0;
        const numericTotal =
          typeof total === "number"
            ? total
            : typeof total === "string"
              ? parseFloat(total)
              : 0;
        if (isNaN(numericTotal)) {
          // console.warn("Invalid order total:", total);
          return;
        }

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            period,
            total: 0,
            count: 0,
          };
        }

        monthlyData[monthKey].total += numericTotal;
        monthlyData[monthKey].count += 1;
      } catch (err) {
        // console.warn("Error processing order for stats:", err, order);
      }
    });

    // Convert to array format expected by the existing code
    const monthly = Object.values(monthlyData);

    // console.log("Processed orders into stats format:", {
    //   totalSales,
    //   monthlyCount: monthly.length,
    //   sampleMonth: monthly.length > 0 ? monthly[0] : null,
    // });

    return {
      totalSales,
      salesByPeriod: {
        monthly,
      },
    };
  };

  // Constants for GST rates
  const CGST_RATE = 0.09; // 9%
  const SGST_RATE = 0.09; // 9%
  const TOTAL_GST_RATE = CGST_RATE + SGST_RATE; // 18%

  // Function to calculate total GST collected with improved error handling
  const calculateTotalGST = () => {
    // If no stats available or totalSales is missing, throw an error
    if (!stats || !stats.totalSales) {
      // console.error("No totalSales data available in API response");

      // Return zeros to prevent UI errors
      return {
        totalSales: 0,
        taxableAmount: 0,
        totalGST: 0,
        cgst: 0,
        sgst: 0,
      };
    }

    try {
      // Ensure totalSales is a valid number
      const totalSales =
        typeof stats.totalSales === "number"
          ? stats.totalSales
          : typeof stats.totalSales === "string"
            ? parseFloat(stats.totalSales)
            : 0;

      if (isNaN(totalSales) || totalSales <= 0) {
        // console.warn("Invalid totalSales value:", stats.totalSales);

        return {
          totalSales: 0,
          taxableAmount: 0,
          totalGST: 0,
          cgst: 0,
          sgst: 0,
        };
      }

      // Calculate taxable amount (sales amount excluding GST)
      // Formula: taxableAmount = salesAmount / (1 + GST_RATE)
      const taxableAmount = totalSales / (1 + TOTAL_GST_RATE);

      // Calculate GST amounts
      const cgstAmount = taxableAmount * CGST_RATE;
      const sgstAmount = taxableAmount * SGST_RATE;
      const totalGST = cgstAmount + sgstAmount;

      // Verify calculations
      const calculatedTotal = taxableAmount + totalGST;
      if (Math.abs(calculatedTotal - totalSales) > 1) {
        // Allow for small rounding differences
        // console.warn("GST calculation discrepancy:", {
        //   original: totalSales,
        //   calculated: calculatedTotal,
        //   difference: totalSales - calculatedTotal,
        // });
      }

      return {
        totalSales: totalSales,
        taxableAmount: Math.round(taxableAmount * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        cgst: Math.round(cgstAmount * 100) / 100,
        sgst: Math.round(sgstAmount * 100) / 100,
      };
    } catch (error) {
      // console.error("Error calculating total GST:", error);

      return {
        totalSales: 0,
        taxableAmount: 0,
        totalGST: 0,
        cgst: 0,
        sgst: 0,
      };
    }
  };

  // Function to get sales data by timeframe with improved error handling
  const getSalesDataByTimeframe = () => {
    // Check if stats data is available
    if (!stats) {
      // console.error("No stats data available");

      return [];
    }

    // Check if we have the expected data structure
    if (!stats.salesByPeriod || !stats.salesByPeriod.monthly) {
      // console.error(
        // "Sales data structure is invalid: salesByPeriod or monthly data missing"
      // );

      return [];
    }

    // Ensure monthly data is an array
    if (!Array.isArray(stats.salesByPeriod.monthly)) {
      // console.error("Monthly sales data is not an array");

      return [];
    }

    let salesData = [];

    try {
      if (selectedTimeframe === "monthly") {
        // Monthly data for the selected year
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        salesData = stats.salesByPeriod.monthly
          .filter((item) => {
            try {
              if (!item.period) return false;
              const date = new Date(item.period);
              return (
                !isNaN(date.getTime()) && date.getFullYear() === selectedYear
              );
            } catch (e) {
              // console.error(
                // "Invalid date format in monthly data:",
                // item.period
              // );
              return false;
            }
          })
          .map((item) => {
            try {
              const date = new Date(item.period);
              const total =
                typeof item.total === "number"
                  ? item.total
                  : typeof item.total === "string"
                    ? parseFloat(item.total)
                    : 0;
              const count =
                typeof item.count === "number"
                  ? item.count
                  : typeof item.count === "string"
                    ? parseInt(item.count)
                    : 0;

              return {
                month: monthNames[date.getMonth()],
                sales: isNaN(total) ? 0 : total,
                orders: isNaN(count) ? 0 : count,
              };
            } catch (e) {
              // console.error("Error processing monthly item:", e);
              return null;
            }
          })
          .filter((item) => item !== null); // Remove any null items from mapping errors
      } else if (selectedTimeframe === "quarterly") {
        // Quarterly data
        const quarterlyData = [0, 0, 0, 0];
        const quarterlyOrders = [0, 0, 0, 0];

        stats.salesByPeriod.monthly
          .filter((item) => {
            try {
              if (!item.period) return false;
              const date = new Date(item.period);
              return (
                !isNaN(date.getTime()) && date.getFullYear() === selectedYear
              );
            } catch (e) {
              // console.error(
                // "Invalid date format in quarterly data:",
                // item.period
              // );
              return false;
            }
          })
          .forEach((item) => {
            try {
              const date = new Date(item.period);
              if (isNaN(date.getTime())) return;

              const quarter = Math.floor(date.getMonth() / 3);
              if (quarter < 0 || quarter > 3) return;

              const total =
                typeof item.total === "number"
                  ? item.total
                  : typeof item.total === "string"
                    ? parseFloat(item.total)
                    : 0;
              const count =
                typeof item.count === "number"
                  ? item.count
                  : typeof item.count === "string"
                    ? parseInt(item.count)
                    : 0;

              quarterlyData[quarter] += isNaN(total) ? 0 : total;
              quarterlyOrders[quarter] += isNaN(count) ? 0 : count;
            } catch (e) {
              // console.error("Error processing quarterly item:", e);
            }
          });

        salesData = quarterlyData.map((total, index) => ({
          quarter: `Q${index + 1}`,
          sales: total,
          orders: quarterlyOrders[index],
        }));
      } else if (selectedTimeframe === "yearly") {
        // Yearly data
        const yearMap = {};

        // Process each monthly item and group by year
        stats.salesByPeriod.monthly.forEach((item) => {
          try {
            if (!item.period) return;
            const date = new Date(item.period);
            if (isNaN(date.getTime())) {
              // console.warn("Invalid date in yearly aggregation:", item.period);
              return;
            }

            const year = date.getFullYear();
            const total =
              typeof item.total === "number"
                ? item.total
                : typeof item.total === "string"
                  ? parseFloat(item.total)
                  : 0;
            const count =
              typeof item.count === "number"
                ? item.count
                : typeof item.count === "string"
                  ? parseInt(item.count)
                  : 0;

            if (isNaN(total) && isNaN(count)) return;

            if (!yearMap[year]) {
              yearMap[year] = {
                sales: 0,
                orders: 0,
              };
            }

            yearMap[year].sales += isNaN(total) ? 0 : total;
            yearMap[year].orders += isNaN(count) ? 0 : count;
          } catch (e) {
            // console.error("Error processing yearly item:", e);
          }
        });

        // Convert the map to an array
        salesData = Object.entries(yearMap).map(([year, data]) => ({
          year: year.toString(),
          sales: data.sales,
          orders: data.orders,
        }));

        // Sort by year (descending)
        salesData.sort((a, b) => parseInt(b.year) - parseInt(a.year));
      } else if (selectedTimeframe === "custom") {
        // Custom date range
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);

        // Ensure valid date range
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          // console.error("Invalid date range");

          return [];
        }

        // Set end date to end of day for inclusive comparison
        endDate.setHours(23, 59, 59, 999);

        // Check if daily data exists
        if (
          !stats.salesByPeriod.daily ||
          !Array.isArray(stats.salesByPeriod.daily)
        ) {
          // Use monthly data if daily is not available
          salesData = stats.salesByPeriod.monthly
            .filter((item) => {
              try {
                if (!item.period) return false;
                const date = new Date(item.period);
                return (
                  !isNaN(date.getTime()) && date >= startDate && date <= endDate
                );
              } catch (e) {
                // console.error(
                  // "Invalid date format in custom range (monthly):",
                  // item.period
                // );
                return false;
              }
            })
            .map((item) => {
              try {
                const date = new Date(item.period);
                const total =
                  typeof item.total === "number"
                    ? item.total
                    : typeof item.total === "string"
                      ? parseFloat(item.total)
                      : 0;
                const count =
                  typeof item.count === "number"
                    ? item.count
                    : typeof item.count === "string"
                      ? parseInt(item.count)
                      : 0;

                return {
                  date: date.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  }),
                  sales: isNaN(total) ? 0 : total,
                  orders: isNaN(count) ? 0 : count,
                };
              } catch (e) {
                // console.error(
                //   "Error processing custom range item (monthly):",
                //   e
                // );
                return null;
              }
            })
            .filter((item) => item !== null); // Remove any null items from mapping errors
        } else {
          salesData = stats.salesByPeriod.daily
            .filter((item) => {
              try {
                if (!item.period) return false;
                const date = new Date(item.period);
                return (
                  !isNaN(date.getTime()) && date >= startDate && date <= endDate
                );
              } catch (e) {
                console.error(
                  "Invalid date format in custom range (daily):",
                  item.period
                );
                return false;
              }
            })
            .map((item) => {
              try {
                const date = new Date(item.period);
                const total =
                  typeof item.total === "number"
                    ? item.total
                    : typeof item.total === "string"
                      ? parseFloat(item.total)
                      : 0;
                const count =
                  typeof item.count === "number"
                    ? item.count
                    : typeof item.count === "string"
                      ? parseInt(item.count)
                      : 0;

                return {
                  date: date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  }),
                  sales: isNaN(total) ? 0 : total,
                  orders: isNaN(count) ? 0 : count,
                };
              } catch (e) {
                console.error("Error processing custom range item (daily):", e);
                return null;
              }
            })
            .filter((item) => item !== null); // Remove any null items from mapping errors
        }
      }
    } catch (error) {
      console.error(`Error processing ${selectedTimeframe} sales data:`, error);

      return [];
    }

    // If no data was found, return empty array with notification
    if (salesData.length === 0) {
      console.warn(
        `No sales data found for the selected ${selectedTimeframe} timeframe`
      );

      return [];
    }

    return salesData;
  };

  // No mock sales data function needed as we're using real data from the API

  // Function to calculate GST data based on sales data with improved error handling
  const getGSTDataByTimeframe = () => {
    // Get sales data from the existing function
    const salesData = getSalesDataByTimeframe();

    // If no sales data, return empty array
    if (!salesData || salesData.length === 0) {
      return [];
    }

    try {
      // Calculate GST for each period using only actual data
      return salesData.map((item) => {
        // Ensure sales is a valid number
        const sales =
          typeof item.sales === "number"
            ? item.sales
            : typeof item.sales === "string"
              ? parseFloat(item.sales)
              : 0;

        // Get orders count if available
        const orders =
          typeof item.orders === "number"
            ? item.orders
            : typeof item.orders === "string"
              ? parseInt(item.orders)
              : 0;

        if (isNaN(sales) || sales <= 0) {
          console.warn("Invalid sales amount:", item);
          // Return item with zero values for GST calculations
          return {
            ...item,
            orders: isNaN(orders) ? 0 : orders,
            taxableAmount: 0,
            cgst: 0,
            sgst: 0,
            totalGST: 0,
          };
        }

        // Calculate taxable amount (sales amount excluding GST)
        // Formula: taxableAmount = salesAmount / (1 + GST_RATE)
        const taxableAmount = sales / (1 + TOTAL_GST_RATE);

        // Calculate GST amounts
        const cgstAmount = taxableAmount * CGST_RATE;
        const sgstAmount = taxableAmount * SGST_RATE;
        const totalGST = cgstAmount + sgstAmount;

        // Verify calculations
        const calculatedTotal = taxableAmount + totalGST;
        if (Math.abs(calculatedTotal - sales) > 1) {
          // Allow for small rounding differences
          console.warn("GST calculation discrepancy:", {
            original: sales,
            calculated: calculatedTotal,
            difference: sales - calculatedTotal,
          });
        }

        return {
          ...item, // Keep original data (day/month/year and sales)
          orders: isNaN(orders) ? 0 : orders,
          taxableAmount: Math.round(taxableAmount * 100) / 100, // Round to 2 decimal places
          cgst: Math.round(cgstAmount * 100) / 100,
          sgst: Math.round(sgstAmount * 100) / 100,
          totalGST: Math.round(totalGST * 100) / 100,
        };
      });
    } catch (error) {
      console.error("Error calculating GST data:", error);

      return [];
    }
  };

  // Function to export GST report as PDF
  const exportGSTReport = () => {
    const reportElement = document.getElementById("gst-report-container");

    if (!reportElement) {
      return;
    }

    toast.info("Generating PDF report...", { autoClose: 2000 });

    html2canvas(reportElement, {
      scale: 2,
      logging: false,
      useCORS: true,
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 30;

        // Add header
        pdf.setFontSize(18);
        pdf.text("GST Report", pdfWidth / 2, 15, { align: "center" });

        // Add timeframe info
        pdf.setFontSize(10);
        let timeframeText = "";

        if (selectedTimeframe === "monthly") {
          timeframeText = `Monthly Report - ${selectedYear}`;
        } else if (selectedTimeframe === "quarterly") {
          timeframeText = `Quarterly Report - ${selectedYear} - Q${selectedQuarter}`;
        } else if (selectedTimeframe === "yearly") {
          timeframeText = `Yearly Report - ${selectedYear}`;
        } else if (selectedTimeframe === "custom") {
          timeframeText = `Custom Report - ${dateRange.startDate} to ${dateRange.endDate}`;
        }

        pdf.text(timeframeText, pdfWidth / 2, 22, { align: "center" });

        // Add image
        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          imgY,
          imgWidth * ratio,
          imgHeight * ratio
        );

        // Add footer
        pdf.setFontSize(8);
        pdf.text(
          `Generated on ${new Date().toLocaleString()}`,
          pdfWidth / 2,
          pdfHeight - 10,
          { align: "center" }
        );

        // Save PDF
        pdf.save(
          `GST_Report_${selectedTimeframe}_${new Date().toISOString().split("T")[0]}.pdf`
        );

        toast.success("PDF report generated successfully!");
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        toast.error("Failed to generate PDF report");
      });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get years for dropdown
  const getYearOptions = () => {
    if (!stats || !stats.salesByPeriod || !stats.salesByPeriod.monthly) {
      console.error("No sales data available for year options");

      // Return only current year as fallback
      const currentYear = new Date().getFullYear();
      return [{ value: currentYear, label: currentYear }];
    }

    const years = [
      ...new Set(
        stats.salesByPeriod.monthly.map((item) =>
          new Date(item.period).getFullYear()
        )
      ),
    ];
    // Sort years in descending order (newest first)
    return years
      .sort((a, b) => b - a)
      .map((year) => ({ value: year, label: year }));
  };

  // Get quarters for dropdown
  const getQuarterOptions = () => {
    return [
      { value: 1, label: "Q1 (Jan-Mar)" },
      { value: 2, label: "Q2 (Apr-Jun)" },
      { value: 3, label: "Q3 (Jul-Sep)" },
      { value: 4, label: "Q4 (Oct-Dec)" },
    ];
  };

  // Get GST data for charts using useMemo to prevent recalculation on every render
  const gstData = React.useMemo(
    () => getGSTDataByTimeframe(),
    [stats, selectedTimeframe, selectedYear, selectedQuarter, dateRange]
  );
  const totalGSTData = React.useMemo(() => calculateTotalGST(), [stats]);

  // Prepare data for pie chart
  const pieChartData = [
    { name: "CGST (9%)", value: totalGSTData.cgst },
    { name: "SGST (9%)", value: totalGSTData.sgst },
  ];

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F"];

  // Loading state
  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (statsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">Error loading GST report data</p>
            <button
              onClick={() => {
                refetchStats();
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" id="gst-report-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800">
              GST Reports
            </h1>
          </div>

          <motion.button
            onClick={exportGSTReport}
            className="flex items-center px-4 py-2 bg-java-600 text-white rounded-md hover:bg-java-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Report
          </motion.button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-java-500 focus:border-java-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {selectedTimeframe === "monthly" ||
            selectedTimeframe === "quarterly" ||
            selectedTimeframe === "yearly" ? (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-java-500 focus:border-java-500 transition-all cursor-pointer appearance-none bg-white hover:border-gray-400"
                  >
                    {getYearOptions().map((year) => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedTimeframe === "quarterly" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quarter
                </label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-java-500 focus:border-java-500"
                >
                  {getQuarterOptions().map((quarter) => (
                    <option key={quarter.value} value={quarter.value}>
                      {quarter.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedTimeframe === "custom" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-java-500 focus:border-java-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-java-500 focus:border-java-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* GST Summary Cards */}
        {statsError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-6">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Data Unavailable
            </h3>
            <p className="text-gray-600">Unable to load GST data</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : statsLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center mb-6">
            <div className="flex justify-center items-center h-40">
              <svg
                className="animate-spin h-10 w-10 text-java-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <p className="text-gray-600 mt-4">Loading GST data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <motion.div
              className="bg-white rounded-lg shadow-sm p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                Total GST Collected
              </h2>
              <p className="text-3xl font-bold text-java-600">
                {formatCurrency(totalGSTData.totalGST)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                18% of taxable amount{" "}
                {formatCurrency(totalGSTData.taxableAmount)}
              </p>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg shadow-sm p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                CGST (9%)
              </h2>
              <p className="text-3xl font-bold text-java-600">
                {formatCurrency(totalGSTData.cgst)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Central Goods & Services Tax
              </p>
            </motion.div>

            <motion.div
              className="bg-white rounded-lg shadow-sm p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                SGST (9%)
              </h2>
              <p className="text-3xl font-bold text-java-600">
                {formatCurrency(totalGSTData.sgst)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                State Goods & Services Tax
              </p>
            </motion.div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-base font-medium text-gray-700 mb-4">
              GST Collection Trend
            </h2>
            <div className="h-80">
              {gstData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gstData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey={
                        selectedTimeframe === "monthly"
                          ? "month"
                          : selectedTimeframe === "quarterly"
                            ? "quarter"
                            : selectedTimeframe === "yearly"
                              ? "year"
                              : "date"
                      }
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [
                        `₹${value.toLocaleString()}`,
                        undefined,
                      ]}
                      labelFormatter={(value) => `${value}`}
                    />
                    <Legend />
                    <Bar dataKey="cgst" name="CGST" fill="#0088FE" />
                    <Bar dataKey="sgst" name="SGST" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">
                    No GST collection data available for the selected period
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg shadow-sm p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-base font-medium text-gray-700 mb-4">
              GST Distribution
            </h2>
            <div className="h-80 flex items-center justify-center">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `₹${value.toLocaleString()}`,
                        undefined,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">
                    No GST distribution data available for the selected period
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* GST Data Table */}
        {!statsError && !statsLoading && (
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium text-gray-700">
                {selectedTimeframe === "monthly"
                  ? "Monthly"
                  : selectedTimeframe === "quarterly"
                    ? "Quarterly"
                    : selectedTimeframe === "yearly"
                      ? "Yearly"
                      : "Custom"}{" "}
                GST Report{" "}
                {reportType === "detailed" ? "(Detailed)" : "(Summary)"}
              </h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    // Create CSV content
                    let csvContent = "data:text/csv;charset=utf-8,";

                    // Add headers
                    const headers = [
                      selectedTimeframe === "monthly"
                        ? "Month"
                        : selectedTimeframe === "quarterly"
                          ? "Quarter"
                          : selectedTimeframe === "yearly"
                            ? "Year"
                            : "Date",
                      "Sales Amount",
                      reportType === "detailed" ? "Orders" : "",
                      "Taxable Amount",
                      "CGST (9%)",
                      "SGST (9%)",
                      "Total GST (18%)",
                    ].filter(Boolean);
                    csvContent += headers.join(",") + "\n";

                    // Add data rows
                    gstData.forEach((item) => {
                      const row = [
                        selectedTimeframe === "monthly"
                          ? item.month
                          : selectedTimeframe === "quarterly"
                            ? item.quarter
                            : selectedTimeframe === "yearly"
                              ? item.year
                              : item.date,
                        item.sales.toFixed(2),
                        reportType === "detailed" ? item.orders || 0 : "",
                        item.taxableAmount.toFixed(2),
                        item.cgst.toFixed(2),
                        item.sgst.toFixed(2),
                        item.totalGST.toFixed(2),
                      ].filter((val) => val !== "");
                      csvContent += row.join(",") + "\n";
                    });

                    // Create download link
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute(
                      "download",
                      `GST_Report_${selectedTimeframe}_${new Date().toISOString().split("T")[0]}.csv`
                    );
                    document.body.appendChild(link);

                    // Download CSV
                    link.click();
                    document.body.removeChild(link);
                    toast.success("CSV downloaded successfully");
                  }}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition duration-300 flex items-center"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Download CSV
                </button>
                <div className="flex items-center">
                  <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-sm text-gray-500">
                    {gstData.length} entries
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {selectedTimeframe === "monthly"
                        ? "Month"
                        : selectedTimeframe === "quarterly"
                          ? "Quarter"
                          : selectedTimeframe === "yearly"
                            ? "Year"
                            : "Date"}
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Amount
                    </th>
                    {reportType === "detailed" && (
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                    )}
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxable Amount
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CGST (9%)
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SGST (9%)
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total GST
                    </th>
                    {reportType === "detailed" && (
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice Amount
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gstData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={reportType === "detailed" ? 8 : 6}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No GST data available for the selected period
                      </td>
                    </tr>
                  ) : (
                    gstData.map((item, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {selectedTimeframe === "monthly"
                            ? item.month
                            : selectedTimeframe === "quarterly"
                              ? item.quarter
                              : selectedTimeframe === "yearly"
                                ? item.year
                                : item.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.sales)}
                        </td>
                        {reportType === "detailed" && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {item.orders || 0}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.taxableAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.cgst)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.sgst)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(item.totalGST)}
                        </td>
                        {reportType === "detailed" && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(item.taxableAmount + item.totalGST)}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                {gstData.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(
                          gstData.reduce((sum, item) => sum + item.sales, 0)
                        )}
                      </td>
                      {reportType === "detailed" && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {gstData.reduce(
                            (sum, item) => sum + (item.orders || 0),
                            0
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(
                          gstData.reduce(
                            (sum, item) => sum + item.taxableAmount,
                            0
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(
                          gstData.reduce((sum, item) => sum + item.cgst, 0)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(
                          gstData.reduce((sum, item) => sum + item.sgst, 0)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(
                          gstData.reduce((sum, item) => sum + item.totalGST, 0)
                        )}
                      </td>
                      {reportType === "detailed" && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(
                            gstData.reduce(
                              (sum, item) =>
                                sum + item.taxableAmount + item.totalGST,
                              0
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </motion.div>
        )}

        {/* Additional Information */}
        {!statsError && !statsLoading && (
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="text-base font-medium text-gray-700 mb-4">
              GST Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  CGST (Central GST)
                </h3>
                <p className="text-sm text-gray-500">
                  Central Goods and Services Tax is collected by the Central
                  Government on intra-state supplies of goods and services.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  SGST (State GST)
                </h3>
                <p className="text-sm text-gray-500">
                  State Goods and Services Tax is collected by the State
                  Government on intra-state supplies of goods and services.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                GST Filing Deadlines
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-500">
                <li>GSTR-1: 11th of the next month</li>
                <li>GSTR-3B: 20th of the next month</li>
                <li>
                  Annual Return (GSTR-9): 31st December of the next financial
                  year
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GSTReports;
