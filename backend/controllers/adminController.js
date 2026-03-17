const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Discount = require('../models/Discount');
const Category = require('../models/Category');

// Quản lý người dùng
// Lấy tất cả người dùng
const getAllUsers = async(req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi xem danh sách người dùng', error: err.message });
    }
};

// Xem thông tin người dùng
const getUser = async(req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        user ? res.json(user) : res.status(404).json({ message: 'Người dùng không tồn tại' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi xem thông tin người dùng', error: err.message });
    }
}

// Cập nhật thông tin người dùng
const updateUser = async(req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        user ? res.json(user) : res.status(404).json({ message: 'Người dùng không tồn tại' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin người dùng', error: err.message });
    }
};

// Chặn người dùng
const blockUser = async(req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });
        if (user.isBlocked) return res.status(400).json({ message: 'User đang bị chặn' });
        user.isBlocked = true;
        const updated = await user.save();
        res.json({ message: 'User đã bị chặn', user: updated });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi chặn người dùng', error: err.message });
    }
};

// Bỏ chặn người dùng
const unBlockUser = async(req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });
        if (!user.isBlocked) return res.status(400).json({ message: 'User không bị chặn' }); // 400 Bad Request
        user.isBlocked = false;
        const updated = await user.save();
        res.json({ message: 'User đã được bỏ chặn', user: updated });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi bỏ chặn người dùng', error: err.message });
    }
};

// Quản lý sản phẩm và các biến thể sản phẩm
// Tạo mới sản phẩm
const createProduct = async(req, res) => {
    try {
        const { slug, category } = req.body;
        const slugExists = await Product.findOne({ slug });
        if (slugExists) return res.status(400).json({ message: 'Tên định danh sản phẩm đã tồn tại!' });
        if (!(await Category.findById(category))) return res.status(404).json({ message: 'Danh mục không tồn tại' });
        const product = await Product.create(req.body)
        return res.status(201).json(product);
    } catch (err) {
        return res.status(500).json({ messgae: 'Tạo sản phẩm thất bại', error: err.message });
    }
};

// Cập nhật sản phẩm
const updateProduct = async(req, res) => {
    try {
        const { id } = req.params;
        const { slug, category } = req.body;
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

        if (slug) {
            const slugExists = await Product.findOne({ slug });
            if (slugExists && slugExists._id.toString() !== id) return res.status(400).json({ message: 'Tên định danh sản phẩm đã tồn tại!' });
        }

        if (category) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) return res.status(404).json({ message: 'Danh mục không tồn tại' });
        }

        const updated = await Product.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        return res.json(updated);
    } catch (err) {
        return res.status(500).json({ message: 'Cập nhật thất bại', error: err.message });
    }
};

// Xóa sản phẩm
const deleteProduct = async(req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        await Product.findByIdAndDelete(id);
        return res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (err) {
        return res.status(500).json({ message: 'Xóa sản phẩm thất bại', error: err.message });
    }
};

// Thêm biến thể sản phẩm và thêm hình ảnh
const addVariantsAndImages = async(req, res) => {
    try {
        const { id } = req.params;
        const { variants = [], images = [] } = req.body;
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        if (!Array.isArray(variants)) return res.status(400).json({ message: 'variants phải là mảng' });
        if (!Array.isArray(images)) return res.status(400).json({ message: 'images phải là mảng' });

        for (const v of variants) {
            if (v.sku && product.variants.some(ev => ev.sku === v.sku)) return res.status(400).json({ message: `Variant SKU đã tồn tại: ${v.sku}` });
        }

        if (variants.length) product.variants.push(...variants);
        if (images.length) product.images.push(...images);

        await product.save();
        return res.json({ message: 'Cập nhật biến thể, hình ảnh thành công', product });
    } catch (err) {
        return res.status(500).json({ message: 'Thêm biến thể, hình ảnh không thành công', error: err.message });
    }
}

