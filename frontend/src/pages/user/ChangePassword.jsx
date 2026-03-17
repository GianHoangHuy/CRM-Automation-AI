import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../../services/api";
import { toast } from "react-toastify";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = formData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return toast.error("Vui lòng điền đầy đủ các trường");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp");
    }
    if (newPassword.length < 6) {
      return toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    try {
      setLoading(true);
      await AuthAPI.changePassword({ oldPassword, newPassword });
      
      toast.success("Đổi mật khẩu thành công!");
      navigate("/profile");
    } catch (error) {
      toast.error(error.message || "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu cũ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0 py-2"><i className="fas fa-lock me-2"></i>Đổi Mật Khẩu</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="form-control"
                    name="oldPassword"
                    placeholder="Nhập mật khẩu cũ..."
                    value={formData.oldPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-control"
                    name="newPassword"
                    placeholder="Nhập mật khẩu mới..."
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-control"
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu mới..."
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="d-grid gap-2 mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/profile")}
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;