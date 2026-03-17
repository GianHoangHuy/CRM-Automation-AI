import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import AdminTaskbar from "./AdminTaskbar";

const AdminCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal Thêm/Sửa
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: ""
  });

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      const data = await AdminAPI.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error("Lỗi tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === "name" && !isEditing) {
        const slug = value.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D")
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "");
        setFormData(prev => ({ ...prev, slug }));
    }
  };

  // Thêm danh mục
  const handleAddNew = () => {
    setIsEditing(false);
    setFormData({ name: "", slug: "", description: "" });
    setShowModal(true);
  };

  // Chỉnh sửa danh mục
  const handleEdit = (cat) => {
    setIsEditing(true);
    setSelectedId(cat._id);
    setFormData({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || ""
    });
    setShowModal(true);
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) return toast.warning("Vui lòng nhập Tên và Slug");

    try {
      if (isEditing) {
        await AdminAPI.updateCategory(selectedId, formData);
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await AdminAPI.createCategory(formData);
        toast.success("Tạo danh mục mới thành công!");
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.message || "Lỗi lưu danh mục");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container-fluid px-4 mt-4 mb-5">
      <AdminTaskbar />

      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm border-start border-5 border-success">
        <div>
           <h4 className="fw-bold text-success mb-0">
             <i className="fas fa-list-alt me-2"></i>QUẢN LÝ DANH MỤC
           </h4>
           <small className="text-muted">Phân loại sản phẩm (Laptop, PC, Phụ kiện...)</small>
        </div>
        <button 
          className="btn btn-success fw-bold shadow-sm"
          onClick={handleAddNew}
        >
          <i className="fas fa-plus me-2"></i>Thêm danh mục
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light text-secondary text-uppercase small fw-bold">
                <tr>
                  <th className="ps-4 py-3">Tên danh mục</th>
                  <th>Slug (Đường dẫn)</th>
                  <th>Mô tả</th>
                  <th className="text-end pe-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat._id}>
                    <td className="ps-4 fw-bold text-primary">{cat.name}</td>
                    <td><code className="bg-light px-2 py-1 rounded text-dark">{cat.slug}</code></td>
                    <td className="text-muted small text-truncate" style={{maxWidth: "300px"}}>
                        {cat.description || "Không có mô tả"}
                    </td>
                    <td className="text-end pe-4">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(cat)}
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-4 text-muted">Chưa có danh mục nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal d-block" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                    {isEditing ? <><i className="fas fa-edit me-2"></i>Sửa Danh Mục</> : <><i className="fas fa-plus-circle me-2"></i>Thêm Danh Mục</>}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Tên danh mục</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ví dụ: Laptop Gaming"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Slug (URL thân thiện)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="laptop-gaming"
                      required
                    />
                    <div className="form-text small">Tự động tạo từ tên, hoặc bạn có thể sửa thủ công.</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Mô tả</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                    <button type="submit" className="btn btn-success fw-bold">
                        {isEditing ? "Cập nhật" : "Tạo mới"}
                    </button>
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

export default AdminCategoryList;