// Chỉnh sửa biến thể sản phẩm
const updateVariant = async(req, res) => {
    try {
        const { id: productId, variantId } = req.params;
        const updateData = req.body;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

        const variantIndex = product.variants.findIndex(v => v._id.toString() === variantId);
        if (variantIndex === -1) return res.status(404).json({ message: 'Biến thể không tồn tại' });

        // Kiểm tra trùng SKU nếu có update SKU
        if (updateData.sku) {
            const skuExists = product.variants.some(
                v => v.sku === updateData.sku && v._id.toString() !== variantId
            );
            if (skuExists) return res.status(400).json({ message: 'SKU đã tồn tại trong sản phẩm này' });
        }

        // Cập nhật dữ liệu
        const variant = product.variants[variantIndex];
        Object.keys(updateData).forEach(key => {
            if (typeof updateData[key] === 'object' && !Array.isArray(updateData[key]) && variant[key]) {
                variant[key] = {...variant[key], ...updateData[key] };
            } else {
                variant[key] = updateData[key];
            }
        });

        await product.save();
        return res.json({ message: 'Cập nhật biến thể thành công', variant: product.variants[variantIndex] });
    } catch (err) {
        return res.status(500).json({ message: 'Cập nhật biến thể thất bại', error: err.message });
    }
};

// Xóa biến thể sản phẩm và hình ảnh
const deleteVariantsAndImages = async(req, res) => {
    try {
        const { id } = req.params;
        const { variantIds = [], imageIds = [] } = req.body;

        if (!Array.isArray(variantIds)) return res.status(400).json({ message: 'variantIds phải là mảng' });
        if (!Array.isArray(imageIds)) return res.status(400).json({ message: 'imageIds phải là mảng' });

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

        // Xóa variants
        if (variantIds.length > 0) {
            product.variants = product.variants.filter(
                v => !variantIds.includes(v._id.toString())
            );
        }

        // Xóa images bằng _id
        if (imageIds.length > 0) {
            // Kiểm tra số lượng ảnh trước khi xóa
            if (product.images.length - imageIds.length < 3) {
                return res.status(400).json({
                    message: 'Không thể xóa - sản phẩm phải giữ ít nhất 3 ảnh'
                });
            }
            product.images = product.images.filter(
                img => !imageIds.includes(img._id.toString())
            );
        }

        await product.save();
        return res.json({ message: 'Xóa biến thể và hình ảnh thành công', product });
    } catch (err) {
        return res.status(500).json({ message: 'Xóa biến thể và hình ảnh thất bại', error: err.message });
    }
}

// Quản lý danh mục sản phẩm
// Xem các danh mục sản phẩm
const getCategories = async(req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi xem danh mục sản phẩm', error: err.message });
    }
}

// Thêm danh mục sản phẩm
const createCategory = async(req, res) => {
    try {
        const { slug } = req.body;
        const slugExists = await Category.findOne({ slug });
        if (slugExists) return res.status(400).json({ message: 'Tên định danh danh mục đã tồn tại!' });
        const category = await Category.create(req.body);
        return res.status(201).json(category);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi thêm danh mục sản phẩm', error: err.message });
    }
};

// Chỉnh sửa danh mục sản phẩm
const updateCategory = async(req, res) => {
    try {
        const { id } = req.params;
        const { slug } = req.body;
        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: 'Danh mục không tồn tại' });

        if (slug) {
            const slugExists = await Category.findOne({ slug });
            if (slugExists && slugExists._id.toString() !== id) return res.status(400).json({ message: 'Tên định danh danh mục đã tồn tại!' });
        }

        const updated = await Category.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        return res.json(updated);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi chỉnh sửa danh mục sản phẩm', error: err.message });
    }
};

