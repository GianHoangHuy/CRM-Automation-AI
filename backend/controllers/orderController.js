const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const Order = require('../models/Order');
const User = require('../models//User');
const sendEmail = require('../utils/sendEmail');
const generatePassword = require('../utils/generatePassword');
const mongoose = require('mongoose');

// Các hàm và hằng số bổ trợ
const SHIPPING_FEE = 30000;

const populateCart = async(cart) => {
    return await Cart.findById(cart._id)
        .populate('items.product', 'name price images variants')
        .populate('discount');
}

const buildOrderItemsFromCart = (cart) => {
    let subtotal = 0;

    // Lọc bỏ các item mà product bị null (do sản phẩm đã bị xóa khỏi DB)
    const validItems = cart.items.filter(item => item.product);

    const items = validItems.map(item => {
        const product = item.product || {};
        let price = Number(product.price || 0);

        // Tìm giá theo biến thể
        if (item.variantId && Array.isArray(product.variants)) {
            const variant = product.variants.find(v => String(v._id) === String(item.variantId));
            if (variant && typeof variant.price !== 'undefined') {
                price = Number(variant.price);
            }
        }

        const quantity = Number(item.quantity || 0);
        const subTotal = price * quantity;
        subtotal += subTotal;

        return {
            _id: item._id,
            product: product,
            variantId: item.variantId,
            name: product.name || '',
            quantity,
            price,
            subTotal
        };
    });
    return { items, subtotal };
}

const computeSummary = (cart) => {
    const { items, subtotal } = buildOrderItemsFromCart(cart);
    const discount = cart.discount || null;
    const discountAmount = discount ? (subtotal * (discount.value || 0)) / 100 : 0;
    const total = subtotal - discountAmount + SHIPPING_FEE;

    return {
        items,
        subtotal,
        shipping: SHIPPING_FEE,
        discount,
        discountAmount,
        total
    };
};

// --- CONTROLLERS ---

// Thêm vào giỏ hàng
const addToCart = async(req, res) => {
    try {
        const { productId, variantId, quantity = 1 } = req.body;
        const numQuantity = Number(quantity);

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ message: 'productId không hợp lệ' });

        const userId = req.user ? req.user._id : null;
        let cart = await Cart.findOne({ user: userId });
        if (!cart) cart = await Cart.create({ user: userId, items: [] });

        const product = await Product.findOne({ _id: productId, 'variants._id': variantId }, { 'variants.$': 1 });

        if (!product || !product.variants || product.variants.length === 0) return res.status(404).json({ message: 'Sản phẩm hoặc biến thể không tồn tại' });
        const variant = product.variants[0];

        const itemIndex = cart.items.findIndex(i =>
            i.product.toString() === productId &&
            i.variantId &&
            i.variantId.toString() === variantId
        );

        let newQuantity = numQuantity;
        if (itemIndex > -1) newQuantity = cart.items[itemIndex].quantity + numQuantity;

        if (variant.stock < newQuantity) {
            return res.status(400).json({ message: `Không đủ hàng. Chỉ còn ${variant.stock} sản phẩm.` });
        }

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = newQuantity;
        } else {
            cart.items.push({ product: productId, variantId: variantId, quantity: newQuantity });
        }

        await cart.save();
        cart = await populateCart(cart);
        const summary = computeSummary(cart);
        return res.json(summary);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi thêm vào giỏ hàng', error: err.message });
    }
};

// Xem giỏ hàng
const getCart = async(req, res) => {
    try {
        const userId = req.user ? req.user._id : null;
        let cart = await Cart.findOne({ user: userId })
            .populate('items.product', 'name price images variants')
            .populate('discount');

        if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
            return res.json({
                items: [],
                subtotal: 0,
                discount: null,
                discountAmount: 0,
                total: 0
            });
        }

        const summary = computeSummary(cart);
        return res.json(summary);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi xem giỏ hàng' })
    }
};

