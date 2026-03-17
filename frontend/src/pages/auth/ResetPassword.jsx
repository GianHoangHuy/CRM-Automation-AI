import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthAPI } from "../../services/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
        return toast.error("Mật khẩu xác nhận không khớp");
    }
    if (password.length < 6) {
        return toast.error("Mật khẩu phải có ít nhất 6 ký tự");
    }

    try {
      setLoading(true);
      await AuthAPI.resetPassword(token, { password });
      
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "Token không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow border-0">
            <div className="card-header bg-success text-white text-center py-3">
                <h5 className="mb-0">Đặt Lại Mật Khẩu Mới</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Mật khẩu mới</label>
                  <div className="input-group">
                    <input
                        type={showPass ? "text" : "password"}
                        className="form-control"
                        placeholder="Nhập mật khẩu mới..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass(!showPass)}>
                        <i className={showPass ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Nhập lại mật khẩu..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button 
                    type="submit" 
                    className="btn btn-success w-100 py-2 fw-bold"
                    disabled={loading}
                >
                    {loading ? "Đang cập nhật..." : "Xác nhận đổi mật khẩu"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;