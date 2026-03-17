import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import Swal from "sweetalert2";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", email: "", phone: "" });

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    phone: "",
    street: "",
    city: "",
    country: "Việt Nam"
  });

  // LẤY DỮ LIỆU
  const fetchProfileData = async () => {
    try {
      const [userData, addrData] = await Promise.all([
        AuthAPI.getProfile(),
        AuthAPI.getAddresses()
      ]);

      setUser(userData);
      setAddresses(addrData || []);
      
      const defaultAddr = userData.defaultAddress;
      setInfoForm({ 
          name: userData.name, 
          email: userData.email, 
          phone: defaultAddr ? defaultAddr.phone : "" 
      });
      
    } catch (error) {
      toast.error("Không thể tải thông tin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // XỬ LÝ CẬP NHẬT THÔNG TIN CÁ NHÂN
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
          name: infoForm.name,
          addresses: {
              phone: infoForm.phone 
          }
      };

      const updatedUser = await AuthAPI.updateProfile(payload);
      setUser(updatedUser);
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      
      toast.success("Cập nhật thông tin thành công");
      setShowInfoModal(false);
      fetchProfileData(); 
    } catch (error) {
      toast.error(error.message || "Lỗi cập nhật");
    }
  };

  // XỬ LÝ ĐỊA CHỈ
  const openAddAddress = () => {
    setEditingAddressId(null);
    // Form mặc định không có isDefault
    setAddressForm({ phone: "", street: "", city: "", country: "Việt Nam" });
    setShowAddressModal(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
        phone: addr.phone,
        street: addr.street,
        city: addr.city,
        country: addr.country
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...addressForm, isDefault: false };
      if (editingAddressId) {
          const currentAddr = addresses.find(a => a._id === editingAddressId);
          if (currentAddr && currentAddr.isDefault) {
              payload.isDefault = true;
          }
      }

      if (editingAddressId) {
        await AuthAPI.updateAddress(editingAddressId, payload);
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        await AuthAPI.addAddress(payload);
        toast.success("Thêm địa chỉ mới thành công");
      }
      setShowAddressModal(false);
      fetchProfileData();
    } catch (error) {
      toast.error(error.message || "Lỗi lưu địa chỉ");
    }
  };

  const handleDeleteAddress = async (id) => {
    const addressToDelete = addresses.find(a => a._id === id);

    const warningText = addressToDelete?.isDefault 
        ? "Đây là địa chỉ mặc định. Bạn sẽ cần chọn địa chỉ khác làm mặc định sau khi xóa." 
        : "Bạn có chắc chắn muốn xóa địa chỉ này không?";

    const result = await Swal.fire({
        title: 'Xóa địa chỉ này?',
        text: warningText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            await AuthAPI.deleteAddress(id);
            toast.success("Đã xóa địa chỉ");
            fetchProfileData();
        } catch (error) {
            toast.error("Lỗi khi xóa địa chỉ");
        }
    }
  };

  const handleSetDefault = async (id) => {
      try {
          await AuthAPI.setDefaultAddress(id);
          toast.success("Đã đặt làm địa chỉ mặc định");
          fetchProfileData();
      } catch (error) {
          toast.error("Lỗi đặt mặc định");
      }
  };

  if (loading) return <Loader />;
  if (!user) return null;

  return (
    <div className="container mt-4 mb-5">
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm border-0 text-center p-4">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold" 
                   style={{width: 100, height: 100, fontSize: 40}}>
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <h5 className="fw-bold">{user.name}</h5>
              <p className="text-muted mb-3">{user.email}</p>
              
              <div className="d-grid gap-2">
                <button 
                    className="btn btn-outline-primary" 
                    onClick={() => {
                        const currentPhone = user.defaultAddress ? user.defaultAddress.phone : "";
                        setInfoForm({ name: user.name, email: user.email, phone: currentPhone });
                        setShowInfoModal(true);
                    }}
                >
                    <i className="fas fa-user-edit me-2"></i> Chỉnh sửa thông tin
                </button>
                
                <Link to="/change-password" class="btn btn-outline-danger">
                  <i className="fas fa-key me-2"></i> Đổi mật khẩu
                </Link>
                <Link to="/orders" class="btn btn-outline-secondary">
                  <i className="fas fa-box-open me-2"></i> Đơn mua của tôi
                </Link>
              </div>
          </div>
        </div>

        <div className="col-md-8">
            {/* 1. THÔNG TIN CÁ NHÂN */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white fw-bold py-3">
                    <i className="fas fa-user me-2 text-primary"></i>Thông tin cá nhân
                </div>
                <div className="card-body">
                    <div className="row mb-2">
                        <div className="col-sm-3 text-muted">Họ tên:</div>
                        <div className="col-sm-9 fw-bold">{user.name}</div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-sm-3 text-muted">Email:</div>
                        <div className="col-sm-9">{user.email}</div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-sm-3 text-muted">Số điện thoại:</div>
                        <div className="col-sm-9">
                            {user.defaultAddress?.phone ? (
                                <span className="fw-bold text-dark">{user.defaultAddress.phone}</span>
                            ) : (
                                <span className="text-muted font-italic">Chưa cập nhật</span>
                            )}
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-sm-3 text-muted">Điểm thưởng:</div>
                        <div className="col-sm-9">
                            <span className="text-warning fw-bold fs-5">
                                {new Intl.NumberFormat('vi-VN').format(user.loyaltyPoints || 0)}
                            </span>
                            <span className="small text-muted ms-1">điểm</span>
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-sm-3 text-muted">Vai trò:</div>
                        <div className="col-sm-9">
                            <span className={`badge ${user.isAdmin ? 'bg-danger' : 'bg-success'}`}>
                                {user.isAdmin ? "Quản trị viên" : "Khách hàng"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ĐỊA CHỈ */}
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                    <span><i className="fas fa-map-marker-alt me-2 text-danger"></i>Sổ địa chỉ</span>
                    <button className="btn btn-sm btn-success" onClick={openAddAddress}>
                        <i className="fas fa-plus me-1"></i>Thêm địa chỉ mới
                    </button>
                </div>
                <div className="card-body">
                    {!user.defaultAddress && addresses.length > 0 && (
                        <div className="alert alert-warning small mb-3">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Bạn chưa có địa chỉ mặc định. Vui lòng chọn một địa chỉ bên dưới làm mặc định để giao hàng.
                        </div>
                    )}

                    {addresses.length === 0 ? (
                        <div className="text-center py-3 text-muted">Bạn chưa lưu địa chỉ nào.</div>
                    ) : (
                        <div className="list-group list-group-flush">
                            {addresses.map((addr) => (
                                <div key={addr._id} className={`list-group-item px-0 py-3 ${addr.isDefault ? 'bg-light' : ''}`}>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div className="mb-1">
                                                <span className="fw-bold">{addr.street}</span>
                                                {addr.isDefault && <span className="badge bg-danger ms-2">Mặc định</span>}
                                            </div>
                                            <div className="text-muted small">
                                                {addr.city}, {addr.country}
                                            </div>
                                            <div className="text-muted small mt-1">
                                                <i className="fas fa-phone me-1"></i> {addr.phone}
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2 align-items-center">
                                            {!addr.isDefault && (
                                                <button 
                                                    className="btn btn-sm btn-outline-secondary" 
                                                    onClick={() => handleSetDefault(addr._id)}
                                                    title="Đặt làm mặc định"
                                                >
                                                    Đặt làm mặc định
                                                </button>
                                            )}
                                            <button 
                                                className="btn btn-sm btn-outline-primary" 
                                                onClick={() => openEditAddress(addr)}
                                                title="Sửa"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-danger" 
                                                onClick={() => handleDeleteAddress(addr._id)}
                                                title="Xóa"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* CHỈNH SỬA THÔNG TIN CÁ NHÂN */}
      {showInfoModal && (
        <div className="modal d-block" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title"><i className="fas fa-user-edit me-2"></i>Chỉnh sửa thông tin</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setShowInfoModal(false)}></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleUpdateInfo}>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Họ tên hiển thị</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={infoForm.name} 
                                    onChange={(e) => setInfoForm({...infoForm, name: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Số điện thoại</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={infoForm.phone} 
                                    onChange={(e) => setInfoForm({...infoForm, phone: e.target.value})} 
                                    placeholder="Cập nhật SĐT mặc định..."
                                />
                                <div className="form-text small">Thay đổi này sẽ cập nhật số điện thoại của địa chỉ mặc định.</div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Email</label>
                                <input 
                                    type="email" 
                                    className="form-control bg-light" 
                                    value={infoForm.email} 
                                    disabled 
                                />
                                <div className="form-text text-muted"><i className="fas fa-info-circle me-1"></i>Email dùng để đăng nhập, không thể thay đổi.</div>
                            </div>
                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowInfoModal(false)}>Hủy bỏ</button>
                                <button type="submit" className="btn btn-primary px-4">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* THÊM/SỬA ĐỊA CHỈ */}
      {showAddressModal && (
        <div className="modal d-block" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}</h5>
                        <button type="button" className="btn-close" onClick={() => setShowAddressModal(false)}></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSaveAddress}>
                            <div className="mb-3">
                                <label className="form-label">Số điện thoại người nhận</label>
                                <input 
                                    type="text" className="form-control" required
                                    value={addressForm.phone}
                                    onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                                    placeholder="VD: 0909123456"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Địa chỉ (Số nhà, Tên đường, Phường/Xã)</label>
                                <input 
                                    type="text" className="form-control" required
                                    value={addressForm.street}
                                    onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                                    placeholder="VD: 19 Nguyễn Hữu Thọ, P. Tân Phong, Q.7"
                                />
                            </div>
                            <div className="row">
                                <div className="col-6 mb-3">
                                    <label className="form-label">Tỉnh/Thành phố</label>
                                    <input 
                                        type="text" className="form-control" required
                                        value={addressForm.city}
                                        onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                                        placeholder="VD: TP.HCM"
                                    />
                                </div>
                                <div className="col-6 mb-3">
                                    <label className="form-label">Quốc gia</label>
                                    <input 
                                        type="text" className="form-control" required
                                        value={addressForm.country}
                                        onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                                        placeholder="VD: Việt Nam"
                                    />
                                </div>
                            </div>
                        
                            <div className="d-flex justify-content-end gap-2 mt-3">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddressModal(false)}>Hủy</button>
                                <button type="submit" className="btn btn-success">Lưu địa chỉ</button>
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

export default ProfilePage;