// Cập nhật số lượng
const updateCartItem = async(req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user ? req.user._id : null;
        let cart = await Cart.findOne({ user: userId });
        if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống' });

        const item = cart.items.id(itemId);
        if (!item) return res.status(404).json({ message: 'Sản phẩm không có trong giỏ' });

        item.quantity = quantity;
        await cart.save();

        cart = await populateCart(cart);
        const summary = computeSummary(cart);
        return res.json(summary);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi cập nhật giỏ hàng' });
    }
};

// Xóa sản phẩm
const removeCartItem = async(req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user ? req.user._id : null;
        let cart = await Cart.findOne({ user: userId });
        if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống' });

        // Lọc bỏ item cần xóa
        cart.items = cart.items.filter(i => i._id.toString() !== itemId);

        await cart.save();
        cart = await populateCart(cart);

        const summary = computeSummary(cart);
        return res.json(summary);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm' });
    }
};

// Áp dụng mã giảm giá
const applyDiscount = async(req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user ? req.user._id : null;
        if (!code) return res.status(400).json({ mesaage: 'Vui lòng cung cấp mã giảm giá' });
        const discount = await Discount.findOne({ code });
        if (!discount) return res.status(404).json({ message: 'Mã giảm giá không hợp lệ' });
        if (discount.usedCount >= discount.usageLimit) return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
        let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images variants');
        if (!cart) return res.status(404).json({ message: 'Giỏ hàng trống' });
        cart.discount = discount._id;
        await cart.save();
        cart = await populateCart(cart);
        const summary = computeSummary(cart);
        return res.json(summary);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi áp dụng mã giảm giá' });
    }
};

// Hủy áp dụng mã giảm giá
const removeDiscount = async(req, res) => {
    try {
        const userId = req.user ? req.user._id : null;
        let cart = await Cart.findOne({ user: userId })
            .populate('items.product', 'name price images variants')
            .populate('discount');

        if (!cart) return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
        cart.discount = null;
        await cart.save();
        cart = await populateCart(cart);
        const summary = computeSummary(cart);
        return res.json(summary);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi hủy mã giảm giá' });
    }
}

