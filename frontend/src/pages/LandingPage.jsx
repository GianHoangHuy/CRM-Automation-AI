import React, { useEffect, useState } from "react";
import { ProductAPI } from "../services/api";
import ProductCard from "../components/product/ProductCard";
import { Link } from "react-router-dom";
import Loader from "../components/common/Loader";

const LandingPage = () => {
  const [data, setData] = useState({
    newest: [],
    bestSellers: [],
    categories: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await ProductAPI.getHomeSections();
        setData(res);
      } catch (error) {
        console.error("Lỗi tải trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="container my-4">
      <div className="p-5 mb-5 bg-light rounded-3 shadow-sm text-center border">
        <h1 className="display-5 fw-bold text-primary">Máy Tính & Linh Kiện</h1>
        <p className="col-md-8 fs-4 mx-auto text-muted">
          Cấu hình mạnh mẽ - Giá cả hợp lý - Bảo hành chính hãng
        </p>
        <Link to="/catalog" className="btn btn-primary btn-lg px-4 mt-3 shadow-sm">
          Mua ngay
        </Link>
      </div>

      {/* Sản phẩm mới */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h3 className="fw-bold text-primary border-start border-4 border-primary ps-3 mb-0">
            Sản phẩm mới
          </h3>
          <Link to="/catalog?sort=createdAt_desc" className="btn btn-sm btn-outline-secondary">
            Xem tất cả
          </Link>
        </div>
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 row-cols-lg-5 g-3">
          {data.newest && data.newest.length > 0 ? (
            data.newest.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <p className="text-muted ms-3">Chưa có sản phẩm mới.</p>
          )}
        </div>
      </section>

      {/* Bán chạy nhất */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h3 className="fw-bold text-danger border-start border-4 border-danger ps-3 mb-0">
            Bán chạy nhất
          </h3>
        </div>
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 row-cols-lg-5 g-3">
          {data.bestSellers && data.bestSellers.length > 0 ? (
            data.bestSellers.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <p className="text-muted ms-3">Chưa có dữ liệu bán chạy.</p>
          )}
        </div>
      </section>

      {/* Các danh mục nổi bật */}
      {data.categories && Object.keys(data.categories).map((key) => {
        const catData = data.categories[key];
        if (!catData || !catData.products || catData.products.length === 0) return null;
        return (
          <section className="mb-5" key={key}>
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h3 className="fw-bold text-dark border-start border-4 border-dark ps-3 mb-0">
                {catData.category?.name || key}
              </h3>
              <Link
                to={`/catalog?category=${catData.category?.slug}`}
                className="btn btn-sm btn-outline-secondary"
              >
                Xem thêm
              </Link>
            </div>
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 row-cols-lg-5 g-3">
              {catData.products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default LandingPage;