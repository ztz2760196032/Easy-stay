import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import MerchantLayout from './pages/Merchant/Layout';
import AdminLayout from './pages/Admin/Layout';
import HotelForm from './pages/Merchant/HotelForm';
import HotelListAdmin from './pages/Admin/HotelList';

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole: 'merchant' | 'admin' }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== requiredRole) return <Navigate to={user.role === 'admin' ? '/admin' : '/merchant'} />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/merchant',
    element: <ProtectedRoute requiredRole="merchant"><MerchantLayout /></ProtectedRoute>,
    children: [{ path: 'form', element: <HotelForm /> }, { path: '', element: <HotelForm /> }],
  },
  {
    path: '/admin',
    element: <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>,
    children: [{ path: '', element: <HotelListAdmin /> }],
  },
  { path: '/', element: <Navigate to="/login" /> },
]);