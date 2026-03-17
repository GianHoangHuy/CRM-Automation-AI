const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
        addToCart, 
        getCart, 
        updateCartItem, 
        removeCartItem, 
        applyDiscount,
        removeDiscount,
        checkout,
        getOrderHistory,
        getOrderDetails,
        getOrderStatusHistory
} = require('../controllers/orderController');

// Giỏ hàng
router.post('/cart', protect(false), addToCart);
router.get('/cart', protect(false), getCart);
router.put('/cart/:itemId', protect(false), updateCartItem);
router.delete('/cart/:itemId', protect(false), removeCartItem);

// Áp dụng và hủy áp dụng mã giảm giá
router.post('/cart-discount', protect(false), applyDiscount);
router.delete('/cart-discount', protect(false), removeDiscount);

// Thang toán
router.post('/checkout', protect(false), checkout);

// Lấy đơn hàng
router.get('/history', protect(true), getOrderHistory);
router.get('/:orderId', protect(true), getOrderDetails);
router.get('/:orderId/status-history', protect(true), getOrderStatusHistory);


module.exports = router;