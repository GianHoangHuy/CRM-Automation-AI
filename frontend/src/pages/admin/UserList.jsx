import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import Swal from "sweetalert2"; 
import AdminTaskbar from "./AdminTaskbar";

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    country: ""
  });

  const fetchUsers = async () => {
    try {
      const data = await AdminAPI.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error("Lỗi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setEditingUser(user);
    const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0] || {};
    
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: defaultAddr.phone || "",
      street: defaultAddr.street || "",
      city: defaultAddr.city || "",
      country: defaultAddr.country || ""
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email
      };

      await AdminAPI.updateUser(editingUser._id, payload);
      
      toast.success("Cập nhật thông tin thành công!");
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Lỗi cập nhật thông tin");
    }
  };

  const handleBlockUser = async (userId, isBlocked, userName) => {
    const action = isBlocked ? "MỞ KHÓA" : "KHÓA";
    const confirmText = isBlocked ? "Người dùng này sẽ được phép đăng nhập trở lại." : "Người dùng này sẽ không thể đăng nhập được nữa.";
    const confirmColor = isBlocked ? "#28a745" : "#d33"; 

    const result = await Swal.fire({
      title: `Bạn muốn ${action} tài khoản ${userName}?`,
      text: confirmText,
      icon: isBlocked ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Đồng ý ${action}`,
      cancelButtonText: 'Hủy bỏ'
    });

    if (result.isConfirmed) {
      try {
        if (isBlocked) {
          await AdminAPI.unblockUser(userId);
          Swal.fire('Đã mở khóa!', `Tài khoản ${userName} đã hoạt động trở lại.`, 'success');
        } else {
          await AdminAPI.blockUser(userId);
          Swal.fire('Đã khóa!', `Tài khoản ${userName} đã bị vô hiệu hóa.`, 'success');
        }
        fetchUsers(); 
      } catch (error) {
        Swal.fire('Lỗi!', error.message || "Không thể cập nhật trạng thái.", 'error');
      }
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container-fluid px-4 mt-4 mb-5">
      <AdminTaskbar />

      <h2 className="fw-bold text-primary mb-4">
        <i className="fas fa-users-cog me-2"></i>Quản lý Người dùng
      </h2>
      
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light text-secondary">
                <tr>
                  <th className="ps-4 py-3">Tên người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Điểm thưởng</th>
                  <th>Trạng thái</th>
                  <th className="text-end pe-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className={`rounded-circle text-white d-flex justify-content-center align-items-center fw-bold shadow-sm ${user.isAdmin ? 'bg-danger' : 'bg-primary'}`} style={{width: 40, height: 40, fontSize: '1.2rem'}}>
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                            <div className="fw-bold text-dark">{user.name}</div>
                            <small className="text-muted">ID: {user._id.slice(-6).toUpperCase()}</small>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {user.isAdmin ? (
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">Quản trị viên</span>
                      ) : (
                        <span className="badge bg-info bg-opacity-10 text-info border border-info">Khách hàng</span>
                      )}
                    </td>
                    <td className="text-warning fw-bold">
                        {new Intl.NumberFormat('vi-VN').format(user.loyaltyPoints || 0)} 
                        <span className="small text-muted fw-normal ms-1">điểm</span>
                    </td>
                    <td>
                      {user.isBlocked ? (
                        <span className="badge bg-secondary"><i className="fas fa-lock me-1"></i>Đã khóa</span>
                      ) : (
                        <span className="badge bg-success"><i className="fas fa-check-circle me-1"></i>Hoạt động</span>
                      )}
                    </td>
                    <td className="text-end pe-4">
                      {!user.isAdmin && ( 
                        <div className="d-flex gap-2 justify-content-end">
                            <button 
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleEditClick(user)}
                                title="Xem và Sửa thông tin"
                            >
                                <i className="fas fa-info-circle"></i>
                            </button>

                            <button 
                            className={`btn btn-sm fw-bold ${user.isBlocked ? "btn-outline-success" : "btn-outline-danger"}`}
                            onClick={() => handleBlockUser(user._id, user.isBlocked, user.name)}
                            title={user.isBlocked ? "Mở khóa tài khoản này" : "Khóa tài khoản này"}
                            style={{minWidth: "100px"}}
                            >
                            {user.isBlocked ? (
                                <><i className="fas fa-unlock me-2"></i>Mở khóa</>
                            ) : (
                                <><i className="fas fa-lock me-2"></i>Khóa</>
                            )}
                            </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-5 text-muted">Chưa có người dùng nào trong hệ thống.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CHỈNH SỬA THÔNG TIN NGƯỜI DÙNG */}
      {showModal && (
        <div className="modal d-block" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title"><i className="fas fa-user-edit me-2"></i>Chỉnh sửa thông tin người dùng</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSaveUser}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Họ tên</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                    />
                    <div className="form-text text-warning">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Thay đổi email có thể ảnh hưởng đến việc đăng nhập của người dùng.
                    </div>
                  </div>

                  <hr />
                  <h6 className="text-muted mb-3">Thông tin địa chỉ mặc định (Tham khảo)</h6>
                  <div className="row g-2">
                      <div className="col-6">
                          <label className="form-label small">Số điện thoại</label>
                          <input type="text" className="form-control form-control-sm" value={formData.phone} readOnly />
                      </div>
                      <div className="col-6">
                          <label className="form-label small">Thành phố</label>
                          <input type="text" className="form-control form-control-sm" value={formData.city} readOnly />
                      </div>
                      <div className="col-12">
                          <label className="form-label small">Địa chỉ</label>
                          <input type="text" className="form-control form-control-sm" value={formData.street} readOnly />
                      </div>
                  </div>
                  
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                    <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
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

export default AdminUserList;