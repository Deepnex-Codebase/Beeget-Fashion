import AdminDashboard from '../components/Admin/AdminDashboard';
import NewDashboard from '../components/Admin/NewDashboard';
import Layout from '../components/Layout/Layout';

const AdminPage = () => {
  // Using static AdminDashboard instead of conditional rendering
  return (
    <Layout hideHeader={true}>
      <AdminDashboard />
    </Layout>
  );
};

export default AdminPage;