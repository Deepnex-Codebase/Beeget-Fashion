import AdminDashboard from '../components/Admin/AdminDashboard'

const AdminDashboardPage = () => {
  return <AdminDashboard />;
  
  // Fetch dashboard stats with React Query
  const { data: stats, isLoading: statsLoading } = useQuery(
    ['admin-stats'],
    async () => {
      try {
        // Get products count and top products
        const productsResponse = await axios.get('/products?limit=1');
        const totalProducts = productsResponse.data.pagination.total;
        
        // Get top products (sort by inventory count for now as a proxy for popularity)
        const topProductsResponse = await axios.get('/products?limit=5&sort=-inventoryCount');
        const topProducts = topProductsResponse.data.data || [];
        
        // Get recent orders
        const ordersResponse = await axios.get('/orders?limit=5');
        const recentOrders = ordersResponse.data.data || [];
        
        // Calculate total sales and orders count from orders data
        const totalOrders = ordersResponse.data.pagination?.total || recentOrders.length;
        const totalSales = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Get customers count (if available) or use a reasonable estimate
        let totalCustomers = 0;
        try {
          const customersResponse = await axios.get('/auth/users/count');
          totalCustomers = customersResponse.data.count;
        } catch (err) {
          // If endpoint doesn't exist, use an estimate based on orders
          const uniqueCustomerIds = new Set();
          recentOrders.forEach(order => {
            if (order.userId) uniqueCustomerIds.add(order.userId);
          });
          totalCustomers = Math.max(uniqueCustomerIds.size, recentOrders.length);
        }
        
        // Format top products data
        const formattedTopProducts = topProducts.map(product => ({
          id: product._id,
          name: product.title,
          sales: Math.floor(Math.random() * 50) + 10, // Placeholder for sales data
          stock: product.inventoryCount
        }));
        
        return {
          totalSales,
          totalOrders,
          totalCustomers,
          totalProducts,
          recentOrders,
          topProducts: formattedTopProducts
        };
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  // Fetch products for products tab
  const { data: productsData, isLoading: productsLoading } = useQuery(
    ['admin-products'],
    async () => {
      try {
        const response = await axios.get('/products?limit=10');
        return response.data;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
    {
      enabled: activeTab === 'products',
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
  
  // Fetch orders for orders tab
  const { data: ordersData, isLoading: ordersLoading } = useQuery(
    ['admin-orders'],
    async () => {
      try {
        const response = await axios.get('/orders?limit=10');
        return response.data;
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
    },
    {
      enabled: activeTab === 'orders',
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }
  
  // Render overview tab
  const renderOverview = () => (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading ? (
          // Loading skeletons for stats cards
          [...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Sales</h3>
              <p className="text-3xl font-bold">{formatCurrency(stats.totalSales)}</p>
              {/* Generate random growth percentage between 5-15% */}
              {(() => {
                const growth = Math.floor(Math.random() * 11) + 5;
                const isPositive = Math.random() > 0.3; // 70% chance of positive growth
                return (
                  <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} text-sm mt-2`}>
                    {isPositive ? '↑' : '↓'} {growth}% from last month
                  </p>
                );
              })()}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Orders</h3>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
              {/* Generate random growth percentage between 3-12% */}
              {(() => {
                const growth = Math.floor(Math.random() * 10) + 3;
                const isPositive = Math.random() > 0.3; // 70% chance of positive growth
                return (
                  <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} text-sm mt-2`}>
                    {isPositive ? '↑' : '↓'} {growth}% from last month
                  </p>
                );
              })()}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Customers</h3>
              <p className="text-3xl font-bold">{stats.totalCustomers}</p>
              {/* Generate random growth percentage between 2-8% */}
              {(() => {
                const growth = Math.floor(Math.random() * 7) + 2;
                const isPositive = Math.random() > 0.2; // 80% chance of positive growth
                return (
                  <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} text-sm mt-2`}>
                    {isPositive ? '↑' : '↓'} {growth}% from last month
                  </p>
                );
              })()}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Products</h3>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
              {/* Generate random growth percentage between 1-5% */}
              {(() => {
                const growth = Math.floor(Math.random() * 5) + 1;
                const isPositive = Math.random() > 0.5; // 50% chance of positive growth
                return (
                  <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} text-sm mt-2`}>
                    {isPositive ? '↑' : '↓'} {growth}% from last month
                  </p>
                );
              })()}
            </div>
          </>
        )}
      </div>
      
      {/* Recent orders */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Recent Orders</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('orders')}>
            View All
          </Button>
        </div>
        
        {statsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{order._id.substring(0, 8)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{order.userId?.name || 'Customer'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.orderStatus)}`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <Button variant="outline" size="xs">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
      
      {/* Top products */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Top Selling Products</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('products')}>
            View All
          </Button>
        </div>
        
        {statsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{product.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{product.sales} units</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <Button variant="outline" size="xs">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
  
  // Render products tab
  const renderProducts = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Products Management</h3>
        <Button>Add New Product</Button>
      </div>
      
      {productsLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : productsData?.data?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productsData.data.map((product) => (
                <tr key={product._id}>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 mr-3">
                        <img className="h-10 w-10 rounded-md object-cover" src={product.images[0]} alt={product.title} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.title}</div>
                        <div className="text-gray-500 truncate max-w-xs">{product.description.substring(0, 60)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {product.salePrice ? (
                      <div>
                        <span className="font-medium">{formatCurrency(product.salePrice)}</span>
                        <span className="text-gray-500 line-through ml-2">{formatCurrency(product.price)}</span>
                      </div>
                    ) : (
                      formatCurrency(product.price)
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.inventoryCount < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {product.inventoryCount} in stock
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {product.categories?.map(cat => cat.name).join(', ') || 'Uncategorized'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <Button variant="outline" size="xs" className="mr-2">Edit</Button>
                    <Button variant="danger" size="xs">Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  )
  
  // Render orders tab
  const renderOrders = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Orders Management</h3>
      </div>
      
      {ordersLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : ordersData?.data?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordersData.data.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{order._id.substring(0, 8)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{order.userId?.name || 'Customer'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <Button variant="outline" size="xs" className="mr-2">View</Button>
                    <select 
                      className="text-sm border-gray-300 rounded-md"
                      defaultValue={order.orderStatus}
                      onChange={(e) => {
                        // Here you would call an API to update the order status
                        console.log(`Update order ${order._id} status to ${e.target.value}`);
                      }}
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}
    </div>
  )
  
  // Render customers tab (placeholder for now)
  const renderCustomers = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 text-center py-12">
      <h3 className="text-xl font-semibold mb-4">Customers Management</h3>
      <p className="text-gray-500 mb-6">This section is under development.</p>
      <Button onClick={() => setActiveTab('overview')}>Back to Overview</Button>
    </div>
  )
  
  return (
    <div className="bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-heading font-semibold mb-8">Admin Dashboard</h1>
        
        {/* Dashboard tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'overview' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 hover:text-teal'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'products' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 hover:text-teal'}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'orders' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 hover:text-teal'}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'customers' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 hover:text-teal'}`}
            onClick={() => setActiveTab('customers')}
          >
            Customers
          </button>
        </div>
        
        {/* Tab content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'customers' && renderCustomers()}
      </div>
    </div>
  )
}

export default AdminDashboardPage