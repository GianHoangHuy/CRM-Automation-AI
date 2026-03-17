import React from "react";
import { Link, useLocation } from "react-router-dom";

const AdminTaskbar = () => {
  const location = useLocation();
  
  return (
    <div className="bg-white shadow-sm mb-4 p-3 rounded d-flex flex-wrap gap-2 align-items-center">
      <span className="fw-bold text-primary me-3">
        <i className="fas fa-user-shield me-2"></i>QUẢN TRỊ:
      </span>
      
      <Link to="/admin" className={`btn btn-sm ${location.pathname === "/admin" ? "btn-primary" : "btn-outline-primary"}`}>
        <i className="fas fa-tachometer-alt me-1"></i> Dashboard
      </Link>

      <Link to="/admin/categories" className={`btn btn-sm ${location.pathname.includes("/categories") ? "btn-secondary" : "btn-outline-secondary"}`}>
          <i className="fas fa-list-alt me-1"></i> Danh mục
      </Link>

      <Link to="/admin/products" className={`btn btn-sm ${location.pathname.includes("/products") ? "btn-success" : "btn-outline-success"}`}>
        <i className="fas fa-box-open me-1"></i> Sản phẩm
      </Link>

      <Link to="/admin/users" className={`btn btn-sm ${location.pathname.includes("/users") ? "btn-info text-white" : "btn-outline-info"}`}>
        <i className="fas fa-users me-1"></i> Người dùng
      </Link>

      <Link to="/admin/orders" className={`btn btn-sm ${location.pathname.includes("/orders") ? "btn-warning text-dark" : "btn-outline-warning text-dark"}`}>
        <i className="fas fa-clipboard-list me-1"></i> Đơn hàng
      </Link>

      <Link to="/admin/discounts" className={`btn btn-sm ${location.pathname.includes("/discounts") ? "btn-danger" : "btn-outline-danger"}`}>
        <i className="fas fa-tags me-1"></i> Mã giảm giá
      </Link>
    </div>
  );
};

export default AdminTaskbar;