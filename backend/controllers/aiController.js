const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/Product");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        const systemPrompt = `Bạn là nhân viên bán hàng điện tử. Dưới đây là các quy tắc BẮT BUỘC để phân tích câu hỏi. MỌI CÂU TRẢ LỜI PHẢI NẰM TRONG CẤU TRÚC JSON, KHÔNG NÓI THÊM BẤT KỲ CHỮ NÀO BÊN NGOÀI.

        Luật 1 (Giao tiếp & Đồng ý): Khách chào hỏi, nói chuyện phiếm, hoặc xác nhận (vd: "đúng thế", "ok", "ừ") -> Trả về JSON: {"action": "CHAT", "message": "Câu phản hồi thân thiện của bạn"}.
        Luật 2 (Tìm kiếm): Khách tìm sản phẩm -> BẮT BUỘC trả về JSON: {"isReady": true, "keywords": ["từ khóa"]}.
        - CHÚ Ý 1: Lọc BỎ NGAY LẬP TỨC các từ thừa như "laptop", "máy tính", "tìm", "cho mình". CHỈ GIỮ LẠI ĐÚNG tên thương hiệu (vd: "HP", "Dell", "Macbook") hoặc dòng máy.
        - CHÚ Ý 2: NẾU khách CÓ nhắc đến giá tiền (vd: 20 triệu) thì mới thêm trường "targetPrice": 20000000. NẾU KHÔNG CÓ GIÁ TIỀN, TUYỆT ĐỐI KHÔNG ĐƯA "targetPrice" VÀO JSON.
        Luật 3 (Bán chạy): Khách hỏi best seller -> JSON: {"isReady": true, "keywords": ["BEST_SELLER"]}.
        Luật 4 (Thêm giỏ): "Mua số 2" -> {"action": "ADD_BY_INDEX", "index": 2}. "Lấy Victus" -> {"action": "ADD_TO_CART", "productName": "Victus"}.
        Luật 5 (Thanh toán): "Tính tiền" -> {"action": "CHECKOUT"}.
        Luật 6 (Chi tiết): "Xem số 3" -> {"action": "VIEW_DETAIL", "index": 3}.
        Luật 7 (Giao diện): "Thu gọn" -> {"action": "COLLAPSE_LIST"}. "Mở bảng" -> {"action": "EXPAND_LIST"}.
        Luật 8 (Tóm tắt - RẤT QUAN TRỌNG): Khi khách yêu cầu tóm tắt (vd: "tóm tắt lại", "nãy giờ hỏi gì"), BẠN PHẢI ĐỌC [LỊCH SỬ CHAT] VÀ TUYỆT ĐỐI CHỈ TRẢ VỀ ĐỊNH DẠNG JSON NÀY, KHÔNG NÓI THÊM BẤT KỲ CHỮ NÀO BÊN NGOÀI: 
        {"action": "SUMMARIZE", "message": "Dạ, nãy giờ bạn đã nhờ em tìm laptop HP và thêm sản phẩm số 3 vào giỏ hàng ạ..."}`;

        // ÉP AI ĐỌC LỊCH SỬ CHAT BẰNG CÁCH NỐI CHUỖI NÀY
        const fullPrompt = `
        ${systemPrompt}
        
        [LỊCH SỬ CHAT TỪ TRƯỚC ĐẾN NAY]:
        ${req.body.history}

        [CÂU NÓI HIỆN TẠI CỦA KHÁCH]:
        ${req.body.message}
        `;

        const prompt = `${systemPrompt}\n\nLịch sử đoạn chat trước đó:\n${history}\n\nKhách hàng vừa nói thêm: "${message}"`;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\nKhách hàng: "${message}"`);
        const aiResponse = result.response.text();

       try {
            const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            const aiData = JSON.parse(cleanJson);

            // 1. NHÓM GIAO TIẾP & TÓM TẮT
            if (aiData.action === "CHAT" || aiData.action === "SUMMARIZE") {
                return res.status(200).json({ 
                    type: "text", 
                    message: aiData.message 
                });
            }

            // 2. NHÓM GIAO DIỆN
            if (aiData.action === "COLLAPSE_LIST") {
                return res.status(200).json({ type: "collapse_list" });
            }
            if (aiData.action === "EXPAND_LIST") {
                return res.status(200).json({ type: "expand_list" });
            }
            if (aiData.action === "CLOSE_LIST") {
                return res.status(200).json({ type: "close_list" });
            }
            if (aiData.action === "VIEW_DETAIL") { // <-- BỔ SUNG LUẬT 6 BỊ THIẾU
                return res.status(200).json({ 
                    type: "view_detail", 
                    index: aiData.index 
                });
            }

            // 3. NHÓM CHỐT ĐƠN & THANH TOÁN
            if (aiData.action === "ADD_BY_INDEX") {
                return res.status(200).json({
                    type: "add_by_index",
                    index: aiData.index
                });
            }
            if (aiData.action === "CHECKOUT") {
                return res.status(200).json({
                    type: "checkout",
                    message: "Dạ vâng, em đang đưa bạn đến trang Giỏ hàng để thanh toán ngay đây ạ!"
                });
            }
            if (aiData.action === "ADD_TO_CART") {
                let productToAdd = null;
                if (aiData.productName) {
                    productToAdd = await Product.findOne({ name: new RegExp(aiData.productName, 'i') });
                } 
                else if (aiData.targetPrice) {
                    const target = Number(aiData.targetPrice);
                    const products = await Product.find({
                        price: { $gte: target - 6000000, $lte: target + 6000000 }
                    });
                    
                    if (products.length > 0) {
                        productToAdd = products.reduce((prev, curr) => 
                            Math.abs(curr.price - target) < Math.abs(prev.price - target) ? curr : prev
                        );
                    }
                }

                if (productToAdd) {
                    return res.status(200).json({
                        type: "cart_success",
                        message: `Dạ, em đã giúp bạn tự động thêm sản phẩm **${productToAdd.name}** vào giỏ hàng rồi ạ! Bạn có thể kiểm tra giỏ hàng nhé.`,
                        product: productToAdd
                    });
                } else {
                    return res.status(200).json({
                        type: "text",
                        message: "Dạ em tìm mỏi mắt mà chưa thấy sản phẩm nào khớp chính xác để thêm vào giỏ hàng. Bạn cho em xin lại tên cụ thể hơn nha!"
                    });
                }
            }

            // 4. NHÓM TÌM KIẾM (isReady)
            if (aiData.isReady) {
                let products = [];
                let query = {}; 

                if (aiData.keywords && aiData.keywords.includes("BEST_SELLER")) {
                     products = await Product.find({}).limit(5);
                } 
                else {
                    if (aiData.keywords && aiData.keywords.length > 0) {
                        const searchQueries = aiData.keywords.map(kw => new RegExp(kw, 'i'));
                        query.$or = [
                            { name: { $in: searchQueries } },
                            { description: { $in: searchQueries } }
                        ];
                    }
                    if (aiData.targetPrice) {
                        const target = Number(aiData.targetPrice);
                        query.price = {
                            $gte: target - 5000000, 
                            $lte: target + 5000000  
                        };
                    }
                    products = await Product.find(query).limit(5);
                } 

                return res.status(200).json({
                    type: "form",
                    message: products.length > 0 
                        ? "Dạ, em tìm được các mẫu này, bạn xem bảng bên trái nhé. Bạn muốn mua mẫu số mấy ạ?"
                        : "Dạ hiện tại trong tầm giá này hệ thống chưa tìm thấy mẫu khớp chính xác. Bạn tham khảo mức giá khác nhé!",
                    products: products 
                });
            }

            // ==========================================
            // 5. LƯỚI AN TOÀN (NẾU AI TRẢ JSON LẠ HOẮC)
            // ==========================================
            return res.status(200).json({
                type: "text",
                message: "Dạ em hiểu ý bạn nhưng hệ thống chưa kịp xử lý lệnh này. Bạn có thể nói rõ hơn giúp em không ạ?"
            });

        } catch (error) {
            console.error("Lỗi AI không trả về chuẩn JSON:", error);
            // TRƯỜNG HỢP AI TRẢ VỀ TEXT BÌNH THƯỜNG (KHÔNG PHẢI JSON)
            return res.status(500).json({ 
                type: "text", 
                message: "Dạ em bị lú một chút, bạn nói lại giúp em nhé!" 
            });
        }
    } catch (error) {
        console.error("Lỗi API AI hoặc hết Token:", error.message);
        const backupProducts = await Product.find({}).limit(3); 

        return res.status(200).json({
            type: "form",
            message: "Dạ, hiện tại tư vấn viên AI đang hỗ trợ hơi đông khách. Hệ thống xin phép gợi ý cho bạn 3 mẫu sản phẩm Đang Bán Chạy Nhất cửa hàng nhé:",
            products: backupProducts 
        });
    }
};