const mongoose = require('mongoose');

// --- Schema cho một món hàng trong giỏ ---
const cartItemShema = new mongoose.Schema({
    // ID của sản phẩm, tham chiếu đến model 'Product'
    product: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product',
        required: true
    },

    // ID của biến thể sản phẩm (ví dụ: size, màu)
    variantId: {type: mongoose.Schema.Types.ObjectId },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: true }); // Bật _id cho từng item (hữu ích khi xóa/sửa item)

// --- Schema chính cho giỏ hàng ---
const cartSchema = new mongoose.Schema({
    // ID của người dùng, tham chiếu đến model 'User'
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true // Mỗi user chỉ có 1 giỏ hàng
    },

    // Mảng chứa các món hàng (sử dụng schema bên trên)
    items: [cartItemShema],

    // ID của mã giảm giá, tham chiếu đến model 'Discount'
    discount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discount',
        default: null
    }
    
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;