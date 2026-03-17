import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthAPI } from "../../services/api";
import { toast } from "react-toastify";

const Header = () => {
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem("userInfo"));
  const token = localStorage.getItem("token");

  const handleLogout = async () => {
    try {
      await AuthAPI.logout(); 
    } catch (error) {
      console.error("Lỗi logout server:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      toast.info("Đã đăng xuất thành công");
      navigate("/"); 
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-3 shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold text-warning" to="/">
          <i className="fas fa-laptop-code me-2"></i>COMPUTER STORE
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/"><i className="fas fa-home me-1"></i> Trang chủ</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/catalog"><i className="fas fa-list me-1"></i> Sản phẩm</Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            
            <Link to="/cart" className="btn btn-outline-light position-relative border-0">
              <i className="fas fa-shopping-cart fa-lg"></i>
            </Link>

            {token && user ? (
              <div className="dropdown">
                <button 
                  className="btn btn-secondary dropdown-toggle d-flex align-items-center" 
                  type="button" 
                  id="userDropdown" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                >
                  <div className="bg-warning rounded-circle text-dark d-flex align-items-center justify-content-center me-2" style={{width: 30, height: 30}}>
                    <i className="fas fa-user"></i>
                  </div>
                  <span>Xin chào, <strong>{user.name}</strong></span>
                </button>

                <ul className="dropdown-menu dropdown-menu-end shadow" aria-labelledby="userDropdown">
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="fas fa-id-card me-2 text-primary"></i> Hồ sơ của tôi
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/orders">
                      <i className="fas fa-box-open me-2 text-success"></i> Đơn mua
                    </Link>
                  </li>
                  
                  {user.isAdmin && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <Link className="dropdown-item fw-bold text-danger" to="/admin">
                          <i className="fas fa-user-shield me-2"></i> Quản trị hệ thống
                        </Link>
                      </li>
                    </>
                  )}
                  
                  <li><hr className="dropdown-divider" /></li>
                  
                  {/*  Nút Đăng xuất */}
                  <li>
                    <button 
                      className="dropdown-item text-danger" 
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i> Đăng xuất
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              // Đăng ký
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm">Đăng nhập</Link>
                <Link to="/register" className="btn btn-warning btn-sm text-dark fw-bold">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;