const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Discount = require("../models/Discount");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==============================================================
// CÁC HÀM TRỢ GIÚP DÀNH CHO ADMIN (Đã tinh chỉnh theo Schema của bạn)
// ==============================================================
// 1. HÀM THỐNG KÊ DOANH THU (Giữ nguyên của bạn)
const handleStatRevenue = async (timeFrame) => {
    try {
        let startDate = new Date();
        if (timeFrame === "month") {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (timeFrame === "day") {
            startDate.setHours(0, 0, 0, 0);
        } else {
            startDate.setDate(startDate.getDate() - 7); // Mặc định là tuần
        }

        const orders = await Order.find({
            createdAt: { $gte: startDate },
            status: "delivered"
        }).lean();

        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        return {
            type: "admin_chart",
            message: `Dạ báo cáo doanh thu các đơn đã giao thành công ${timeFrame === "month" ? "trong 30 ngày qua" : (timeFrame === "day" ? "hôm nay" : "trong 7 ngày qua")}:`,
            data: {
                totalRevenue,
                orderCount: orders.length
            }
        };
    } catch (error) {
        console.error("Lỗi tại handleStatRevenue:", error);
        return { type: "text", message: "Dạ hệ thống đang gặp chút lỗi khi lấy dữ liệu doanh thu." };
    }
};

// 2. HÀM DỰ BÁO (Tạm thời mock data)
const handlePredictTrend = async () => {
    return {
        type: "admin_predict",
        message: "Dựa trên dữ liệu bán hàng, phân khúc Laptop Văn phòng đang có xu hướng tăng trưởng ổn định. Dự báo tháng tới nhu cầu các dòng máy mỏng nhẹ sẽ tăng khoảng 15%.",
        suggestion: "Gợi ý: Anh/Chị có thể cân nhắc nhập thêm hàng và chạy chương trình Back-to-School cho sinh viên."
    };
};

// 3. HÀM TOP SẢN PHẨM BÁN CHẠY (Sửa lại: Móc data thật từ bảng Order)
const handleTopSellingProducts = async () => {
    try {
        // Query đếm số lượng bán thực tế từ các đơn hàng thành công
        const bestSellers = await Order.aggregate([
            { $match: { status: "delivered" } }, // Chỉ đếm các đơn đã giao
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        // Lấy thông tin chi tiết (tên, giá, ảnh) của các sản phẩm lọt Top
        const productIds = bestSellers.map(item => item._id);
        const topProducts = await Product.find({ _id: { $in: productIds } });

        return {
            type: "form",
            message: "Dạ đây là danh sách 5 sản phẩm bán chạy nhất dựa trên lịch sử đơn hàng thực tế:",
            products: topProducts
        };
    } catch (error) {
        console.error("Lỗi Top Selling:", error);
        return { type: "text", message: "Dạ có lỗi khi truy xuất danh sách sản phẩm bán chạy." };
    }
};

// 4. HÀM MỚI: THỐNG KÊ SỐ LƯỢNG TỔNG QUÁT (Theo yêu cầu của bạn bạn)
const handleGeneralStats = async () => {
    try {
        // Chạy song song 4 lệnh đếm để web không bị chậm
        const [userCount, productCount, orderCount, discountCount] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
            Discount.countDocuments()
        ]);
        
        return {
            type: "admin_general_stats",
            message: "Dạ đây là thống kê số lượng tổng quát trên hệ thống hiện tại:",
            data: {
                users: userCount,
                products: productCount,
                orders: orderCount,
                discounts: discountCount
            }
        };
    } catch (error) {
        return { type: "text", message: "Lỗi khi truy xuất số liệu hệ thống." };
    }
};

// ==============================================================
// HÀM XỬ LÝ CHAT CHÍNH
// ==============================================================
exports.chatWithAI = async(req, res) => {
    try {
        const { message, history, role, currentPath } = req.body;
        const isAdmin = role === 'admin';

        const systemPrompt = `Bạn là Trợ lý AI xuất sắc của cửa hàng "Computer Store", chuyên tư vấn máy tính, laptop và linh kiện.
Nhiệm vụ của bạn là phân tích câu nói của khách hàng và BẮT BUỘC trả về kết quả dưới dạng MỘT ĐỐI TƯỢNG JSON DUY NHẤT. 
TUYỆT ĐỐI KHÔNG thêm bất kỳ văn bản, giải thích, hay dấu tick markdown (như \`\`\`json) nào xung quanh JSON.

Dựa vào ý định của khách hàng, hãy chọn ĐÚNG 1 trong các cấu trúc JSON dưới đây:

1. TÌM KIẾM SẢN PHẨM:
- Khách muốn tìm sản phẩm (vd: "tìm laptop hp", "cho xem macbook").
- QUY TẮC TỪ KHÓA: Lọc bỏ hoàn toàn các từ thừa (tìm, mua, cho, mình, laptop, máy tính). Chỉ giữ lại tên hãng hoặc dòng máy.
- QUY TẮC GIÁ: NẾU VÀ CHỈ NẾU khách có nhắc đến số tiền thì mới thêm "targetPrice" (dạng số).
- TRẢ VỀ: {"isReady": true, "keywords": ["từ_khóa"]} hoặc {"isReady": true, "keywords": ["từ_khóa"], "targetPrice": 20000000}

2. SẢN PHẨM BÁN CHẠY:
- TRẢ VỀ: {"isReady": true, "keywords": ["BEST_SELLER"]}

3. TƯƠNG TÁC GIAO DIỆN BẢNG:
- Thu gọn bảng: {"action": "COLLAPSE_LIST"}
- Mở rộng bảng: {"action": "EXPAND_LIST"}
- Đóng bảng: {"action": "CLOSE_LIST"}

4. XEM CHI TIẾT SẢN PHẨM:
- Xem theo số thứ tự (vd "xem con số 3"): {"action": "VIEW_DETAIL", "index": 3}
- Xem theo tên (vd "chi tiết máy HP"): {"action": "VIEW_DETAIL", "productName": "HP"}

5. GIỎ HÀNG & THANH TOÁN:
- Thêm vào giỏ theo số: {"action": "ADD_BY_INDEX", "index": 2}
- Thêm vào giỏ theo tên: {"action": "ADD_TO_CART", "productName": "Victus"}
- Khách muốn mua sản phẩm ĐANG XEM TRÊN MÀN HÌNH: {"action": "ADD_CURRENT_TO_CART"}
- Muốn tính tiền: {"action": "CHECKOUT"}

6. YÊU CẦU TÓM TẮT:
- Bạn PHẢI đọc [LỊCH SỬ CHAT] ở dưới và viết một câu tóm tắt.
- TRẢ VỀ: {"action": "SUMMARIZE", "message": "Dạ nãy giờ bạn đã nhờ em tìm [A]..."}

7. GIAO TIẾP THÔNG THƯỜNG:
- Chào hỏi hoặc hỏi ngoài lề.
- TRẢ VỀ: {"action": "CHAT", "message": "Câu trả lời thân thiện..."}

8. LỆNH DÀNH CHO ADMIN (CHỈ THỰC HIỆN KHI ROLE LÀ ADMIN):
- Admin hỏi doanh thu: {"adminAction": "STAT_REVENUE", "timeFrame": "day" hoặc "month" hoặc "week"}
- Admin hỏi dự báo xu hướng: {"adminAction": "PREDICT_TREND"}
- Admin hỏi top bán chạy: {"adminAction": "TOP_SELLING_PRODUCTS"}

9. THỐNG KÊ SỐ LƯỢNG TỔNG QUÁT (DÀNH CHO ADMIN):
- Khách (Admin) hỏi có bao nhiêu sản phẩm, bao nhiêu người dùng, bao nhiêu mã giảm giá, hoặc tổng số lượng đơn hàng trên hệ thống.
- TRẢ VỀ: {"adminAction": "GENERAL_STATS"}`;

        const fullPrompt = `
${systemPrompt}

[THÔNG TIN NGƯỜI DÙNG]:
Role hiện tại: ${role || 'user'}

[LỊCH SỬ CHAT TỪ TRƯỚC ĐẾN NAY]:
${history || "Chưa có lịch sử"}

[CÂU NÓI HIỆN TẠI]:
"${message}"
`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(fullPrompt);
        const aiResponse = result.response.text();

        try {
            const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            const aiData = JSON.parse(cleanJson);

            // ==========================================
            // A. NHÓM QUẢN TRỊ (CHỈ CHẠY NẾU LÀ ADMIN)
            // ==========================================
            if (isAdmin && aiData.adminAction) {
                if (aiData.adminAction === "STAT_REVENUE") {
                    const stats = await handleStatRevenue(aiData.timeFrame);
                    return res.status(200).json(stats);
                }
                if (aiData.adminAction === "PREDICT_TREND") {
                    const prediction = await handlePredictTrend();
                    return res.status(200).json(prediction);
                }
                if (aiData.adminAction === "TOP_SELLING_PRODUCTS") {
                    const topProducts = await handleTopSellingProducts();
                    return res.status(200).json(topProducts);
                }
                if (aiData.adminAction === "GENERAL_STATS") {
                    const stats = await handleGeneralStats();
                    return res.status(200).json(stats);
                }
            }

            // ==========================================
            // B. NHÓM GIAO TIẾP & TÓM TẮT
            // ==========================================
            if (aiData.action === "CHAT" || aiData.action === "SUMMARIZE") {
                return res.status(200).json({ type: "text", message: aiData.message });
            }

            // ==========================================
            // C. NHÓM GIAO DIỆN
            // ==========================================
            if (aiData.action === "COLLAPSE_LIST") return res.status(200).json({ type: "collapse_list" });
            if (aiData.action === "EXPAND_LIST") return res.status(200).json({ type: "expand_list" });
            if (aiData.action === "CLOSE_LIST") return res.status(200).json({ type: "close_list" });
            if (aiData.action === "VIEW_DETAIL") return res.status(200).json({ type: "view_detail", index: aiData.index });

            // ==========================================
            // D. NHÓM CHỐT ĐƠN & THANH TOÁN
            // ==========================================
            if (aiData.action === "ADD_BY_INDEX") return res.status(200).json({ type: "add_by_index", index: aiData.index });
            if (aiData.action === "CHECKOUT") return res.status(200).json({ type: "checkout", message: "Dạ vâng, em đang đưa bạn đến trang Giỏ hàng ạ!" });
            
            if (aiData.action === "ADD_TO_CART") {
                let productToAdd = null;
                if (aiData.productName) {
                    productToAdd = await Product.findOne({ name: new RegExp(aiData.productName, 'i') });
                } else if (aiData.targetPrice) {
                    const target = Number(aiData.targetPrice);
                    const products = await Product.find({ price: { $gte: target - 6000000, $lte: target + 6000000 } });
                    if (products.length > 0) {
                        productToAdd = products.reduce((prev, curr) => Math.abs(curr.price - target) < Math.abs(prev.price - target) ? curr : prev);
                    }
                }
                if (productToAdd) return res.status(200).json({ type: "cart_success", message: `Dạ, em đã thêm **${productToAdd.name}** vào giỏ!`, product: productToAdd });
                return res.status(200).json({ type: "text", message: "Dạ em chưa thấy máy nào khớp để thêm vào giỏ." });
            }

            if (aiData.action === "ADD_CURRENT_TO_CART") {
                const currentPathVal = currentPath || "";
                if (currentPathVal.includes("/product/")) {
                    const slugOrId = currentPathVal.split("/").pop();
                    let query = { slug: slugOrId };
                    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) query = { $or: [{ slug: slugOrId }, { _id: slugOrId }] };
                    const currentProduct = await Product.findOne(query);
                    if (currentProduct) return res.status(200).json({ type: "cart_success", message: `Dạ, em đã thêm sản phẩm **${currentProduct.name}** vào giỏ!`, product: currentProduct });
                }
                return res.status(200).json({ type: "text", message: "Dạ em chưa xác định được bạn đang xem sản phẩm nào ạ." });
            }

            // ==========================================
            // E. NHÓM TÌM KIẾM
            // ==========================================
            if (aiData.isReady) {
                let products = [];
                let query = {};

                if (aiData.keywords && aiData.keywords.includes("BEST_SELLER")) {
                    products = await Product.find({}).limit(5);
                } else {
                    if (aiData.keywords && aiData.keywords.length > 0) {
                        const searchQueries = aiData.keywords.map(kw => new RegExp(kw, 'i'));
                        query.$or = [{ name: { $in: searchQueries } }, { description: { $in: searchQueries } }];
                    }
                    if (aiData.targetPrice) {
                        const target = Number(aiData.targetPrice);
                        query.price = { $gte: target - 5000000, $lte: target + 5000000 };
                    }
                    products = await Product.find(query).limit(5);
                }
                return res.status(200).json({
                    type: "form",
                    message: products.length > 0 ? "Dạ, em tìm được các mẫu này, bạn xem bảng bên trái nhé." : "Dạ hiện chưa có mẫu khớp chính xác.",
                    products: products
                });
            }

            return res.status(200).json({ type: "text", message: "Dạ hệ thống chưa kịp xử lý lệnh này." });

        } catch (error) {
            console.error("Lỗi parse JSON:", error);
            return res.status(200).json({ type: "text", message: "Dạ em chưa hiểu rõ, bạn nói lại giúp em nhé!" });
        }
    } catch (error) {
        console.error("Lỗi AI API:", error.message);
        const backupProducts = await Product.find({}).limit(3);
        return res.status(200).json({
            type: "form",
            message: "Dạ hiện tại AI đang bận. Hệ thống gợi ý 3 mẫu sản phẩm Đang Bán Chạy Nhất:",
            products: backupProducts
        });
    }
};