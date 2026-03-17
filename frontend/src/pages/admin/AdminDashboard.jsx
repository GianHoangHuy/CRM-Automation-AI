import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AdminAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import AdminTaskbar from "./AdminTaskbar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

<AdminTaskbar/>

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("revenue");
  const location = useLocation();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await AdminAPI.getDashboard();
        setStats(res.dashboard);
      } catch (error) {
        console.error("Dashboard Error:", error);
        toast.error("Không thể tải dữ liệu thống kê");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;
  if (!stats) return <div className="text-center mt-5">Không có dữ liệu</div>;

  const monthlyData = stats.revenue?.monthly || [];
  const sortedMonths = [...monthlyData].sort((a, b) => 
    (a._id.year - b._id.year) || (a._id.month - b._id.month)
  );
  const chartLabels = sortedMonths.map(item => `T${item._id.month}/${item._id.year}`);
  
  const revenueChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: sortedMonths.map(item => item.revenue),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgb(53, 162, 235)",
        borderWidth: 1,
      },
    ],
  };

  const orderChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Số đơn hàng",
        data: sortedMonths.map(item => item.orderCount),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 1,
      },
    ],
  };

  const formatMoney = (amount) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  return (
    <div className="container-fluid px-4 mt-4">
      {/* TASKBAR */}
      <AdminTaskbar />

      <h2 className="mb-4 fw-bold text-primary"><i className="fas fa-chart-line me-2"></i>Tổng quan hệ thống</h2>

      {/* 1. THẺ THỐNG KÊ */}
      <div className="row g-4 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card bg-primary text-white h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small text-uppercase fw-bold">Doanh thu tháng này</div>
                  <div className="fs-4 fw-bold">{formatMoney(stats.revenue?.thisMonth)}</div>
                </div>
                <i className="fas fa-dollar-sign fa-2x opacity-50"></i>
              </div>
            </div>
            <div className="card-footer d-flex align-items-center justify-content-between small">
              <span className="text-white-50">Tổng thu: {formatMoney(stats.revenue?.total)}</span>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card bg-warning text-dark h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-dark-50 small text-uppercase fw-bold">Tổng đơn hàng</div>
                  <div className="fs-4 fw-bold">{stats.orders?.total || 0}</div>
                </div>
                <i className="fas fa-shopping-bag fa-2x opacity-50"></i>
              </div>
            </div>
            <div className="card-footer d-flex align-items-center justify-content-between small">
                <span>Chờ xử lý: {stats.orders?.byStatus?.pending || 0}</span>
                <span>Thành công: {stats.orders?.byStatus?.delivered || 0}</span>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card bg-success text-white h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small text-uppercase fw-bold">Khách hàng mới (Tháng)</div>
                  <div className="fs-4 fw-bold">+{stats.users?.newThisMonth || 0}</div>
                </div>
                <i className="fas fa-user-plus fa-2x opacity-50"></i>
              </div>
            </div>
            <div className="card-footer d-flex align-items-center justify-content-between small">
              <span className="text-white-50">Tổng user: {stats.users?.total || 0}</span>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card bg-danger text-white h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div style={{overflow: "hidden"}}>
                  <div className="text-white-50 small text-uppercase fw-bold">Top Bán Chạy</div>
                  <div className="fs-6 fw-bold text-truncate">
                    {stats.bestSellers?.[0]?.name || "Chưa có dữ liệu"}
                  </div>
                  <div className="small">
                    Đã bán: {stats.bestSellers?.[0]?.totalQuantity || 0} cái
                  </div>
                </div>
                <i className="fas fa-trophy fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* 2. BIỂU ĐỒ */}
        <div className="col-xl-8">
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h6 className="m-0 fw-bold text-primary">
                <i className="fas fa-chart-bar me-2"></i>Biểu đồ tăng trưởng
              </h6>
              <select 
                className="form-select form-select-sm w-auto" 
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="revenue">Doanh thu</option>
                <option value="orders">Đơn hàng</option>
              </select>
            </div>
            <div className="card-body">
              <Bar 
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false },
                  },
                }} 
                data={chartType === 'revenue' ? revenueChartData : orderChartData} 
              />
            </div>
          </div>
        </div>

        {/* 3. TOP SẢN PHẨM */}
        <div className="col-xl-4">
          <div className="card mb-4 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h6 className="m-0 fw-bold text-primary"><i className="fas fa-star me-2"></i>Top Sản Phẩm</h6>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {stats.bestSellers?.map((item, index) => (
                  <li key={index} className="list-group-item d-flex justify-content-between align-items-center py-3">
                    <div className="d-flex align-items-center" style={{maxWidth: "70%"}}>
                      <span className={`badge rounded-pill me-2 ${index === 0 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        #{index + 1}
                      </span>
                      <span className="text-truncate" title={item.name}>{item.name}</span>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-success">{item.totalQuantity} bán</div>
                      <small className="text-muted">{formatMoney(item.totalRevenue)}</small>
                    </div>
                  </li>
                ))}
                {(!stats.bestSellers || stats.bestSellers.length === 0) && (
                    <li className="list-group-item text-center text-muted py-4">Chưa có dữ liệu bán hàng</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ĐƠN HÀNG GẦN ĐÂY */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-white py-3">
          <h6 className="m-0 fw-bold text-primary"><i className="fas fa-clock me-2"></i>Đơn hàng mới nhất</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats.orders?.recent?.map((order) => (
                  <tr key={order._id}>
                    <td className="ps-4 text-primary fw-bold">#{order._id.slice(-6).toUpperCase()}</td>
                    <td>{order.name || "Khách vãng lai"}</td>
                    <td className="fw-bold">{formatMoney(order.totalPrice)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className={`badge bg-${
                        order.status === 'pending' ? 'warning text-dark' : 
                        order.status === 'delivered' ? 'success' : 
                        order.status === 'cancelled' ? 'danger' : 'info'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats.orders?.recent || stats.orders.recent.length === 0) && (
                    <tr><td colSpan="5" className="text-center py-3">Chưa có đơn hàng nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;