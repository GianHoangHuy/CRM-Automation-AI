import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { AdminAPI, ProductAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";

const ProductEdit = () => {
  const { id } = useParams(); // Nếu có ID -> Mode Edit, không có -> Mode Create
  const navigate = useNavigate();
  const location = useLocation(); // Hook để biết đang ở trang nào (cho Taskbar)
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [categories, setCategories] = useState([]); // Danh sách danh mục để chọn
  
  // State lưu trữ dữ liệu form
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    brand: "",
    category: "",
    price: 0,
    description: "",
    images: [], 
    imageUrlInput: "", 
    variants: [] 
  });

  // State cho form thêm biến thể mới
  const [newVariant, setNewVariant] = useState({
    sku: "",
    name: "",
    price: 0,
    stock: 0,
    attributes: [] 
  });
  const [showVariantForm, setShowVariantForm] = useState(false);

  // --- PHẦN TASKBAR ADMIN (Định nghĩa ngay trong component) ---
  const AdminTaskbar = () => (
    <div className="bg-white shadow-sm mb-4 p-3 rounded d-flex flex-wrap gap-2 align-items-center">
      <span className="fw-bold text-primary me-3"><i className="fas fa-user-shield me-2"></i>QUẢN TRỊ:</span>
      
      <Link to="/admin" className={`btn btn-sm ${location.pathname === "/admin" ? "btn-primary" : "btn-outline-primary"}`}>
        <i className="fas fa-tachometer-alt me-1"></i> Dashboard
      </Link>

      <Link to="/admin/products" className={`btn btn-sm ${location.pathname.includes("/products") ? "btn-success" : "btn-outline-success"}`}>
        <i className="fas fa-box-open me-1"></i> Sản phẩm
      </Link>

      <Link to="/admin/users" className={`btn btn-sm ${location.pathname.includes("/users") ? "btn-info text-white" : "btn-outline-info"}`}>
        <i className="fas fa-users me-1"></i> Người dùng
      </Link>

      <Link to="/admin/orders" className={`btn btn-sm ${location.pathname.includes("/orders") ? "btn-warning text-dark" : "btn-outline-warning text-dark"}`}>
        <i className="fas fa-clipboard-list me-1"></i> Đơn hàng
      </Link>

      <Link to="/admin/discounts" className={`btn btn-sm ${location.pathname.includes("/discounts") ? "btn-danger" : "btn-outline-danger"}`}>
        <i className="fas fa-tags me-1"></i> Mã giảm giá
      </Link>
    </div>
  );
  // -----------------------------------------------------------

  useEffect(() => {
    const initData = async () => {
      try {
        const cats = await AdminAPI.getCategories(); 
        setCategories(cats);

        if (isEditMode) {
          const product = await ProductAPI.getDetail(id);
          setFormData({
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            category: product.category?._id || product.category, 
            price: product.price,
            description: product.description,
            images: product.images.map(img => typeof img === 'string' ? img : img.url),
            imageUrlInput: "",
            variants: product.variants || []
          });
        }
      } catch (error) {
        console.error("Init Data Error:", error);
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, isEditMode]);

  // Xử lý nhập liệu
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddImage = () => {
    if (!formData.imageUrlInput) return;
    setFormData({
      ...formData,
      images: [...formData.images, formData.imageUrlInput],
      imageUrlInput: ""
    });
  };

  const handleRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleVariantChange = (e) => {
    setNewVariant({ ...newVariant, [e.target.name]: e.target.value });
  };

  const handleAddVariant = () => {
    if (!newVariant.sku || !newVariant.name || newVariant.price < 0 || newVariant.stock < 0) {
        return toast.warning("Vui lòng nhập đầy đủ thông tin biến thể");
    }
    const variantToAdd = {
        ...newVariant,
        attributes: [{ key: "Tên", value: newVariant.name }] 
    };
    setFormData({
        ...formData,
        variants: [...formData.variants, variantToAdd]
    });
    setNewVariant({ sku: "", name: "", price: 0, stock: 0, attributes: [] });
    setShowVariantForm(false);
  };

  const handleRemoveVariant = (index) => {
      if(!window.confirm("Xóa biến thể này?")) return;
      const newVariants = formData.variants.filter((_, i) => i !== index);
      setFormData({ ...formData, variants: newVariants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      delete payload.imageUrlInput; 

      if (isEditMode) {
        await AdminAPI.updateProduct(id, payload);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        await AdminAPI.addProduct(payload);
        toast.success("Tạo sản phẩm mới thành công");
      }
      navigate("/admin/products");
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error(error.message || "Lỗi lưu sản phẩm");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mt-4 mb-5">
      
      {/* HIỂN THỊ TASKBAR */}
      <AdminTaskbar />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">
          <i className={`fas ${isEditMode ? 'fa-edit' : 'fa-plus-circle'} me-2`}></i>
          {isEditMode ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        </h2>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/admin/products")}>
          <i className="fas fa-arrow-left me-2"></i>Quay lại
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            {/* ... (Phần form giữ nguyên như cũ) ... */}
            <div className="row">
              <div className="col-md-8">
                <h5 className="mb-3 border-bottom pb-2 text-muted">Thông tin chung</h5>
                <div className="mb-3">
                  <label className="form-label fw-bold">Tên sản phẩm <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Slug (URL) <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="slug" value={formData.slug} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Thương hiệu <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="brand" value={formData.brand} onChange={handleChange} required />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Danh mục <span className="text-danger">*</span></label>
                    <select className="form-select" name="category" value={formData.category} onChange={handleChange} required>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Giá gốc (VNĐ) <span className="text-danger">*</span></label>
                    <input type="number" className="form-control" name="price" value={formData.price} onChange={handleChange} min="0" required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Mô tả chi tiết</label>
                  <textarea className="form-control" rows="6" name="description" value={formData.description} onChange={handleChange}></textarea>
                </div>

                {/* QUẢN LÝ BIẾN THỂ */}
                <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <h5 className="mb-0 text-muted">Biến thể sản phẩm (Variants)</h5>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setShowVariantForm(!showVariantForm)}>
                            <i className="fas fa-plus me-1"></i>Thêm biến thể
                        </button>
                    </div>
                    {showVariantForm && (
                        <div className="card bg-light mb-3 p-3">
                            <div className="row g-2">
                                <div className="col-md-3"><input type="text" className="form-control form-control-sm" placeholder="SKU" name="sku" value={newVariant.sku} onChange={handleVariantChange} /></div>
                                <div className="col-md-3"><input type="text" className="form-control form-control-sm" placeholder="Tên" name="name" value={newVariant.name} onChange={handleVariantChange} /></div>
                                <div className="col-md-3"><input type="number" className="form-control form-control-sm" placeholder="Giá" name="price" value={newVariant.price} onChange={handleVariantChange} /></div>
                                <div className="col-md-2"><input type="number" className="form-control form-control-sm" placeholder="Kho" name="stock" value={newVariant.stock} onChange={handleVariantChange} /></div>
                                <div className="col-md-1"><button type="button" className="btn btn-sm btn-success w-100" onClick={handleAddVariant}><i className="fas fa-check"></i></button></div>
                            </div>
                        </div>
                    )}
                    <div className="table-responsive">
                        <table className="table table-bordered table-sm">
                            <thead className="table-light"><tr><th>SKU</th><th>Tên</th><th>Giá</th><th>Kho</th><th></th></tr></thead>
                            <tbody>
                                {formData.variants.map((v, idx) => (
                                    <tr key={idx}>
                                        <td>{v.sku}</td><td>{v.name}</td><td>{v.price}</td><td>{v.stock}</td>
                                        <td className="text-center"><button type="button" className="btn btn-xs text-danger" onClick={() => handleRemoveVariant(idx)}><i className="fas fa-trash"></i></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              </div>

              <div className="col-md-4">
                <h5 className="mb-3 border-bottom pb-2 text-muted">Hình ảnh</h5>
                <div className="mb-3">
                    <div className="input-group input-group-sm">
                        <input type="text" className="form-control" placeholder="Link ảnh..." name="imageUrlInput" value={formData.imageUrlInput} onChange={handleChange} />
                        <button type="button" className="btn btn-primary" onClick={handleAddImage}><i className="fas fa-plus"></i></button>
                    </div>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-3 p-2 border rounded bg-light" style={{minHeight: '100px'}}>
                    {formData.images.map((url, idx) => (
                    <div key={idx} className="position-relative" style={{width: "90px", height: "90px"}}>
                        <img src={url} alt="" className="w-100 h-100 object-fit-cover rounded border bg-white" onError={(e) => {e.target.src="https://via.placeholder.com/90"}} />
                        <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 rounded-circle" style={{width: "20px", height: "20px", transform: "translate(30%, -30%)"}} onClick={() => handleRemoveImage(idx)}>&times;</button>
                    </div>
                    ))}
                </div>
              </div>
            </div>
            <hr className="my-4" />
            <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-secondary px-4" onClick={() => navigate("/admin/products")}>Hủy bỏ</button>
                <button type="submit" className="btn btn-success px-5 fw-bold shadow-sm">{isEditMode ? "Lưu thay đổi" : "Tạo sản phẩm"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductEdit;