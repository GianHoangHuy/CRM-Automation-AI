import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OrderAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import Swal from "sweetalert2";

const PLACEHOLDER_IMG = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22200%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23dee2e6%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const data = await OrderAPI.getCart();
      setCart(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // 1. Lọc các sản phẩm
  const validItems = cart?.items?.filter(item => item.product) || [];
  
  // 2. Tính Tạm tính
  const selectedSubtotal = validItems.reduce((acc, item) => {
      if (selectedItems.includes(item._id)) {
          return acc + (item.price * item.quantity);
      }
      return acc;
  }, 0);

  // 3. Tính Giảm giá
  const discountPercent = cart?.discount?.value || 0;
  const selectedDiscountAmount = (selectedSubtotal * discountPercent) / 100;

  // 4. Phí vận chuyển (Chỉ tính khi có mua hàng)
  const shippingFee = selectedItems.length > 0 ? 30000 : 0;

  // 5. Tổng cộng cuối cùng
  const finalTotal = Math.max(0, selectedSubtotal - selectedDiscountAmount + shippingFee);

  const handleUpdateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      const updatedCart = await OrderAPI.updateCartItem(itemId, newQty);
      setCart(updatedCart);
    } catch (error) {
      toast.error("Lỗi cập nhật giỏ hàng");
    }
  };

  const handleRemoveItem = async (itemId) => {
    const result = await Swal.fire({
        title: 'Xóa sản phẩm?',
        text: "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const updatedCart = await OrderAPI.removeCartItem(itemId);
            setCart(updatedCart);
            setSelectedItems((prev) => prev.filter((id) => id !== itemId));
            toast.success("Đã xóa sản phẩm");
        } catch (error) {
            toast.error("Lỗi khi xóa sản phẩm");
        }
    }
  };

  const handleRemoveCoupon = async () => {
    try {
        const updatedCart = await OrderAPI.removeDiscount();
        setCart(updatedCart);
        toast.info("Đã hủy mã giảm giá");
    } catch (error) {
        toast.error("Không thể hủy mã giảm giá");
    }
  };

  const handleSelect = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === validItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(validItems.map((item) => item._id));
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const updatedCart = await OrderAPI.applyCoupon(couponCode);
      setCart(updatedCart);
      toast.success("Áp dụng mã giảm giá thành công!");
      setCouponCode("");
    } catch (error) {
      toast.error(error.message || "Mã giảm giá không hợp lệ");
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) return toast.warn("Vui lòng chọn sản phẩm để thanh toán");
    navigate("/checkout", { state: { selectedItems } });
  };

  const getProductImage = (product) => {
    if (!product || !product.images || product.images.length === 0) return PLACEHOLDER_IMG;
    const firstImage = product.images[0];
    if (typeof firstImage === 'string') return firstImage;
    if (typeof firstImage === 'object' && firstImage.url) return firstImage.url;
    return PLACEHOLDER_IMG;
  };

  if (loading) return <Loader />;

  if (!cart || validItems.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <div className="py-5 bg-light rounded">
            <h3 className="text-muted mb-3">Giỏ hàng trống</h3>
            <Link to="/catalog" className="btn btn-primary">Mua sắm ngay</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4 fw-bold"><i className="fas fa-shopping-cart me-2"></i>Giỏ Hàng ({validItems.length})</h2>
      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="selectAll"
                  checked={validItems.length > 0 && selectedItems.length === validItems.length}
                  onChange={handleSelectAll} style={{ cursor: "pointer" }} />
                <label className="form-check-label fw-bold ms-2 user-select-none" htmlFor="selectAll">Chọn tất cả ({validItems.length} sản phẩm)</label>
              </div>
            </div>
            <ul className="list-group list-group-flush">
              {validItems.map((item) => (
                <li key={item._id} className={`list-group-item p-3 ${selectedItems.includes(item._id) ? 'bg-light' : ''}`}>
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <input className="form-check-input" type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => handleSelect(item._id)}
                        style={{ cursor: "pointer", width: "18px", height: "18px" }} />
                    </div>
                    <Link to={`/product/${item.product._id}`}>
                        <img
                            src={getProductImage(item.product)}
                            alt={item.name}
                            style={{ width: "80px", height: "80px", objectFit: "contain", backgroundColor: "#fff" }}
                            className="rounded border"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMG; }}
                        />
                    </Link>
                    <div className="ms-3 flex-grow-1">
                      <h6 className="mb-1 fw-bold">
                        <Link to={`/product/${item.product._id}`} className="text-decoration-none text-dark">{item.name}</Link>
                      </h6>
                      {item.variantId && <small className="text-muted d-block mb-1">Phân loại: {item.variantId}</small>}
                      <div className="fw-bold text-danger">
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price)}
                      </div>
                    </div>
                    <div className="d-flex align-items-center mx-3">
                      <div className="input-group input-group-sm" style={{ width: "100px" }}>
                        <button className="btn btn-outline-secondary" onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                        <input type="text" className="form-control text-center bg-white" value={item.quantity} readOnly />
                        <button className="btn btn-outline-secondary" onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}>+</button>
                      </div>
                    </div>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleRemoveItem(item._id)}><i className="fas fa-trash-alt"></i></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* CỘT THANH TOÁN */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 sticky-top" style={{ top: "20px", zIndex: 1 }}>
            <div className="card-body p-4">
              <h5 className="card-title mb-4 fw-bold text-primary">Thanh toán</h5>
              
              {/* Tạm tính */}
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tạm tính ({selectedItems.length} sản phẩm):</span>
                <span className="fw-bold">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedSubtotal)}</span>
              </div>

              {/* Giảm giá */}
              {selectedDiscountAmount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success align-items-center">
                  <span>
                      <i className="fas fa-tag me-1"></i>Voucher: 
                      <span className="badge bg-success ms-2">{cart.discount?.code} (-{discountPercent}%)</span>
                  </span>
                  <div className="d-flex align-items-center">
                      <span className="me-2">-{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedDiscountAmount)}</span>
                      <button 
                        className="btn btn-sm btn-link text-danger p-0 text-decoration-none" 
                        onClick={handleRemoveCoupon}
                        title="Hủy mã giảm giá"
                      >
                          <i className="fas fa-times-circle"></i>
                      </button>
                  </div>
                </div>
              )}

              {/* Phí vận chuyển */}
              {selectedItems.length > 0 && (
                <div className="d-flex justify-content-between mb-2 text-muted small">
                    <span>Phí vận chuyển:</span>
                    <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(shippingFee)}</span>
                </div>
              )}
              
              <hr className="my-3" />
              
              {/* Tổng cộng */}
              <div className="d-flex justify-content-between mb-4 align-items-center">
                <span className="fw-bold fs-6">Tổng cộng:</span>
                <span className="text-danger fw-bold fs-4">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(finalTotal)}</span>
              </div>
              
              {/* Nhập mã giảm giá */}
              {!cart.discount && (
                  <div className="input-group mb-3">
                      <input type="text" className="form-control" placeholder="Mã giảm giá" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                      <button className="btn btn-outline-primary" onClick={handleApplyCoupon}>Áp dụng</button>
                  </div>
              )}
              
              <button className="btn btn-success w-100 py-3 fw-bold text-uppercase shadow-sm" onClick={handleCheckout} disabled={selectedItems.length === 0}>
                Mua hàng ({selectedItems.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;