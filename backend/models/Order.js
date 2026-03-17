const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    // ID của sản phẩm, tham chiếu 'Product'
    product: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product',
        required: true
    },

    // ID của biến thể sản phẩm (để biết chính xác là variant nào)
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    subTotal: { type: Number, required: true }
});

// --- Schema chính cho Đơn hàng ---
const orderSchema = new mongoose.Schema({
    // ID người dùng (nếu đăng nhập), tham chiếu 'User'
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    items: [orderItemSchema], 

    // Thông tin địa chỉ giao hàng
    shippingAddress: {
        addressId: { type: mongoose.Schema.Types.ObjectId, default: null }, // ID địa chỉ nếu user lưu sẵn
        phone: { type: String, default: '' },
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        country: { type: String, default: '' },
    },

    // Phương thức thanh toán
    paymentMethod: {
        type: String,
        enum: ['COD', 'Online'], // Chỉ chấp nhận 1 trong 2 giá trị này
        default: 'COD',
        required: true
    },

    discountAmount: { type: Number, required: true },

    // ID của mã giảm giá đã dùng (nếu có)
    discount: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Discount',
        default: null
    },

    pointsUsed: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },

    // Trạng thái đơn hàng
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
        default: 'pending'
    },

    // Lịch sử các lần thay đổi trạng thái
    statusHistory: [{
        status: String,
        updatedAt: { type: Date, default: Date.now }
    }]

}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;