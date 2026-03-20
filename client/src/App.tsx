import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer routes */}
          <Route path="/shop"       element={<ProtectedRoute><Shop /></ProtectedRoute>} />
          <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
          <Route path="/cart"       element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout"   element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders"     element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
          <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Staff routes — admin & sales */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRoles={['admin', 'sales']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
