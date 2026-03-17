import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";
import AdminTaskbar from "./AdminTaskbar";
import Swal from "sweetalert2";

const AdminOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState(""); 

  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, status: filterStatus };
      const res = await AdminAPI.getOrders(params);
      setOrders(res.orders || []);
      setMeta({ 
          currentPage: res.currentPage, 
          totalPages: res.totalPages,
          totalOrders: res.totalOrders 
      });
    } catch (error) {
      toast.error("Lỗi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, filterStatus]);

  // Xem chi tiết đơn hàng
  const handleViewDetail = async (orderId) => {
    setShowModal(true);
    setLoadingDetail(true);
    try {
        const detail = await AdminAPI.getOrderDetail(orderId);
        setSelectedOrder(detail);
    } catch (error) {
        toast.error("Không thể tải chi tiết đơn hàng");
        setShowModal(false);
    } finally {
        setLoadingDetail(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    let statusText = "";
    let confirmColor = "#3085d6";
    
    switch (newStatus) {
        case 'confirmed': statusText = "Xác nhận đơn hàng"; confirmColor = "#0d6efd"; break;
        case 'shipping': statusText = "Đang giao hàng"; confirmColor = "#0dcaf0"; break;
        case 'delivered': statusText = "Giao hàng thành công"; confirmColor = "#198754"; break;
        case 'cancelled': statusText = "Hủy đơn hàng"; confirmColor = "#dc3545"; break;
        default: statusText = newStatus;
    }

    const result = await Swal.fire({
      title: `Chuyển trạng thái: ${statusText}?`,
      text: "Bạn có chắc chắn muốn cập nhật trạng thái cho đơn hàng này?",
      icon: newStatus === 'cancelled' ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ'
    });

    if (result.isConfirmed) {
      try {
        await AdminAPI.updateOrderStatus(orderId, newStatus);
        Swal.fire({
            title: 'Thành công!',
            text: `Đơn hàng đã được chuyển sang trạng thái: ${newStatus}`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        fetchOrders();
        
        if (selectedOrder && selectedOrder._id === orderId) {
            handleViewDetail(orderId);
        }
      } catch (error) {
        Swal.fire('Lỗi!', error.message || "Lỗi cập nhật trạng thái", 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending": return <span className="badge bg-warning text-dark"><i className="fas fa-clock me-1"></i>Chờ xử lý</span>;
      case "confirmed": return <span className="badge bg-primary"><i className="fas fa-check me-1"></i>Đã xác nhận</span>;
      case "shipping": return <span className="badge bg-info text-dark"><i className="fas fa-truck me-1"></i>Đang giao</span>;
      case "delivered": return <span className="badge bg-success"><i className="fas fa-box-open me-1"></i>Đã giao</span>;
      case "cancelled": return <span className="badge bg-danger"><i className="fas fa-times-circle me-1"></i>Đã hủy</span>;
      default: return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const formatMoney = (amount) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  return (
    <div className="container-fluid px-4 mt-4 mb-5">
      <div className="row">
        <div className="col-lg-9 col-md-12"><AdminTaskbar /></div>
        <div className="col-lg-3 col-md-12">
            <div className="bg-white shadow-sm p-3 rounded mb-4 d-flex align-items-center justify-content-between" style={{minHeight: '68px'}}>
                <label className="fw-bold text-secondary me-2"><i className="fas fa-filter me-1"></i>Lọc:</label>
                <select 
                    className="form-select form-select-sm border-primary flex-grow-1" 
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                >
                    <option value="">-- Tất cả --</option>
                    <option value="pending">⏳ Chờ xử lý</option>
                    <option value="confirmed">✅ Đã xác nhận</option>
                    <option value="shipping">🚚 Đang giao</option>
                    <option value="delivered">📦 Đã giao xong</option>
                    <option value="cancelled">❌ Đã hủy</option>
                </select>
            </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom">
             <h5 className="fw-bold text-primary mb-0">
                <i className="fas fa-clipboard-list me-2"></i>Danh sách Đơn hàng
                <span className="badge bg-secondary ms-2 fs-6" style={{fontSize: '0.8rem'}}>{meta.totalOrders || 0} đơn</span>
             </h5>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light text-secondary text-uppercase small fw-bold">
                <tr>
                  <th className="ps-4 py-3">Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Chi tiết</th>
                  <th className="text-end pe-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr><td colSpan="7" className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                ) : orders.length > 0 ? (
                    orders.map((order) => (
                    <tr key={order._id}>
                        <td className="ps-4 fw-bold text-primary font-monospace">#{order._id.slice(-6).toUpperCase()}</td>
                        <td>
                            <div className="fw-bold text-dark">{order.name || "Khách lẻ"}</div>
                            <small className="text-muted">{order.email}</small>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td className="fw-bold text-danger">{formatMoney(order.totalPrice)}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        
                        <td className="text-center">
                            <button 
                                className="btn btn-sm btn-outline-info rounded-circle shadow-sm" 
                                style={{width: '32px', height: '32px', padding: 0, lineHeight: '30px'}}
                                onClick={() => handleViewDetail(order._id)}
                                title="Xem chi tiết đơn hàng"
                            >
                                <i className="fas fa-info"></i>
                            </button>
                        </td>

                        <td className="text-end pe-4">
                            <div className="btn-group">
                                <button type="button" className="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
                                    <i className="fas fa-cog me-1"></i>Xử lý
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                    {order.status === 'pending' && (
                                        <li><button className="dropdown-item text-primary" onClick={() => handleUpdateStatus(order._id, 'confirmed')}><i className="fas fa-check me-2"></i>Xác nhận đơn</button></li>
                                    )}
                                    {(order.status === 'confirmed' || order.status === 'pending') && (
                                        <li><button className="dropdown-item text-info" onClick={() => handleUpdateStatus(order._id, 'shipping')}><i className="fas fa-truck me-2"></i>Giao hàng</button></li>
                                    )}
                                    {order.status === 'shipping' && (
                                        <li><button className="dropdown-item text-success" onClick={() => handleUpdateStatus(order._id, 'delivered')}><i className="fas fa-box-open me-2"></i>Đã giao xong</button></li>
                                    )}
                                    {(order.status !== 'cancelled' && order.status !== 'delivered') && (
                                        <>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><button className="dropdown-item text-danger" onClick={() => handleUpdateStatus(order._id, 'cancelled')}><i className="fas fa-ban me-2"></i>Hủy đơn hàng</button></li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan="7" className="text-center py-5 text-muted">Không tìm thấy đơn hàng nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {!loading && meta.totalPages > 1 && (
            <div className="card-footer bg-white py-3"><Pagination currentPage={meta.currentPage} totalPages={meta.totalPages} onPageChange={(p) => setPage(p)} /></div>
        )}
      </div>

      {/* --- CHI TIẾT ĐƠN HÀNG --- */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", overflowY: 'auto' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                    <i className="fas fa-file-invoice me-2"></i>
                    Chi tiết đơn hàng #{selectedOrder?._id.slice(-6).toUpperCase()}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              
              <div className="modal-body bg-light p-4">
                {loadingDetail ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div><p className="mt-2">Đang tải thông tin...</p></div>
                ) : selectedOrder ? (
                    <div className="row g-4">
                        {/* Thông tin người nhận */}
                        <div className="col-md-6">
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-header bg-white fw-bold text-primary"><i className="fas fa-user me-2"></i>Người nhận</div>
                                <div className="card-body">
                                    <p className="mb-2"><strong>Họ tên:</strong> {selectedOrder.user?.name || selectedOrder.name}</p>
                                    <p className="mb-2"><strong>Email:</strong> {selectedOrder.user?.email || selectedOrder.email}</p>
                                    <p className="mb-2"><strong>SĐT:</strong> <span className="text-primary">{selectedOrder.shippingAddress?.phone}</span></p>
                                    <p className="mb-0"><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.country}</p>
                                </div>
                            </div>
                        </div>

                        {/* Thông tin thanh toán */}
                        <div className="col-md-6">
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-header bg-white fw-bold text-primary"><i className="fas fa-money-bill-wave me-2"></i>Thanh toán & Trạng thái</div>
                                <div className="card-body">
                                    <p className="mb-2"><strong>Phương thức:</strong> {selectedOrder.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : 'Chuyển khoản'}</p>
                                    <p className="mb-2"><strong>Ngày đặt:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                                    <div className="mb-3 d-flex align-items-center">
                                        <strong className="me-2">Trạng thái: </strong> {getStatusBadge(selectedOrder.status)}
                                    </div>
                                    
                                    {selectedOrder.status === 'pending' && (
                                        <button className="btn btn-sm btn-primary w-100 shadow-sm" onClick={() => handleUpdateStatus(selectedOrder._id, 'confirmed')}>
                                            <i className="fas fa-check me-1"></i> Xác nhận đơn này
                                        </button>
                                    )}
                                    {selectedOrder.status === 'confirmed' && (
                                        <button className="btn btn-sm btn-info w-100 shadow-sm text-white" onClick={() => handleUpdateStatus(selectedOrder._id, 'shipping')}>
                                            <i className="fas fa-truck me-1"></i> Giao hàng ngay
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Danh sách sản phẩm */}
                        <div className="col-12">
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white fw-bold text-primary"><i className="fas fa-box me-2"></i>Sản phẩm ({selectedOrder.items.length})</div>
                                <ul className="list-group list-group-flush">
                                    {selectedOrder.items.map((item, idx) => (
                                        <li key={idx} className="list-group-item d-flex align-items-center py-3">
                                            <img 
                                                src={item.product?.images?.[0]?.url || item.product?.images?.[0] || "https://via.placeholder.com/50"} 
                                                alt="" 
                                                style={{width: 60, height: 60, objectFit: 'contain'}} 
                                                className="rounded border me-3 bg-white"
                                                onError={(e) => e.target.src = "https://via.placeholder.com/50"}
                                            />
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1 text-dark fw-bold">{item.product?.name || "Sản phẩm đã xóa"}</h6>
                                                {item.variantInfo && <small className="text-muted d-block">Loại: {item.variantInfo.name}</small>}
                                                <small className="text-muted">Đơn giá: {formatMoney(item.price)}</small>
                                            </div>
                                            <div className="text-end">
                                                <div className="fw-bold fs-5">x{item.quantity}</div>
                                                <div className="text-danger fw-bold">{formatMoney(item.subTotal)}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="card-footer bg-white p-3">
                                    <div className="d-flex justify-content-between mb-1"><span>Tạm tính:</span> <span>{formatMoney(selectedOrder.subtotal)}</span></div>
                                    <div className="d-flex justify-content-between mb-1"><span>Phí ship:</span> <span>{formatMoney(selectedOrder.shipping)}</span></div>
                                    {selectedOrder.discountAmount > 0 && (
                                        <div className="d-flex justify-content-between mb-1 text-success"><span>Giảm giá:</span> <span>-{formatMoney(selectedOrder.discountAmount)}</span></div>
                                    )}
                                    <hr className="my-2"/>
                                    <div className="d-flex justify-content-between fw-bold fs-4 align-items-center">
                                        <span>Tổng cộng:</span> 
                                        <span className="text-danger">{formatMoney(selectedOrder.totalPrice)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-5 text-muted">Không tìm thấy thông tin chi tiết.</div>
                )}
              </div>
              <div className="modal-footer bg-light border-0">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModal(false)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrderList;
