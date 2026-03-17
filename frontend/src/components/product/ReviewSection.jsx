import React, { useEffect, useState, useRef } from "react";
import { ProductAPI } from "../../services/api";
import { toast } from "react-toastify";
import io from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || "http://localhost:5000";

const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  
  const socketRef = useRef();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("userInfo"));
    setUser(storedUser);

    const fetchReviews = async () => {
      try {
        const res = await ProductAPI.getReviews(productId);
        setReviews(res.reviews || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();

    socketRef.current = io(API_URL, {
        transports: ['websocket', 'polling'],
    });

    socketRef.current.emit("join", `product_${productId}`);

    socketRef.current.on("reviewAdded", (newReview) => {
      const reviewProductId = typeof newReview.product === 'object' ? newReview.product._id : newReview.product;

      if (reviewProductId === productId) {
          setReviews((prevReviews) => {
              const exists = prevReviews.find(r => r._id === newReview._id);

              if (exists) {
                  return prevReviews.map(r => r._id === newReview._id ? newReview : r);
              } else {
                  return [newReview, ...prevReviews];
              }
          });
      }
    });

    return () => {
      if (socketRef.current) {
          socketRef.current.disconnect();
      }
    };
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.warn("Vui lòng nhập nội dung bình luận");
    
    if (!user) {
        if (!guestInfo.name || !guestInfo.email) return toast.warn("Vui lòng nhập tên và email");
    }

    setSubmitting(true);
    try {
      const payload = {
        comment,
        rating: user ? rating : null,
        guestName: user ? undefined : guestInfo.name,
        guestEmail: user ? undefined : guestInfo.email
      };

      await ProductAPI.addReview(productId, payload);
      
      toast.success("Đã gửi đánh giá thành công!");
      setComment("");
      if (user) setRating(5);
      
    } catch (error) {
      toast.error(error.message || "Gửi bình luận thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (num) => {
    return [...Array(5)].map((_, i) => (
      <i key={i} className={`fas fa-star ${i < num ? "text-warning" : "text-muted"}`}></i>
    ));
  };

  return (
    <div className="card shadow-sm border-0 mt-4">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0 fw-bold"><i className="fas fa-comments me-2 text-primary"></i>Đánh giá & Bình luận ({reviews.length})</h5>
      </div>
      <div className="card-body">
        
        {/* DANH SÁCH BÌNH LUẬN */}
        <div className="review-list mb-5 pe-2" style={{ maxHeight: "600px", overflowY: "auto" }}>
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
          ) : reviews.length === 0 ? (
            <div className="text-center text-muted py-5 bg-light rounded">
                <i className="far fa-comment-dots fa-3x mb-3 opacity-50"></i>
                <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id} className="d-flex mb-4 border-bottom pb-3 animate__animated animate__fadeIn">
                <div className="me-3 flex-shrink-0">
                    <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm ${rev.user ? 'bg-primary' : 'bg-secondary'}`} 
                         style={{width: 50, height: 50, fontSize: '1.2rem'}}>
                        {rev.user ? rev.user.name.charAt(0).toUpperCase() : (rev.guestName ? rev.guestName.charAt(0).toUpperCase() : "?")}
                    </div>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong className="me-2 text-dark">{rev.user ? rev.user.name : rev.guestName}</strong>
                        {!rev.user && <span className="badge bg-light text-secondary border">Khách</span>}
                        <div className="mt-1">
                            {rev.rating ? renderStars(rev.rating) : <span className="text-muted small fst-italic">(Bình luận/Hỏi đáp)</span>}
                        </div>
                      </div>
                      <small className="text-muted" style={{fontSize: '0.8rem'}}>
                        {new Date(rev.createdAt).toLocaleString('vi-VN')}
                        {rev.createdAt !== rev.updatedAt && <span className="ms-2 fst-italic">(Đã chỉnh sửa)</span>}
                      </small>
                  </div>
                  <div className="mt-2 p-3 bg-light rounded position-relative">
                      <div style={{
                          position: 'absolute', top: '-8px', left: '20px', 
                          width: 0, height: 0, 
                          borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid #f8f9fa'
                      }}></div>
                      <p className="mb-0 text-dark" style={{whiteSpace: 'pre-wrap'}}>{rev.comment}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* BÌNH LUẬN */}
        <div className="bg-white p-4 rounded border shadow-sm">
          <h5 className="fw-bold mb-3 text-primary"><i className="fas fa-pen me-2"></i>Viết đánh giá của bạn</h5>
          <form onSubmit={handleSubmit}>
            
            {user ? (
               <div className="mb-4">
                  <label className="form-label fw-bold me-3">Mức độ hài lòng:</label>
                  <div className="d-inline-block">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <i 
                            key={star}
                            className={`fas fa-star fa-lg mx-1 cursor-pointer ${star <= rating ? "text-warning" : "text-muted opacity-25"}`}
                            style={{cursor: "pointer", transition: "all 0.2s"}}
                            onClick={() => setRating(star)}
                            onMouseEnter={(e) => e.target.classList.add('scale-125')}
                            onMouseLeave={(e) => e.target.classList.remove('scale-125')}
                        ></i>
                    ))}
                    <span className="ms-3 badge bg-warning text-dark">
                        {rating === 5 ? "Tuyệt vời" : rating === 4 ? "Hài lòng" : rating === 3 ? "Bình thường" : rating === 2 ? "Không tốt" : "Tệ"}
                    </span>
                  </div>
               </div>
            ) : (
               <div className="row mb-3">
                   <div className="col-md-6">
                       <div className="form-floating mb-3">
                           <input 
                            type="text" className="form-control" id="guestName" placeholder="Họ tên"
                            value={guestInfo.name} onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})} required
                           />
                           <label htmlFor="guestName">Họ tên của bạn (*)</label>
                       </div>
                   </div>
                   <div className="col-md-6">
                       <div className="form-floating">
                           <input 
                            type="email" className="form-control" id="guestEmail" placeholder="Email"
                            value={guestInfo.email} onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})} required
                           />
                           <label htmlFor="guestEmail">Email liên hệ (*)</label>
                       </div>
                   </div>
               </div>
            )}

            <div className="form-floating mb-3">
                <textarea 
                    className="form-control" 
                    placeholder="Nội dung" 
                    id="commentContent" 
                    style={{height: "100px"}}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                ></textarea>
                <label htmlFor="commentContent">Chia sẻ cảm nhận của bạn về sản phẩm...</label>
            </div>

            <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary px-5 py-2 fw-bold" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang gửi...</> : <><i className="fas fa-paper-plane me-2"></i>Gửi đánh giá</>}
                </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ReviewSection;