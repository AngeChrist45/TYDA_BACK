import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import './index.css';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';
import VendorNegotiations from './pages/vendor/Negotiations';

// Layout
import Layout from './components/Layout';
import VendorLayout from './components/VendorLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('tyda_token');
    const userRole = localStorage.getItem('tyda_user_role');
    setIsAuthenticated(!!token);
    setIsVendor(userRole === 'vendeur');
  }, []);

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  const VendorRoute = ({ children }) => {
    return isAuthenticated && isVendor ? children : <Navigate to="/" />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Client routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Route>

          {/* Vendor routes */}
          <Route path="/vendor" element={<VendorRoute><VendorLayout /></VendorRoute>}>
            <Route index element={<VendorDashboard />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="negotiations" element={<VendorNegotiations />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
