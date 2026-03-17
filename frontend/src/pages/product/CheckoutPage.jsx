import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { OrderAPI, AuthAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";

const PLACEHOLDER_IMG = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22200%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23dee2e6%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedItems } = location.state || { selectedItems: [] };

  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    phone: "",
    country: "Việt Nam",
    paymentMethod: "COD",
    usedPoints: 0
  });

  const getProductImage = (product) => {
    if (!product || !product.images || product.images.length === 0) return PLACEHOLDER_IMG;
    const firstImage = product.images[0];
    if (typeof firstImage === 'string') return firstImage;
    if (typeof firstImage === 'object' && firstImage.url) return firstImage.url;
    return PLACEHOLDER_IMG;
  };

  useEffect(() => {
    if (!selectedItems || selectedItems.length === 0) {
        toast.warning("Vui lòng chọn sản phẩm từ giỏ hàng để thanh toán");
        navigate("/cart");
        return;
    }

    const initData = async () => {
      try {
        const cartData = await OrderAPI.getCart();
        setCart(cartData);

        try {
            const userData = await AuthAPI.getProfile();
            setUser(userData);
            
            const defaultAddr = userData.defaultAddress;
            setFormData(prev => ({
                ...prev,
                name: userData.name || "",
                email: userData.email || "",
                phone: defaultAddr ? defaultAddr.phone : "",
                address: defaultAddr ? defaultAddr.street : "",
                city: defaultAddr ? defaultAddr.city : "",
                country: defaultAddr ? defaultAddr.country : "Việt Nam"
            }));
        } catch (err) {
            console.log("Guest checkout or error fetching profile");
        }
      } catch (error) {
        toast.error("Lỗi khởi tạo trang thanh toán");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [selectedItems, navigate]);

  const checkoutItems = cart?.items?.filter(item => selectedItems.includes(item._id)) || [];
  
  const subtotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountPercent = cart?.discount?.value || 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const shippingFee = 30000;
  
  const pointsDiscount = Math.min((Number(formData.usedPoints) || 0) * 1000, subtotal); 
  
  const total = Math.max(0, subtotal - discountAmount + shippingFee - pointsDiscount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (user && formData.usedPoints > user.loyaltyPoints) {
        return toast.error(`Bạn chỉ có ${user.loyaltyPoints} điểm thưởng.`);
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        shippingAddress: {
            street: formData.address,
            city: formData.city,
            phone: formData.phone,
            country: formData.country
        },
        paymentMethod: formData.paymentMethod,
        selectedItems: selectedItems,
        usedPoints: formData.usedPoints
      };

      await OrderAPI.checkout(payload);
      
      toast.success("Đặt hàng thành công! Cảm ơn bạn đã mua sắm.");
      
      if (user) {
          navigate("/orders");
      } else {
          navigate("/");
      }
      
    } catch (error) {
      toast.error(error.message || "Đặt hàng thất bại");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4 text-center fw-bold text-primary">Thanh Toán</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="row">
            <div className="col-md-7 mb-4">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold"><i className="fas fa-map-marker-alt me-2 text-danger"></i>Thông tin giao hàng</h5>
                </div>
                <div className="card-body p-4">
                
                <div className="mb-3">
                    <label className="form-label fw-bold">Họ và tên</label>
                    <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Nhập họ tên người nhận"
                    />
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Email</label>
                        <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                        placeholder="email@example.com"
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Số điện thoại</label>
                        <input
                        type="text"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        placeholder="09xxxxxxxx"
                        />
                    </div>
                </div>
                <div className="mb-3">
                    <label className="form-label fw-bold">Địa chỉ nhận hàng</label>
                    <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                    placeholder="Số nhà, tên đường, phường/xã..."
                    />
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Tỉnh / Thành phố</label>
                        <input
                        type="text"
                        className="form-control"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        required
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Quốc gia</label>
                        <input
                        type="text"
                        className="form-control"
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        required
                        readOnly
                        />
                    </div>
                </div>

                <h5 className="mb-3 mt-4 fw-bold"><i className="fas fa-credit-card me-2 text-warning"></i>Phương thức thanh toán</h5>
                <div className="border rounded p-3">
                    <div className="form-check mb-2">
                        <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="cod"
                        value="COD"
                        checked={formData.paymentMethod === "COD"}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        />
                        <label className="form-check-label" htmlFor="cod">
                        <i className="fas fa-money-bill-wave me-2 text-success"></i>Thanh toán khi nhận hàng (COD)
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="banking"
                        value="BANKING"
                        checked={formData.paymentMethod === "BANKING"}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        />
                        <label className="form-check-label" htmlFor="banking">
                        <i className="fas fa-university me-2 text-primary"></i>Chuyển khoản ngân hàng
                        </label>
                    </div>
                </div>

                {user && (
                    <div className="mt-4 p-3 bg-light rounded border border-warning">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold mb-0 text-warning">
                                <i className="fas fa-star me-1"></i>Điểm thưởng của bạn: {user.loyaltyPoints}
                            </label>
                            <small className="text-muted">(1 điểm = 1.000đ)</small>
                        </div>
                        <div className="input-group">
                            <input 
                                type="number" 
                                className="form-control" 
                                placeholder="Nhập số điểm muốn dùng"
                                value={formData.usedPoints}
                                min="0"
                                max={user.loyaltyPoints}
                                onChange={(e) => setFormData({...formData, usedPoints: e.target.value})}
                            />
                            <span className="input-group-text">điểm</span>
                        </div>
                        {formData.usedPoints > 0 && (
                            <small className="text-success d-block mt-1">
                                Sẽ giảm: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.usedPoints * 1000)}
                            </small>
                        )}
                    </div>
                )}
                </div>
            </div>
            </div>

            <div className="col-md-5">
            <div className="card shadow-sm border-0 sticky-top" style={{top: '20px'}}>
                <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold"><i className="fas fa-shopping-bag me-2 text-primary"></i>Tóm tắt đơn hàng</h5>
                </div>
                <div className="card-body p-0">
                    {/* Danh sách sản phẩm */}
                    <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                        <ul className="list-group list-group-flush">
                            {checkoutItems.map((item) => (
                                <li key={item._id} className="list-group-item p-3">
                                    <div className="d-flex">
                                        <div className="me-3 position-relative">
                                            <img 
                                                src={getProductImage(item.product)} 
                                                alt={item.name} 
                                                style={{width: 60, height: 60, objectFit: 'contain'}} 
                                                className="rounded border bg-white"
                                                referrerPolicy="no-referrer"
                                            />
                                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary border border-light">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-0 text-truncate" style={{maxWidth: '200px'}} title={item.name}>{item.name}</h6>
                                            {item.variantId && <small className="text-muted d-block">Loại: {item.variantId}</small>}
                                            <div className="d-flex justify-content-between mt-1">
                                                <small className="text-muted">{new Intl.NumberFormat('vi-VN').format(item.price)} x {item.quantity}</small>
                                                <span className="fw-bold text-dark">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Tính toán tiền */}
                    <div className="p-4 bg-light border-top">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Tạm tính:</span>
                            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Phí vận chuyển:</span>
                            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee)}</span>
                        </div>
                        
                        {/* Hiển thị giảm giá nếu có */}
                        {discountAmount > 0 && (
                            <div className="d-flex justify-content-between mb-2 text-success">
                                <span><i className="fas fa-ticket-alt me-1"></i>Voucher ({cart.discount?.code}):</span>
                                <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</span>
                            </div>
                        )}
                        
                        {/* Hiển thị giảm giá điểm thưởng */}
                        {pointsDiscount > 0 && (
                            <div className="d-flex justify-content-between mb-2 text-success">
                                <span><i className="fas fa-coins me-1"></i>Điểm thưởng:</span>
                                <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pointsDiscount)}</span>
                            </div>
                        )}

                        <hr className="my-3" />
                        
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold fs-5">Tổng cộng:</span>
                            <span className="fw-bold fs-4 text-danger">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                            </span>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-danger w-100 py-3 mt-4 fw-bold text-uppercase shadow-sm"
                        >
                            ĐẶT HÀNG NGAY
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;