// Quản lý đơn hàng
// Lấy danh sách đơn hàng với phân trang và lọc theo ngày VÀ TRẠNG THÁI
const getOrders = async(req, res) => {
    try {
        const {
            page = 1,
                limit = 20,
                filter,
                status,
                startDate,
                endDate
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const queryConditions = {};

        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const yesterdayStart = new Date(new Date().setDate(now.getDate() - 1)).setHours(0, 0, 0, 0);

        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const thisWeekStart = new Date(new Date(now.setDate(diff)).setHours(0, 0, 0, 0));
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Lọc theo thời gian
        if (filter === 'today') {
            queryConditions.createdAt = { $gte: todayStart };
        } else if (filter === 'yesterday') {
            queryConditions.createdAt = { $gte: new Date(yesterdayStart), $lt: todayStart };
        } else if (filter === 'thisweek') {
            queryConditions.createdAt = { $gte: thisWeekStart };
        } else if (filter === 'thismonth') {
            queryConditions.createdAt = { $gte: thisMonthStart };
        } else if (startDate && endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            queryConditions.createdAt = {
                $gte: new Date(startDate),
                $lt: endOfDay
            };
        }

        // 2. Lọc theo trạng thái
        if (status && status !== '') {
            queryConditions.status = status;
        }

        const [orders, totalOrders] = await Promise.all([
            Order.find(queryConditions)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'name email'),
            Order.countDocuments(queryConditions)
        ]);

        res.json({
            orders,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalOrders / parseInt(limit)),
            totalOrders,
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng', error: err.message });
    }
};

// Lấy chi tiết đơn hàng
const getOrderDetail = async(req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('user', 'name email')
            .populate({
                path: 'items.product',
                select: 'name images variants'
            })
            .populate('discount', 'code value')
            .lean();

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        // Thêm thông tin variant cho mỗi item nếu có
        order.items = order.items.map(item => {
            const product = item.product;
            if (item.variantId && product.variants) {
                const variant = product.variants.find(
                    v => v._id.toString() === item.variantId.toString()
                );
                if (variant) {
                    item.variantInfo = {
                        name: variant.name,
                        sku: variant.sku,
                        attributes: variant.attributes
                    };
                }
            }
            return item;
        });

        const formattedOrder = {
            _id: order._id,
            orderNumber: order.orderNumber,
            user: order.user,
            items: order.items.map(item => ({
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    image: item.product.images[0]
                },
                variantInfo: item.variantInfo,
                quantity: item.quantity,
                price: item.price,
                subTotal: item.subTotal
            })),
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            status: order.status,
            statusHistory: order.statusHistory,
            discount: order.discount,
            discountAmount: order.discountAmount,
            pointsUsed: order.pointsUsed,
            pointsEarned: order.pointsEarned,
            subtotal: order.items.reduce((sum, item) => sum + item.subTotal, 0),
            shipping: 30000,
            totalPrice: order.totalPrice,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        return res.json(formattedOrder);
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi xem chi tiết đơn hàng', error: err.message });
    }
};

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async(req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

        const order = await Order.findById(id)
            .populate({
                path: 'items.product',
                select: 'name variants'
            })
            .populate('user')
            .populate('discount');

        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        if (order.status === 'cancelled') return res.status(400).json({ message: 'Đơn hàng đã bị hủy, không thể cập nhật trạng thái' });
        if (order.status === 'delivered') return res.status(400).json({ message: 'Đơn hàng đã giao thành công, không thể cập nhật trạng thái' });

        // Xử lý khi hủy đơn hàng
        if (status === 'cancelled' && order.status !== 'cancelled') {
            try {
                // 1. Hoàn tồn kho
                const stockUpdatePromises = order.items.map(item => {
                    if (!item.variantId) {
                        console.warn(`Missing variantId for item in order ${order._id}`);
                        return Promise.resolve();
                    }
                    return Product.updateOne({
                        _id: item.product._id,
                        'variants._id': item.variantId
                    }, {
                        $inc: { 'variants.$.stock': item.quantity }
                    });
                });
                await Promise.all(stockUpdatePromises.filter(p => p));

                // 2. Hoàn lại lượt sử dụng mã giảm giá
                if (order.discount) {
                    await Discount.findByIdAndUpdate(
                        order.discount._id, { $inc: { usedCount: -1 } }
                    );
                }

                // 3. Hoàn điểm thưởng
                if (order.user && (order.pointsUsed > 0 || order.pointsEarned > 0)) {
                    const pointsToRestore = order.pointsUsed - order.pointsEarned;
                    await User.findByIdAndUpdate(
                        order.user._id, { $inc: { loyaltyPoints: pointsToRestore } }
                    );
                }
            } catch (updateError) {
                return res.status(500).json({ message: 'Lỗi khi cập nhật dữ liệu liên quan', error: updateError.message });
            }
        }

        // Cập nhật trạng thái đơn hàng
        order.status = status;
        order.statusHistory.push({ status, updatedAt: new Date() });
        const updatedOrder = await Order.findByIdAndUpdate(
                id, {
                    status: order.status,
                    statusHistory: order.statusHistory
                }, { new: true }
            ).populate('user', 'name email')
            .populate('discount', 'code value');

        return res.json({ message: `Cập nhật trạng thái đơn hàng thành ${status}`, order: updatedOrder });

    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái đơn hàng', error: err.message });
    }
};

