import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import AdminTaskbar from "./AdminTaskbar";

const AdminDiscountList = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newCode, setNewCode] = useState({ code: "", value: 0, usageLimit: 10 });
  const [showModal, setShowModal] = useState(false);

  const fetchDiscounts = async () => {
    try {
      const res = await AdminAPI.getDiscounts();
      setDiscounts(res.discounts || []);
    } catch (error) {
      toast.error("Lỗi tải danh sách mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    
    const valueNum = Number(newCode.value);
    const usageLimitNum = Number(newCode.usageLimit);

    if (!newCode.code || valueNum <= 0 || usageLimitNum <= 0) {
      return toast.warning("Vui lòng nhập đầy đủ thông tin hợp lệ");
    }

    try {
      const payload = {
          code: newCode.code,
          value: valueNum,
          usageLimit: usageLimitNum,
          usedCount: 0
      };

      await AdminAPI.createDiscount(payload);
      
      toast.success("Tạo mã giảm giá thành công!");
      setShowModal(false);
      setNewCode({ code: "", value: 0, usageLimit: 10 });
      fetchDiscounts(); 
    } catch (error) {
      const errorMsg = error.error || error.message || "Lỗi tạo mã giảm giá";
      toast.error(errorMsg);
      console.error("Lỗi tạo mã:", error);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container-fluid px-4 mt-4 mb-5">
      <AdminTaskbar />

      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm border-start border-5 border-danger">
        <div>
           <h4 className="fw-bold text-danger mb-0">
             <i className="fas fa-ticket-alt me-2"></i>QUẢN LÝ MÃ GIẢM GIÁ
           </h4>
           <small className="text-muted">Tạo và quản lý các voucher khuyến mãi cho khách hàng</small>
        </div>
        <button 
          className="btn btn-danger fw-bold shadow-sm"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>Tạo mã mới
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light text-secondary text-uppercase small fw-bold">
                <tr>
                  <th className="ps-4 py-3">Mã Code</th>
                  <th>Mức giảm</th>
                  <th className="text-center">Sử dụng</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-end pe-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {discounts.length > 0 ? (
                  discounts.map((d) => {
                    const isExpired = d.usedCount >= d.usageLimit;
                    return (
                    <tr key={d._id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                            <div className="bg-light text-danger border border-danger rounded px-2 py-1 fw-bold font-monospace me-2">
                                {d.code}
                            </div>
                        </div>
                      </td>
                      <td>
                          <span className="fw-bold text-success">-{d.value}%</span>
                          <span className="text-muted small ms-1">trên đơn hàng</span>
                      </td>
                      <td className="text-center">
                         <div className="d-inline-block" style={{minWidth: "80px"}}>
                            <small className="d-block text-muted mb-1">Đã dùng: {d.usedCount}/{d.usageLimit}</small>
                            <div className="progress" style={{height: "6px"}}>
                                <div 
                                    className={`progress-bar ${isExpired ? 'bg-secondary' : 'bg-danger'}`} 
                                    role="progressbar" 
                                    style={{width: `${(d.usedCount/d.usageLimit)*100}%`}}
                                ></div>
                            </div>
                         </div>
                      </td>
                      <td>
                        {isExpired ? (
                          <span className="badge bg-secondary"><i className="fas fa-lock me-1"></i>Hết lượt</span>
                        ) : (
                          <span className="badge bg-success"><i className="fas fa-check-circle me-1"></i>Đang chạy</span>
                        )}
                      </td>
                      <td className="text-muted small">
                          <i className="far fa-calendar-alt me-1"></i>
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                      </td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-outline-secondary" title="Chi tiết (Đang phát triển)" disabled>
                           <i className="fas fa-ellipsis-h"></i>
                        </button>
                      </td>
                    </tr>
                  )})
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                        <i className="fas fa-ticket-alt fa-3x mb-3 d-block opacity-25"></i>
                        Chưa có mã giảm giá nào được tạo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold"><i className="fas fa-plus-circle me-2"></i>Tạo Voucher Mới</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleCreateDiscount}>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-secondary">Mã Code</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light"><i className="fas fa-barcode"></i></span>
                        <input 
                        type="text" 
                        className="form-control text-uppercase fw-bold" 
                        placeholder="VD: SALE50, TET2025..."
                        value={newCode.code}
                        onChange={(e) => setNewCode({...newCode, code: e.target.value.toUpperCase()})}
                        required
                        />
                    </div>
                    <div className="form-text">Mã code nên ngắn gọn, viết liền không dấu.</div>
                  </div>

                  <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold text-secondary">Giảm giá (%)</label>
                        <div className="input-group">
                            <input 
                            type="number" 
                            className="form-control" 
                            value={newCode.value}
                            min="1" max="100"
                            onChange={(e) => setNewCode({...newCode, value: e.target.value})}
                            required
                            />
                            <span className="input-group-text">%</span>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold text-secondary">Số lượng</label>
                        <input 
                        type="number" 
                        className="form-control" 
                        value={newCode.usageLimit}
                        min="1"
                        onChange={(e) => setNewCode({...newCode, usageLimit: e.target.value})}
                        required
                        />
                      </div>
                  </div>

                  <div className="alert alert-light border mt-2 mb-0 small text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Mã giảm giá này sẽ được áp dụng trực tiếp vào tổng giá trị đơn hàng khi khách hàng nhập mã lúc thanh toán.
                  </div>
                  
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Đóng</button>
                    <button type="submit" className="btn btn-danger px-4 fw-bold">Tạo ngay</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscountList;