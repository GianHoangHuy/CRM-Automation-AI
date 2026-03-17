import React from "react";
import { Link } from "react-router-dom";

const PLACEHOLDER_IMG = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22200%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23dee2e6%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

const ProductCard = ({ product }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);
  };

  const getImageUrl = (product) => {
    if (!product || !product.images || product.images.length === 0) {
      return PLACEHOLDER_IMG;
    }
    const firstImage = product.images[0];
    if (typeof firstImage === 'string') return firstImage;
    if (typeof firstImage === 'object' && firstImage.url) return firstImage.url;
    return PLACEHOLDER_IMG;
  };

  const imageUrl = getImageUrl(product);

  // --- THÊM MỚI: HÀM BẮT SỰ KIỆN CRM ---
  const handleHover = () => {
    const logData = {
      action: "RÊ CHUỘT (HOVER)",
      productId: product._id,
      productName: product.name,
      time: new Date().toLocaleTimeString()
    };
    console.log(`%c[CRM TRACKING] Khách đang lướt xem: ${product.name}`, 'color: #b000ff; font-weight: bold; font-size: 13px;', logData);
  };

  const handleClick = () => {
    const logData = {
      action: "CLICK SẢN PHẨM",
      productId: product._id,
      productName: product.name,
      time: new Date().toLocaleTimeString()
    };
    console.log(`%c[CRM TRACKING] Khách đã click chọn: ${product.name}`, 'color: #00cc00; font-weight: bold; font-size: 14px;', logData);
    
    // Tiện tay lưu luôn vào localStorage để lát ra Trang chủ hiển thị Gợi ý sản phẩm
    if (product.category) {
        localStorage.setItem('crm_interested_category', typeof product.category === 'object' ? product.category._id : product.category);
    }
  };
  // ------------------------------------

  return (
    <div className="col">
      {/* THÊM onMouseEnter và onClick vào ngay thẻ div card này */}
      <div 
        className="card h-100 shadow-sm border-0"
        onMouseEnter={handleHover}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <Link to={`/product/${product.slug || product._id}`}>
          <img
            src={imageUrl}
            className="card-img-top p-3"
            alt={product.name || "Sản phẩm"}
            loading="lazy"
            referrerPolicy="no-referrer"
            style={{ objectFit: "contain", height: "200px", width: "100%" }}
            onError={(e) => { 
                e.target.onerror = null; 
                e.target.src = PLACEHOLDER_IMG; 
            }}
          />
        </Link>
        <div className="card-body d-flex flex-column p-3">
          <h6 className="card-title text-dark fw-bold" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              height: '2.5em',
              lineHeight: '1.25em'
          }}>
            <Link
              to={`/product/${product.slug || product._id}`}
              className="text-decoration-none text-dark"
              title={product.name}
            >
              {product.name || "Tên sản phẩm"}
            </Link>
          </h6>
          
          <div className="mt-auto">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-danger fw-bold fs-5">
                {formatPrice(product.price)}
              </span>
              <small className="text-warning">
                {product.rating || 0} <i className="fas fa-star"></i>
              </small>
            </div>
            
            <Link 
              to={`/product/${product.slug || product._id}`} 
              className="btn btn-outline-primary btn-sm w-100"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;