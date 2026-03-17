import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-dark text-light pt-5 pb-3 mt-auto border-top border-secondary">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4">
            <h5 className="text-warning fw-bold mb-3">
              <i className="fas fa-laptop-code me-2"></i>COMPUTER STORE
            </h5>
            <p className="text-secondary">
              Chuyên cung cấp máy tính, laptop và linh kiện PC chính hãng. 
              Cam kết chất lượng, bảo hành uy tín và giá cả cạnh tranh nhất thị trường.
            </p>
          </div>

          <div className="col-md-4 mb-4">
            <h5 className="fw-bold mb-3">Liên kết nhanh</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-decoration-none text-light opacity-75 hover-opacity-100">
                  <i className="fas fa-angle-right me-2"></i>Trang chủ
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/catalog" className="text-decoration-none text-light opacity-75 hover-opacity-100">
                  <i className="fas fa-angle-right me-2"></i>Sản phẩm
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/cart" className="text-decoration-none text-light opacity-75 hover-opacity-100">
                  <i className="fas fa-angle-right me-2"></i>Giỏ hàng
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/profile" className="text-decoration-none text-light opacity-75 hover-opacity-100">
                  <i className="fas fa-angle-right me-2"></i>Tài khoản
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-md-4 mb-4">
            <h5 className="fw-bold mb-3">Thông tin liên hệ</h5>
            <ul className="list-unstyled text-secondary">
              <li className="mb-2">
                <i className="fas fa-map-marker-alt me-3 text-warning"></i>
                19 Nguyễn Hữu Thọ, Quận 7, TP.HCM
              </li>
              <li className="mb-2">
                <i className="fas fa-envelope me-3 text-warning"></i>
                support@computerstore.vn
              </li>
              <li className="mb-2">
                <i className="fas fa-phone me-3 text-warning"></i>
                Hotline: 0123 456 789
              </li>
            </ul>
            
            <div className="d-flex gap-3 mt-3">
              <a href="#" className="text-light fs-5"><i className="fab fa-facebook"></i></a>
              <a href="#" className="text-light fs-5"><i className="fab fa-youtube"></i></a>
              <a href="#" className="text-light fs-5"><i className="fab fa-instagram"></i></a>
              <a href="#" className="text-light fs-5"><i className="fab fa-github"></i></a>
            </div>
          </div>
        </div>

        <hr className="border-secondary my-3" />

        <div className="text-center text-secondary small">
          <p className="mb-0">
            © {new Date().getFullYear()} Computer Store. Đồ án môn Lập trình Web với Node.js.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;