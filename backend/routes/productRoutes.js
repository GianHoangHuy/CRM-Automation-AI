const express = require('express');
const router = express.Router();
const { getProducts, getProductByIdOrSlug, getHomeProducts } = require('../controllers/productController');
const { getReviews, addReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Danh mục, Chi tiết sản phẩm
router.get('/', getProducts);
router.get('/:idOrSlug', getProductByIdOrSlug);

// Bình luận và đánh giá
router.get('/:idOrSlug/reviews', getReviews);
router.post('/:idOrSlug/reviews', protect(false), addReview);

// Trang chủ
router.get('/home/sections', getHomeProducts);

module.exports = router;