// Thanh toán cho user + guest
const checkout = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : null;

        const { 
            name, 
            email, 
            shippingAddressId, 
            shippingAddress: shippingAddressBody, 
            paymentMethod,
            selectedItems,
            usedPoints
        } = req.body;

        if (!Array.isArray(selectedItems) || selectedItems.length === 0) return res.status(400).json({ message: 'Vui lòng chọn những sản phẩm bạn muốn thanh toán' });
        const cart = await Cart.findOne({ user: userId })
                                .populate('items.product', 'name price variants') 
                                .populate('discount');

        if (!cart || !cart.items || cart.items.length === 0) return res.status(400).json({ message: 'Giỏ hàng trống' });
        const selectedIds = selectedItems.map(id => String(id));
        const selectedCartItems = cart.items.filter(i => selectedIds.includes(String(i._id)));
        if (!selectedCartItems.length) return res.status(400).json({ message: 'Không tìm thấy item được chọn trong giỏ hàng' });
        const { items: orderItems, subtotal } = buildOrderItemsFromCart({ items: selectedCartItems });
        let total = subtotal + SHIPPING_FEE;
        let discountAmount = 0;
        let appliedDiscount = null;
        const requestedPoints = Math.max(0, Math.floor(Number(usedPoints) || 0));
        let user = null;
        let createdUser = null;
        if (requestedPoints > 0 && !userId) return res.status(400).json({ message: 'Chỉ người dùng đã đăng nhập mới có thể sử dụng điểm' });

        if (userId) {
            user = await User.findById(userId);
            if (!user) return res.status(400).json({ message: 'Người dùng không tồn tại' });
            if (requestedPoints > user.loyaltyPoints) return res.status(400).json({ message: 'Không đủ điểm để sử dụng' });
        }

        // Cập nhật tồn kho
        const stockUpdates = [];
        const revertStockUpdates = async (updates) => {
            for (const u of updates) {
                try {
                    if (u.variantId) {
                        await Product.updateOne(
                            { _id: u.productId, 'variants._id': u.variantId },
                            { $inc: { 'variants.$.stock': u.qty } } 
                        )} 
                } catch (e) {
                    console.error('[revertStockUpdates] error', e && e.message);
                }
            }
        };

        for (const item of selectedCartItems) {
            const q = Number(item.quantity || 0);
            const pid = item.product._id;

            if (!item.variantId) {
                await revertStockUpdates(stockUpdates);
                return res.status(400).json({ message: `Sản phẩm ${item.product.name} trong giỏ hàng bị lỗi, thiếu variantId.` });
            }
            
            const vid = item.variantId;
            const result = await Product.updateOne(
                { _id: pid, 'variants._id': vid, 'variants.stock': { $gte: q } },
                { $inc: { 'variants.$.stock': -q } }
            );
            const ok = result && (result.modifiedCount === 1);
            
            if (!ok) {
                await revertStockUpdates(stockUpdates);
                const variant = item.product.variants.find(v => v._id.toString() === vid.toString());
                const variantName = variant ? variant.name : 'không xác định';
                return res.status(400).json({ message: `Hết hàng: ${item.product.name} (${variantName}).` });
            }
            stockUpdates.push({ productId: pid, variantId: vid, qty: q });
        }       

        if (cart.discount) {
            appliedDiscount = cart.discount;
            discountAmount = (subtotal * (appliedDiscount.value || 0)) / 100; 

            const updated = await Discount.findOneAndUpdate(
                { _id: cart.discount._id, usedCount: { $lt: appliedDiscount.usageLimit } },
                { $inc: { usedCount: 1 } },
                { new: true }
            );

            if (!updated) {
                await revertStockUpdates(stockUpdates);
                return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
            }
        
            appliedDiscount = updated;
            total = subtotal - discountAmount + SHIPPING_FEE;
        }

        let pointsConsumed = 0;
        if (requestedPoints > 0 && user) {
            const pointsNeededToZero = Math.ceil(total / 1000);
            pointsConsumed = Math.min(requestedPoints, pointsNeededToZero, user.loyaltyPoints);
            const deductVND = pointsConsumed * 1000;
            total = Math.max(0, total - deductVND);
        }

        let shippingAddress = {
            addressId: null,
            phone: '',
            street: '',
            city: '',
            country: '',
        };

        if (shippingAddressId) {
            if (!userId) {
                if (appliedDiscount) await Discount.findByIdAndUpdate(appliedDiscount._id, { $inc: { usedCount: -1 } }).catch(()=>{});
                await revertStockUpdates(stockUpdates);
                return res.status(400).json({ message: 'Chỉ người dùng đã đăng nhập mới có thể dùng shippingAddressId' });
            }

            const userLookup = user || await User.findById(userId); 
            if (!userLookup) {
                if (appliedDiscount) await Discount.findByIdAndUpdate(appliedDiscount._id, { $inc: { usedCount: -1 } }).catch(()=>{});
                await revertStockUpdates(stockUpdates);
                return res.status(400).json({ message: 'Người dùng không tồn tại' });
            }

            const addr = userLookup.addresses.id(shippingAddressId);
            if (!addr) {
                if (appliedDiscount) await Discount.findByIdAndUpdate(appliedDiscount._id, { $inc: { usedCount: -1 } }).catch(()=>{});
                await revertStockUpdates(stockUpdates);
                return res.status(400).json({ message: 'Địa chỉ không tồn tại trong hồ sơ người dùng' });
            }

            shippingAddress.addressId = addr._id;
            shippingAddress.phone = addr.phone || '';
            shippingAddress.street = addr.street || '';
            shippingAddress.city = addr.city || '';
            shippingAddress.country = addr.country || '';
        } else if (shippingAddressBody) {
            shippingAddress = Object.assign(shippingAddress, shippingAddressBody);
        } else {
            if (appliedDiscount) await Discount.findByIdAndUpdate(appliedDiscount._id, { $inc: { usedCount: -1 } }).catch(()=>{});
            await revertStockUpdates(stockUpdates);
            return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ giao hàng hoặc shippingAddressId' });
        }

        if (userId && !user) {
            user = await User.findById(userId);
        } else if (!userId && email) {
            const found = await User.findOne({ email: email });
            if (found) {
                user = found;
            } else {
                const defaultPassword = generatePassword(12);

                const newUser = new User({
                    name: name || 'Khách hàng',
                    email: email,
                    password: defaultPassword,
                    addresses: [{
                        phone: shippingAddress.phone || '',
                        street: shippingAddress.street || '',
                        city: shippingAddress.city || '',
                        country: shippingAddress.country || '',
                        isDefault: true
                    }]
                });
                createdUser = await newUser.save(); 
                user = createdUser;
            }
        }

        const pointsUsed = pointsConsumed;
        const pointsEarned = Math.floor((total * 0.1) / 1000);
        let order;

        try {
            order = await Order.create({
                user: user ? user._id : null,
                name: user ? user.name : name,
                email: user ? user.email : email,
                items: orderItems,
                shippingAddress,
                paymentMethod,
                discount: appliedDiscount ? appliedDiscount._id : null,
                discountAmount,
                pointsUsed,
                pointsEarned,
                totalPrice: total,
                status: 'pending',
                statusHistory: [{ status: 'pending', updatedAt: new Date() }]
            });
        } catch (createErr) {
            if (appliedDiscount) await Discount.findByIdAndUpdate(appliedDiscount._id, { $inc: { usedCount: -1 } }).catch(()=>{});
            await revertStockUpdates(stockUpdates);
            console.error('[checkout] create order failed', createErr && createErr.message);
            return res.status(500).json({ message: 'Tạo đơn hàng thất bại' });
        }

        if (user) {
            const prev = user.loyaltyPoints || 0;
            const newPoints = prev - pointsConsumed + pointsEarned;
            user.loyaltyPoints = Math.max(0, newPoints);
            await user.save();
        }

        cart.items = cart.items.filter(i => !selectedIds.includes(String(i._id)));
        if (!cart.items.length) cart.discount = null;
        await cart.save();

        // Gửi email xác nhận
        const buildOrderHtml = (ord) => {
            const formatVND = (num) => Number(num).toLocaleString('vi-VN') + 'đ';
            const formatPoints = (points) => Number(points).toLocaleString('vi-VN') + ' điểm';

            const lines = ord.items.map(i => `
                <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${i.name}</td>
                <td style="padding: 8px; text-align:center;">${i.quantity}</td>
                <td style="padding: 8px; text-align:right;">${formatVND(i.price)}</td>
                <td style="padding: 8px; text-align:right;">${formatVND(i.subTotal)}</td>
                </tr>
            `).join('');

            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0d6efd; color: #fff; padding: 16px; text-align: center;">
                    <h2 style="margin: 0;">E-Commerce Store</h2>
                    <p style="margin: 4px 0;">Xác nhận đơn hàng #${ord._id}</p>
                </div>

                <div style="padding: 16px;">
                    <p>Xin chào <strong>${ord.name}</strong>,</p>
                    <p>Cảm ơn bạn đã đặt hàng! Dưới đây là chi tiết đơn hàng của bạn:</p>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 8px; text-align:left;">Sản phẩm</th>
                            <th style="padding: 8px;">SL</th>
                            <th style="padding: 8px; text-align:right;">Đơn giá</th>
                            <th style="padding: 8px; text-align:right;">Thành tiền</th>
                        </tr>
                        </thead>
                        <tbody>
                        ${lines}
                        </tbody>
                    </table>

                    <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;">
                
                    <p style="text-align: right;">Tạm tính: <strong>${formatVND(ord.items.reduce((s,i)=>s+i.subTotal,0))}</strong></p>
                        
                    ${ord.discountAmount > 0 ? `
                    <p style="text-align: right;">Giảm giá: <strong style="color: #dc3545;">-${formatVND(ord.discountAmount)}</strong></p>
                    ` : ''}
                        
                    ${ord.pointsUsed > 0 ? `
                    <p style="text-align: right;">Sử dụng điểm thưởng: <strong style="color: #dc3545;">-${formatPoints(ord.pointsUsed)}</strong></p>
                    <p style="text-align: right;">Quy đổi thành tiền: <strong style="color: #dc3545;">-${formatVND(ord.pointsUsed * 1000)}</strong></p>
                    ` : ''}
                        
                    <p style="text-align: right;">Phí vận chuyển: <strong>${formatVND(SHIPPING_FEE)}</strong></p>
                    <h3 style="text-align: right; color: #198754;">Tổng cộng: ${formatVND(ord.totalPrice)}</h3>
                    <p style="text-align: right;">Điểm nhận được từ đơn hàng: <strong>${formatPoints(ord.pointsEarned)}</strong></p>

                    <div style="margin-top: 20px;">
                        <h4>Địa chỉ giao hàng:</h4>
                        <p>${ord.shippingAddress.street}, ${ord.shippingAddress.city}, ${ord.shippingAddress.country}</p>
                    </div>

                    <p style="margin-top: 20px;">Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao cho đơn vị vận chuyển.</p>
                    <p>Trân trọng,<br><strong>Đội ngũ E-Commerce Store</strong></p>
                </div>

                <div style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #666;">
                    <p>© ${new Date().getFullYear()} E-Commerce Store. Mọi quyền được bảo lưu.</p>
                </div>
            </div>
            `;
            };

        // gửi email xác nhận cho user/guest
        try {
            const html = buildOrderHtml(order);
            // ưu tiên call dạng object, fallback sang (to, subject, html)
            if (typeof sendEmail === 'function') {
                try {
                    await sendEmail({ to: order.email, subject: 'Xác nhận đơn hàng', html });
                } catch (e1) {
                    try {
                        await sendEmail(order.email, 'Xác nhận đơn hàng', html);
                    } catch (e2) {
                        console.error('[checkout] sendEmail both attempts failed', e1, e2);
                    }
                }
            }
        } catch (emailErr) {
            console.error('[checkout] email error', emailErr);
        }

        // Nếu là guest vừa tạo tài khoản thì gửi thêm email chứa thông tin đăng nhập
        if (createdUser) {
            const credHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h3>Tài khoản của bạn đã được tạo!</h3>
                <p>Chào ${createdUser.name},</p>
                <p>Bạn đã đặt hàng với tư cách khách. Chúng tôi đã tạo tài khoản cho bạn để theo dõi đơn hàng:</p>
                <ul>
                    <li><strong>Email:</strong> ${createdUser.email}</li>
                    <li><strong>Mật khẩu tạm thời:</strong> defaultPassword</li>
                </ul>
                <p>Vui lòng đăng nhập và đổi mật khẩu sau khi đăng nhập lần đầu.</p>
                <p>Trân trọng,<br><strong>Đội ngũ E-Commerce Store</strong></p>
                </div>
            `;
            try {
                if (typeof sendEmail === 'function') {
                    try {
                        await sendEmail({ to: createdUser.email, subject: 'Thông tin tài khoản mới', html: credHtml });
                    } catch (e1) {
                        try {
                            await sendEmail(createdUser.email, 'Thông tin tài khoản mới', credHtml);
                        } catch (e2) {
                            console.error('[checkout] sendAccountEmail failed', e1, e2);
                        }
                    }
                }
            } catch (e) {
                console.error('[checkout] send account email error', e);
            }
        }
        res.status(201).json({ message: 'Đặt hàng thành công', order });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi thanh toán đơn hàng', error: err.message });
    }
};

// Lịch sử đơn hàng
const getOrderHistory = async(req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order.find({ user: userId })
            .populate('items.product', 'name images')
            .sort({ createdAt: -1 })
            .lean();
        return res.json(orders);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi lấy lịch sử đơn hàng' });
    }
};

// Xem chi tiết đơn hàng
const getOrderDetails = async(req, res) => {
    try {
        const userId = req.user._id;
        const { orderId } = req.params;
        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('items.product', 'name images price')
            .lean();
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        return res.json(order);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi lấy chi tiết đơn hàng' });
    }
};

// Xem lịch sử trạng thái đơn hàng
const getOrderStatusHistory = async(req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).lean();
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        const history = (order.statusHistory || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return res.json({
            orderId: order._id,
            currentStatus: order.status,
            history
        });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi xem trạng thái đơn hàng' });
    }
};

module.exports = {
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
};