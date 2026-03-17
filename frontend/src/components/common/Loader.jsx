import React from "react";

const Loader = () => {
  return (
    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: "200px" }}>
      <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
        <span className="visually-hidden">Đang tải...</span>
      </div>
    </div>
  );
};

export default Loader;