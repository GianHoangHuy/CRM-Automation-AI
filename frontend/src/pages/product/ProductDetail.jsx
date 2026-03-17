import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductAPI, OrderAPI } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import ReviewSection from "../../components/product/ReviewSection";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  const [mainImage, setMainImage] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await ProductAPI.getDetail(id);
        setProduct(data);
        
        if (data.images && data.images.length > 0) {
            const firstImg = data.images[0];
            const url = typeof firstImg === 'object' ? firstImg.url : firstImg;
            setMainImage(url);
        }

        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (error) {
        toast.error("Lỗi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return toast.error("Vui lòng chọn phân loại hàng!");
    try {
      await OrderAPI.addToCart({
        productId: product._id,
        variantId: selectedVariant._id,
        quantity: quantity
      });
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (error) {
      toast.error(error.message || "Lỗi thêm giỏ hàng");
    }
  };

  const getImgUrl = (imgItem) => {
      return typeof imgItem === 'object' ? imgItem.url : imgItem;
  };

  if (loading) return <Loader />;
  if (!product) return <div className="text-center mt-5">Không tìm thấy sản phẩm</div>;

  return (
    <div className="container mt-5 mb-5">
      <div className="row">
        <div className="col-md-6">
          <div className="border rounded p-2 text-center shadow-sm" style={{backgroundColor: '#fff'}}>
              <img
                src={mainImage || "https://via.placeholder.com/500"}
                className="img-fluid"
                alt={product.name}
                style={{maxHeight: '400px', objectFit: 'contain'}}
              />
          </div>
          
          <div className="d-flex mt-3 gap-2 overflow-auto pb-2">
            {product.images?.map((img, idx) => {
              const url = getImgUrl(img);
              return (
                <img 
                    key={idx} 
                    src={url} 
                    alt="" 
                    style={{
                        width: 80, 
                        height: 80, 
                        objectFit: 'cover', 
                        cursor: 'pointer',
                        border: mainImage === url ? '2px solid #0d6efd' : '1px solid #dee2e6'
                    }} 
                    className="rounded"
                    onClick={() => setMainImage(url)}
                />
              );
            })}
          </div>
        </div>

        <div className="col-md-6">
          <h2 className="fw-bold">{product.name}</h2>
          <div className="mb-3 text-warning">
            {product.rating} <i className="fas fa-star"></i> 
            <span className="text-muted ms-2">({product.numReviews} đánh giá)</span>
          </div>
          
          <h3 className="text-danger fw-bold mb-4">
            {selectedVariant 
              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedVariant.price)
              : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
          </h3>

          {product.variants && product.variants.length > 0 && (
            <div className="mb-4">
              <label className="fw-bold mb-2">Chọn loại:</label>
              <div className="d-flex gap-2 flex-wrap">
                {product.variants.map(v => (
                  <button
                    key={v._id}
                    className={`btn ${selectedVariant?._id === v._id ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.attributes && v.attributes.length > 0 
                        ? v.attributes.map(a => a.value).join(" - ") 
                        : v.name}
                  </button>
                ))}
              </div>
              <small className="text-muted mt-2 d-block">
                {selectedVariant ? `Còn lại: ${selectedVariant.stock} sản phẩm` : "Vui lòng chọn phân loại"}
              </small>
            </div>
          )}

          {/* Số lượng */}
          <div className="mb-4 d-flex align-items-center gap-3">
            <label className="fw-bold">Số lượng:</label>
            <input 
              type="number" 
              className="form-control w-25 text-center" 
              value={quantity}
              min="1"
              max={selectedVariant?.stock || 10}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
            />
          </div>

          {/* Thêm vào giỏ hàng */}
          <div className="d-grid gap-2">
            <button 
              className="btn btn-danger btn-lg"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0}
            >
              <i className="fas fa-cart-plus me-2"></i> THÊM VÀO GIỎ HÀNG
            </button>
          </div>
          
          <hr />

          <div className="mt-4">
             <h5 className="fw-bold">Mô tả sản phẩm:</h5>
             <p style={{whiteSpace: 'pre-line', color: '#555'}}>{product.description || "Đang cập nhật..."}</p>
          </div>
        </div>
      </div>
      
      {/* --- BÌNH LUẬN --- */}
      <div className="mb-5">
         <ReviewSection productId={product._id} />
      </div>

    </div>
  );
};

export default ProductDetail;