import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthAPI } from "../../services/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Vui lòng nhập đầy đủ Email và Mật khẩu!");
    }

    try {
      setLoading(true);
      const data = await AuthAPI.login({ email, password });
      
      // Lưu thông tin
      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data));

      toast.success(`Chào mừng ${data.name} quay trở lại!`);

      // Điều hướng
      if (data.isAdmin) {
        navigate("/admin"); 
      } else {
        navigate("/"); 
      }

    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
      window.location.href = `${API_URL}/users/${provider}`;
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow border-0">
            <div className="card-body p-5">
              <h3 className="text-center mb-4 fw-bold text-primary">Đăng Nhập</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Mật khẩu</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Nhập mật khẩu..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                    </button>
                  </div>
                </div>
                
                <div className="d-flex justify-content-end mb-4">
                    <Link to="/forgot-password" class="small text-decoration-none">Quên mật khẩu?</Link>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2 fw-bold mb-3"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>

                <div className="text-center mb-3">
                    <span className="text-muted small">hoặc đăng nhập với</span>
                </div>

                <div className="d-grid gap-2">
                    {/* Đăng nhặp bằng Google */}
                    <button 
                        type="button"
                        className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2"
                        onClick={() => handleSocialLogin('google')}
                    >
                        <i className="fab fa-google"></i> Đăng nhập với Google
                    </button>
                </div>

              </form>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="small text-muted mb-0">
                  Chưa có tài khoản? <Link to="/register" className="text-decoration-none fw-bold">Đăng ký ngay</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;