// Quản lý mã giảm giá
// Tạo mã giảm giá
const createDiscountCode = async(req, res) => {
    try {
        const { code } = req.body;
        const codeExists = await Discount.findOne({ code });
        if (codeExists) return res.status(400).json({ message: 'Mã giảm giá này đã tồn tại' });
        const discount = await Discount.create(req.body);
        res.status(201).json(discount);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi tạo mã giảm giá mới', error: err.message });
    }
};

// Lấy tất cả mã giảm giá (Cập nhật để populate đơn hàng)
const getAllDiscountCodes = async(req, res) => {
    try {
        const discounts = await Discount.find()
            .populate({
                path: 'appliedOrders',
                select: '_id name email totalPrice discountAmount createdAt status',
                options: { sort: { createdAt: -1 } }
            });

        const formattedDiscounts = discounts.map(discount => {
            const validOrders = (discount.appliedOrders || []).filter(order => order);

            return {
                _id: discount._id,
                code: discount.code,
                value: discount.value,
                usageLimit: discount.usageLimit,
                usedCount: discount.usedCount,
                remainingUses: discount.usageLimit - discount.usedCount,
                createdAt: discount.createdAt,
                updatedAt: discount.updatedAt,
                orders: validOrders.map(order => ({
                    _id: order._id,
                    customerName: order.name,
                    customerEmail: order.email,
                    orderTotal: order.totalPrice,
                    discountAmount: order.discountAmount,
                    orderDate: order.createdAt,
                    status: order.status
                })),
                stats: {
                    totalOrders: validOrders.length,
                    totalDiscountAmount: validOrders.reduce((sum, order) => sum + (order.discountAmount || 0), 0),
                    averageDiscount: validOrders.length > 0 ?
                        Math.round(validOrders.reduce((sum, order) => sum + (order.discountAmount || 0), 0) / validOrders.length) : 0
                }
            };
        });

        return res.json({ discounts: formattedDiscounts });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi lấy danh sách mã giảm giá', error: err.message });
    }
};

