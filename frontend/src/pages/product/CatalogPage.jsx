import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductAPI } from "../../services/api";
import ProductCard from "../../components/product/ProductCard";

const CatalogPage = () => {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [filter, setFilter] = useState({
    search: searchParams.get("search") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "createdAt_desc",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = Object.fromEntries([...searchParams]);
        const res = await ProductAPI.getAll(params);
        setProducts(res.data);
        setMeta(res.meta);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setSearchParams(filter);
  };

  const handlePageChange = (newPage) => {
    const newParams = Object.fromEntries([...searchParams]);
    setSearchParams({ ...newParams, page: newPage });
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-3 mb-4">
          <div className="card p-3 shadow-sm">
            <h5 className="mb-3">Bộ lọc tìm kiếm</h5>
            <form onSubmit={handleApplyFilter}>
              <div className="mb-3">
                <label className="form-label">Từ khóa</label>
                <input
                  type="text"
                  className="form-control"
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Khoảng giá</label>
                <div className="d-flex gap-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Min"
                    value={filter.minPrice}
                    onChange={(e) => setFilter({ ...filter, minPrice: e.target.value })}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Max"
                    value={filter.maxPrice}
                    onChange={(e) => setFilter({ ...filter, maxPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Sắp xếp</label>
                <select
                  className="form-select"
                  value={filter.sort}
                  onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
                >
                  <option value="createdAt_desc">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="name_asc">Tên A-Z</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-100">
                Áp dụng
              </button>
            </form>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="col-md-9">
          {loading ? (
            <div className="text-center py-5">Loading...</div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className="alert alert-warning">Không tìm thấy sản phẩm nào.</div>
              ) : (
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              )}

              {meta.totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${!meta.hasPrev ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(meta.page - 1)}
                      >
                        Trước
                      </button>
                    </li>
                    {[...Array(meta.totalPages).keys()].map((num) => (
                      <li
                        key={num + 1}
                        className={`page-item ${meta.page === num + 1 ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(num + 1)}
                        >
                          {num + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${!meta.hasNextPage ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(meta.page + 1)}
                      >
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;