import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
      <h1 className="display-1 fw-bold text-danger">404</h1>
      <p className="fs-3"> <span className="text-danger">Rất tiếc!</span> Không tìm thấy trang này.</p>
      <p className="lead">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <Link to="/" className="btn btn-primary">
        Quay về trang chủ
      </Link>
    </div>
  );
};

export default NotFoundPage;