// Dashboard Admin
// Thống kê cơ bản (Cập nhật để thêm 'người dùng mới' và 'sản phẩm bán chạy')
const dashboardBasic = async(req, res) => {
    try {
        // Tính thời gian
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [
            userStats,
            orderStats,
            bestSellers,
            revenueByMonth
        ] = await Promise.all([
            // 1. Thống kê người dùng
            User.aggregate([{
                $facet: {
                    'total': [{ $count: 'count' }],
                    'newUsers': [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        { $count: 'count' }
                    ],
                    'userGrowth': [{
                            $group: {
                                _id: {
                                    year: { $year: '$createdAt' },
                                    month: { $month: '$createdAt' }
                                },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { '_id.year': -1, '_id.month': -1 } },
                        { $limit: 6 }
                    ]
                }
            }]),

            // 2. Thống kê đơn hàng
            Order.aggregate([{
                $facet: {
                    'total': [{ $count: 'count' }],
                    'byStatus': [{
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }],
                    'recentOrders': [
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                totalPrice: 1,
                                status: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }
            }]),

            // 3. Top sản phẩm bán chạy
            Order.aggregate([
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.product',
                        name: { $first: '$items.name' },
                        totalQuantity: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: '$items.subTotal' }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 5 }
            ]),

            // 4. Doanh thu theo tháng (6 tháng gần nhất)
            Order.aggregate([{
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        revenue: { $sum: '$totalPrice' },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 6 }
            ])
        ]);

        // Format response
        const response = {
            users: {
                total: userStats[0].total[0].count || 0,
                newThisMonth: userStats[0].newUsers[0].count || 0,
                growthChart: userStats[0].userGrowth.reverse()
            },
            orders: {
                total: orderStats[0].total[0].count || 0,
                byStatus: orderStats[0].byStatus.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                recent: orderStats[0].recentOrders
            },
            bestSellers: bestSellers,
            revenue: {
                monthly: revenueByMonth.reverse(),
                total: revenueByMonth.reduce((sum, month) => sum + month.revenue, 0),
                thisMonth: revenueByMonth.find(m =>
                    m._id.year === now.getFullYear() &&
                    m._id.month === (now.getMonth() + 1)
                ).revenue || 0
            }
        };

        return res.json({ dashboard: response });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi lấy thông tin dashboard', error: err.message });
    }
};

