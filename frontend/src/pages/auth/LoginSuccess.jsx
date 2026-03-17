import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Loader from "../../components/common/Loader";

const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      toast.error("Đăng nhập thất bại. Không tìm thấy token.");
      navigate("/login");
      return;
    }

    localStorage.setItem("token", token);

    axios.get("http://localhost:5000/api/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      localStorage.setItem("userInfo", JSON.stringify(res.data));
      toast.success("Đăng nhập thành công!");
      navigate("/");
    })
    .catch((err) => {
      console.error(err);
      toast.error("Không thể lấy thông tin người dùng!");
      navigate("/login");
    });

  }, [searchParams, navigate]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100">
       <Loader />
       <p className="mt-3 text-muted">Đang xử lý đăng nhập...</p>
    </div>
  );
};

export default LoginSuccess;
