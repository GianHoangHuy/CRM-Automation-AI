import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { OrderAPI } from "../../services/api";
import Loader from "../../components/common/Loader";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await OrderAPI.getHistory();
        setOrders(data);
      } catch (error) {
        console.error("Lỗi tải lịch sử đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending": return <span className="badge bg-warning text-dark">Chờ xử lý</span>;
      case "confirmed": return <span className="badge bg-primary">Đã xác nhận</span>;
      case "shipping": return <span className="badge bg-info text-dark">Đang giao</span>;
      case "delivered": return <span className="badge bg-success">Giao thành công</span>;
      case "cancelled": return <span className="badge bg-danger">Đã hủy</span>;
      default: return <span className="badge bg-secondary">{status}</span>;
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Lịch sử đơn hàng</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-5 bg-light rounded">
          <h4>Bạn chưa có đơn hàng nào</h4>
          <Link to="/catalog" className="btn btn-primary mt-3">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="table-responsive shadow-sm rounded">
          <table className="table table-hover align-middle mb-0 bg-white">
            <thead className="bg-light">
              <tr>
                <th className="py-3 ps-4">Mã đơn hàng</th>
                <th className="py-3">Ngày đặt</th>
                <th className="py-3">Sản phẩm</th>
                <th className="py-3">Tổng tiền</th>
                <th className="py-3">Trạng thái</th>
                <th className="py-3 text-end pe-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="ps-4 fw-bold text-primary">#{order._id.slice(-6).toUpperCase()}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      {order.items?.[0]?.product?.images?.[0] && (
                        <img 
                          src={order.items[0].product.images[0]} 
                          alt="" 
                          style={{width: 40, height: 40, objectFit: "cover"}}
                          className="rounded me-2 border"
                        />
                      )}
                      <span className="text-truncate" style={{maxWidth: "200px"}}>
                        {order.items?.[0]?.product?.name || "Sản phẩm"}
                        {order.items.length > 1 && <span className="text-muted ms-1">(+{order.items.length - 1} khác)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="fw-bold text-danger">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalPrice)}
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td className="text-end pe-4">
                    <Link to={`/orders/${order._id}`} className="btn btn-sm btn-outline-primary">
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;