// Thống kê nâng cao (bao gồm các biểu đồ biểu diễn các chỉ số trong cửa hàng)
const getDashboardCharts = async(req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day', margin = 20, comparePrev = 'false' } = req.query;

        if (!startDate || !endDate) return res.status(400).json({ message: 'Vui lòng cung cấp startDate và endDate' });

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Build _id grouping expression
        let idExpr;
        let sortStage;
        switch (groupBy) {
            case 'year':
                idExpr = { year: { $year: '$createdAt' } };
                sortStage = { '_id.year': 1 };
                break;
            case 'quarter':
                idExpr = {
                    year: { $year: '$createdAt' },
                    quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
                };
                sortStage = { '_id.year': 1, '_id.quarter': 1 };
                break;
            case 'month':
                idExpr = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
                sortStage = { '_id.year': 1, '_id.month': 1 };
                break;
            case 'week':
                idExpr = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
                sortStage = { '_id.year': 1, '_id.week': 1 };
                break;
            case 'day':
            default:
                idExpr = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
                sortStage = { '_id.year': 1, '_id.month': 1, '_id.day': 1 };
                break;
        }

        // Main pipelines: orders aggregated by period, items aggregated by period, top products
        const matchStage = { createdAt: { $gte: start, $lte: end } };

        const ordersPipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: idExpr,
                    revenue: { $sum: '$totalPrice' },
                    ordersCount: { $sum: 1 }
                }
            },
            { $sort: sortStage }
        ];

        const itemsPipeline = [
            { $match: matchStage },
            { $unwind: '$items' },
            {
                $group: {
                    _id: idExpr,
                    productsSold: { $sum: '$items.quantity' },
                    itemsRevenue: { $sum: '$items.subTotal' }
                }
            },
            { $sort: sortStage }
        ];

        const topProductsPipeline = [
            { $match: matchStage },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subTotal' }
                }
            },
            { $sort: { totalQuantity: -1, totalRevenue: -1 } },
            { $limit: 10 }
        ];

        const [ordersAgg, itemsAgg, topProducts] = await Promise.all([
            Order.aggregate(ordersPipeline),
            Order.aggregate(itemsPipeline),
            Order.aggregate(topProductsPipeline)
        ]);

        // merge ordersAgg and itemsAgg by _id
        const mapKey = id => JSON.stringify(id);
        const map = new Map();
        ordersAgg.forEach(o => {
            map.set(mapKey(o._id), { period: o._id, revenue: o.revenue || 0, ordersCount: o.ordersCount || 0, productsSold: 0, itemsRevenue: 0 });
        });
        itemsAgg.forEach(i => {
            const key = mapKey(i._id);
            if (map.has(key)) {
                const entry = map.get(key);
                entry.productsSold = i.productsSold || 0;
                entry.itemsRevenue = i.itemsRevenue || 0;
            } else {
                map.set(key, { period: i._id, revenue: 0, ordersCount: 0, productsSold: i.productsSold || 0, itemsRevenue: i.itemsRevenue || 0 });
            }
        });

        // Build chart array sorted by key
        const chartData = Array.from(map.values()).sort((a, b) => {
            const ka = JSON.stringify(a.period),
                kb = JSON.stringify(b.period);
            return ka < kb ? -1 : ka > kb ? 1 : 0;
        }).map(r => {
            const revenue = r.revenue || r.itemsRevenue || 0;
            const profit = revenue * (Number(margin) / 100);
            const avgOrderValue = r.ordersCount ? Math.round(revenue / r.ordersCount) : 0;
            return {
                period: r.period,
                revenue,
                formattedRevenue: revenue,
                profit,
                formattedProfit: profit,
                productsSold: r.productsSold || 0,
                ordersCount: r.ordersCount || 0,
                avgOrderValue
            };
        });

        // compute totals for range
        const totals = chartData.reduce((acc, cur) => {
            acc.revenue += cur.revenue;
            acc.profit += cur.profit;
            acc.productsSold += cur.productsSold;
            acc.ordersCount += cur.ordersCount;
            return acc;
        }, { revenue: 0, profit: 0, productsSold: 0, ordersCount: 0 });
        totals.avgOrderValue = totals.ordersCount ? Math.round(totals.revenue / totals.ordersCount) : 0;

        // optional previous period comparison
        let prevTotals = null;
        if (String(comparePrev).toLowerCase() === 'true') {
            const rangeMs = end.getTime() - start.getTime();
            const prevEnd = new Date(start.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - rangeMs);
            const prevMatch = { createdAt: { $gte: prevStart, $lte: prevEnd } };

            const [prevOrders, prevItems] = await Promise.all([
                Order.aggregate([
                    { $match: prevMatch },
                    { $group: { _id: null, revenue: { $sum: '$totalPrice' }, ordersCount: { $sum: 1 } } }
                ]),
                Order.aggregate([
                    { $match: prevMatch },
                    { $unwind: '$items' },
                    { $group: { _id: null, productsSold: { $sum: '$items.quantity' }, itemsRevenue: { $sum: '$items.subTotal' } } }
                ])
            ]);

            const prevRevenue = (prevOrders[0].revenue || 0) || (prevItems[0].itemsRevenue || 0);
            const prevProductsSold = prevItems[0].productsSold || 0;
            const prevOrdersCount = prevOrders[0].ordersCount || 0;
            const prevProfit = prevRevenue * (Number(margin) / 100);

            prevTotals = {
                revenue: prevRevenue,
                profit: prevProfit,
                productsSold: prevProductsSold,
                ordersCount: prevOrdersCount,
                avgOrderValue: prevOrdersCount ? Math.round(prevRevenue / prevOrdersCount) : 0,
                period: { start: prevStart, end: prevEnd }
            };
        }

        return res.json({
            chart: {
                groupBy,
                start,
                end,
                marginPercent: Number(margin),
                data: chartData,
                totals
            },
            topProducts,
            prevTotals
        });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu biểu đồ', error: err.message });
    }
};

module.exports = {
    getAllUsers,
    getUser,
    updateUser,
    blockUser,
    unBlockUser,
    createProduct,
    updateProduct,
    deleteProduct,
    addVariantsAndImages,
    deleteVariantsAndImages,
    updateVariant,
    getCategories,
    createCategory,
    updateCategory,
    getOrders,
    getOrderDetail,
    updateOrderStatus,
    createDiscountCode,
    getAllDiscountCodes,
    dashboardBasic,
    getDashboardCharts
};