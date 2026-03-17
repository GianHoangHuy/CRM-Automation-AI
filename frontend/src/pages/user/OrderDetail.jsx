import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { OrderAPI } from "../../services/api";
import Loader from "../../components/common/Loader";
import { toast } from "react-toastify";

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await OrderAPI.getDetail(id);
        setOrder(data);
      } catch (error) {
        toast.error("Không thể tải thông tin đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <Loader />;
  if (!order) return <div className="text-center mt-5">Không tìm thấy đơn hàng</div>;

  const formatMoney = (amount) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const formatDate = (dateString) => 
    new Date(dateString).toLocaleString("vi-VN");

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           <Link to="/orders" className="text-decoration-none text-secondary mb-2 d-inline-block">
             <i className="fas fa-arrow-left me-1"></i> Quay lại
           </Link>
           <h4>Chi tiết đơn hàng <span className="text-primary">#{order._id.slice(-6).toUpperCase()}</span></h4>
           <span className="text-muted">Ngày đặt: {formatDate(order.createdAt)}</span>
        </div>
        <div className="text-end">
           <span className={`badge fs-6 px-3 py-2 bg-${
             order.status === 'delivered' ? 'success' : 
             order.status === 'cancelled' ? 'danger' : 
             order.status === 'shipping' ? 'info' : 'warning text-dark'
           }`}>
             {order.status === 'pending' ? 'CHỜ XỬ LÝ' :
              order.status === 'confirmed' ? 'ĐÃ XÁC NHẬN' :
              order.status === 'shipping' ? 'ĐANG GIAO HÀNG' :
              order.status === 'delivered' ? 'GIAO THÀNH CÔNG' : 'ĐÃ HỦY'}
           </span>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Danh sách sản phẩm */}
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-header bg-white fw-bold">Sản phẩm đã mua</div>
            <ul className="list-group list-group-flush">
              {order.items.map((item, index) => (
                <li key={index} className="list-group-item py-3">
                  <div className="d-flex align-items-center">
                    <img 
                      src={item.product?.image || item.product?.images?.[0] || "https://via.placeholder.com/60"} 
                      alt={item.product?.name} 
                      style={{width: 60, height: 60, objectFit: "cover"}}
                      className="rounded border me-3"
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-1">
                        <Link to={`/product/${item.product._id}`} className="text-decoration-none text-dark">
                           {item.product?.name}
                        </Link>
                      </h6>
                      {item.variantInfo && (
                         <small className="text-muted d-block">
                           Phân loại: {item.variantInfo.name} ({item.variantInfo.attributes?.ram} {item.variantInfo.attributes?.color})
                         </small>
                      )}
                      <small className="text-muted">Số lượng: x{item.quantity}</small>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">{formatMoney(item.price)}</div>
                      <small className="text-muted">Tổng: {formatMoney(item.subTotal)}</small>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Tổng tiền */}
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Tạm tính</span>
                <span>{formatMoney(order.subtotal || order.items.reduce((acc, i) => acc + i.subTotal, 0))}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Phí vận chuyển</span>
                <span>{formatMoney(order.shipping || 30000)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Giảm giá (Voucher)</span>
                  <span>-{formatMoney(order.discountAmount)}</span>
                </div>
              )}
              {order.pointsUsed > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Điểm thưởng sử dụng ({order.pointsUsed} điểm)</span>
                  <span>-{formatMoney(order.pointsUsed * 1000)}</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between fs-5 fw-bold">
                <span>Thành tiền</span>
                <span className="text-danger">{formatMoney(order.totalPrice)}</span>
              </div>
              <div className="mt-2 text-end text-muted small">
                Phương thức thanh toán: {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin giao hàng & Lịch sử trạng thái */}
        <div className="col-lg-4">
          {/* Thông tin người nhận */}
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-header bg-white fw-bold">Địa chỉ nhận hàng</div>
            <div className="card-body">
              <h6 className="fw-bold">{order.user?.name || order.name}</h6>
              <p className="mb-1 text-muted small">{order.user?.email || order.email}</p>
              <p className="mb-2 text-muted small">SĐT: {order.shippingAddress?.phone}</p>
              <div className="border-top pt-2 mt-2">
                 <p className="mb-0 small">
                   {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.country}
                 </p>
              </div>
            </div>
          </div>

          {/* Lịch sử trạng thái */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white fw-bold">Lịch sử trạng thái</div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {order.statusHistory && order.statusHistory.length > 0 ? (
                   [...order.statusHistory].reverse().map((hist, idx) => (
                     <li key={idx} className="list-group-item">
                       <div className="d-flex">
                         <div className="me-3 d-flex flex-column align-items-center">
                            <div className={`rounded-circle ${idx === 0 ? 'bg-primary' : 'bg-secondary'} mt-1`} style={{width: 10, height: 10}}></div>
                            {idx !== order.statusHistory.length - 1 && <div className="bg-light flex-grow-1" style={{width: 2, minHeight: 20}}></div>}
                         </div>
                         <div>
                           <div className="fw-bold text-capitalize">
                             {hist.status === 'pending' ? 'Đặt hàng thành công' :
                              hist.status === 'confirmed' ? 'Đã xác nhận đơn hàng' :
                              hist.status === 'shipping' ? 'Đang vận chuyển' :
                              hist.status === 'delivered' ? 'Giao hàng thành công' :
                              hist.status === 'cancelled' ? 'Đã hủy đơn hàng' : hist.status}
                           </div>
                           <small className="text-muted">{formatDate(hist.updatedAt)}</small>
                         </div>
                       </div>
                     </li>
                   ))
                ) : (
                  <li className="list-group-item text-muted text-center">Chưa có lịch sử</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;