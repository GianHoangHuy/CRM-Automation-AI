import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthAPI } from "../../services/api";
import Loader from "../../components/common/Loader";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Vui lòng nhập email của bạn");

    try {
      setLoading(true);
      await AuthAPI.forgotPassword({ email });
      
      setIsSubmitted(true);
      toast.success("Đã gửi yêu cầu! Vui lòng kiểm tra email.");
    } catch (error) {
      toast.error(error.message || "Không tìm thấy tài khoản với email này");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <i className="fas fa-lock fa-3x text-primary mb-3"></i>
                <h3 className="fw-bold">Quên Mật Khẩu?</h3>
                <p className="text-muted small">
                  Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục.
                </p>
              </div>

              {isSubmitted ? (
                <div className="alert alert-success text-center">
                  <i className="fas fa-envelope-open-text fa-2x mb-2"></i>
                  <p className="mb-0">Link đặt lại mật khẩu đã được gửi đến <strong>{email}</strong>.</p>
                  <p className="small mt-2">Vui lòng kiểm tra hộp thư đến (hoặc mục Spam).</p>
                  <Link to="/login" className="btn btn-outline-success btn-sm mt-2">
                    Quay lại Đăng nhập
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email đăng ký</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="d-grid gap-2">
                    <button 
                        type="submit" 
                        className="btn btn-primary py-2 fw-bold"
                        disabled={loading}
                    >
                        {loading ? (
                            <span><span className="spinner-border spinner-border-sm me-2"></span>Đang gửi...</span>
                        ) : "Gửi yêu cầu"}
                    </button>
                    <Link to="/login" className="btn btn-light text-muted">
                        Hủy bỏ
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;