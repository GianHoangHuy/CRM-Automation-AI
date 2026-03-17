import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// Components chung
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import PrivateRoute from "./components/common/PrivateRoute";

// Pages - Public
import LandingPage from "./pages/LandingPage";
import CatalogPage from "./pages/product/CatalogPage";
import ProductDetail from "./pages/product/ProductDetail";
import CartPage from "./pages/product/CartPage";
import CheckoutPage from "./pages/product/CheckoutPage";
import NotFoundPage from "./pages/NotFoundPage";

// Pages - Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import LoginSuccess from "./pages/auth/LoginSuccess";

// Pages - User (Cần đăng nhập)
import ProfilePage from "./pages/user/ProfilePage";
import OrderHistoryPage from "./pages/user/OrderHistory";
import OrderDetailPage from "./pages/user/OrderDetail";
import ChangePassword from "./pages/user/ChangePassword";

// Pages - Admin (Cần quyền Admin)
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTaskbar from "./pages/admin/AdminTaskbar";
import AdminProductList from "./pages/admin/ProductList";
import AdminOrderList from "./pages/admin/OrderList";
import ProductEdit from "./pages/admin/ProductEdit";
import AdminUserList from "./pages/admin/UserList";
import AdminDiscountList from "./pages/admin/DiscountList";
import AdminCategoryList from "./pages/admin/CategoryList";


function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Header />

      <main className="flex-grow-1">
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} /> 
          <Route path="/login-success" element={<LoginSuccess />} />

          {/* --- USER ROUTES (Cần Login) --- */}
          <Route element={<PrivateRoute role="user" />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/orders" element={<OrderHistoryPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
          </Route>

          {/* --- ADMIN ROUTES --- */}
          <Route path="/admin" element={<PrivateRoute role="admin" />}>
            <Route index element={<AdminDashboard />} /> {/* /admin */}
            
            {/* Quản lý Danh mục */}
            <Route path="categories" element={<AdminCategoryList />} />

            {/* Quản lý Sản phẩm */}
            <Route path="products" element={<AdminProductList />} /> {/* /admin/products */}
            <Route path="products/new" element={<ProductEdit />} /> {/* Thêm mới */}
            <Route path="products/:id" element={<ProductEdit />} /> {/* Chỉnh sửa */}
            
            {/* Quản lý Đơn hàng */}
            <Route path="orders" element={<AdminOrderList />} /> {/* /admin/orders */}
            
            {/* Quản lý Người dùng (Mới thêm) */}
            <Route path="users" element={<AdminUserList />} /> {/* /admin/users */}
            
            {/* Quản lý Mã giảm giá (Mới thêm) */}
            <Route path="discounts" element={<AdminDiscountList />} /> {/* /admin/discounts */}
          </Route>

          {/* --- 404 Not Found --- */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer luôn hiển thị */}
      <Footer />
    </div>
  );
}

export default App;