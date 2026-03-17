import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProductAPI, AdminAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";
import Swal from "sweetalert2";
import AdminTaskbar from "./AdminTaskbar";

const PLACEHOLDER_IMG = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20fill%3D%22%23f8f9fa%22%20width%3D%22200%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23dee2e6%22%20font-family%3D%22sans-serif%22%20font-size%3D%2230%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";

const AdminProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({}); 
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(""); 
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { 
        page, 
        limit: 10, 
        search: searchTerm,
        sort: 'createdAt_desc' 
      };
      
      const res = await ProductAPI.getAll(params);
      setProducts(res.data);
      setMeta(res.meta);
    } catch (error) {
      toast.error("Lỗi tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        fetchProducts();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [page, searchTerm]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Hành động này sẽ xóa vĩnh viễn sản phẩm và không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay!',
      cancelButtonText: 'Hủy bỏ'
    });

    if (result.isConfirmed) {
      try {
        await AdminAPI.deleteProduct(id);
        Swal.fire('Đã xóa!', 'Sản phẩm đã được xóa khỏi hệ thống.', 'success');
        fetchProducts(); 
      } catch (error) {
        Swal.fire('Lỗi!', error.message || 'Không thể xóa sản phẩm.', 'error');
      }
    }
  };

  const getImgUrl = (prod) => {
      if (!prod || !prod.images || prod.images.length === 0) return PLACEHOLDER_IMG;
      const firstImg = prod.images[0];
      if (typeof firstImg === 'string') return firstImg;
      if (typeof firstImg === 'object' && firstImg.url) return firstImg.url;
      return PLACEHOLDER_IMG;
  };

  const formatMoney = (amount) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  return (
    <div className="container-fluid px-4 mt-4 mb-5">
      <AdminTaskbar />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 className="fw-bold text-primary mb-0"><i className="fas fa-box-open me-2"></i>Quản lý Sản phẩm</h2>
            <p className="text-muted mb-0">Tổng số: {meta.total || 0} sản phẩm</p>
        </div>
        <Link to="/admin/products/new" className="btn btn-success shadow-sm">
          <i className="fas fa-plus me-2"></i>Thêm mới
        </Link>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body py-3">
            <div className="row">
                <div className="col-md-4">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                        <input 
                            type="text" 
                            className="form-control border-start-0 ps-0" 
                            placeholder="Tìm kiếm theo tên sản phẩm..." 
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1); 
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light text-secondary">
                <tr>
                  <th className="ps-4 py-3">Sản phẩm</th>
                  <th>Giá gốc</th>
                  <th>Thương hiệu</th>
                  <th>Đánh giá</th>
                  <th className="text-end pe-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr>
                        <td colSpan="6" className="text-center py-5">
                            <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                            Đang tải dữ liệu...
                        </td>
                    </tr>
                ) : products.length > 0 ? (
                    products.map((product) => (
                    <tr key={product._id}>
                        <td className="ps-4 py-3">
                        <div className="d-flex align-items-center">
                            <img 
                                src={getImgUrl(product)} 
                                alt={product.name} 
                                style={{width: 50, height: 50, objectFit: "contain"}} 
                                className="border rounded bg-white me-3"
                                onError={(e) => {e.target.onerror = null; e.target.src=PLACEHOLDER_IMG}}
                            />
                            <div>
                                <div className="fw-bold text-dark text-truncate" style={{maxWidth: "250px"}} title={product.name}>
                                    {product.name}
                                </div>
                                <small className="text-muted">ID: {product._id.slice(-6).toUpperCase()}</small>
                            </div>
                        </div>
                        </td>
                        <td className="fw-bold text-danger">
                            {formatMoney(product.price)}
                        </td>
                        <td>
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10">
                                {product.brand}
                            </span>
                        </td>
                        <td>
                            <div className="d-flex align-items-center">
                                <i className="fas fa-star text-warning me-1"></i>
                                <span className="fw-bold">{product.rating || 0}</span>
                                <span className="text-muted small ms-1">({product.numReviews})</span>
                            </div>
                        </td>
                        
                        <td className="text-end pe-4">
                        <div className="btn-group">
                            <Link 
                                to={`/admin/products/${product._id}`} 
                                className="btn btn-sm btn-outline-primary"
                                title="Chỉnh sửa"
                            >
                                <i className="fas fa-edit"></i>
                            </Link>
                            <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(product._id)}
                                title="Xóa"
                            >
                                <i className="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                            <i className="fas fa-box-open fa-3x mb-3 d-block opacity-25"></i>
                            Không tìm thấy sản phẩm nào.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {!loading && meta.totalPages > 1 && (
            <div className="card-footer bg-white py-3">
                <Pagination 
                    currentPage={meta.page} 
                    totalPages={meta.totalPages} 
                    onPageChange={(p) => setPage(p)} 
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductList;