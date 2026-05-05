const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/Product");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        const systemPrompt = `Bạn là Trợ lý AI xuất sắc của cửa hàng "Computer Store", chuyên tư vấn máy tính, laptop và linh kiện.
        Nhiệm vụ của bạn là phân tích câu nói của khách hàng và BẮT BUỘC trả về kết quả dưới dạng MỘT ĐỐI TƯỢNG JSON DUY NHẤT. 
        TUYỆT ĐỐI KHÔNG thêm bất kỳ văn bản, giải thích, hay dấu tick markdown (như \`\`\`json) nào xung quanh JSON.

        Dựa vào ý định của khách hàng, hãy chọn ĐÚNG 1 trong các cấu trúc JSON dưới đây:

        1. TÌM KIẾM SẢN PHẨM:
        - Khách muốn tìm sản phẩm (vd: "tìm laptop hp", "cho xem macbook").
        - QUY TẮC TỪ KHÓA: Lọc bỏ hoàn toàn các từ thừa (tìm, mua, cho, mình, laptop, máy tính). Chỉ giữ lại tên hãng hoặc dòng máy (vd: "HP", "Macbook", "Victus").
        - QUY TẮC GIÁ: NẾU VÀ CHỈ NẾU khách có nhắc đến số tiền thì mới thêm "targetPrice" (dạng số). Không thì bỏ qua.
        - TRẢ VỀ: {"isReady": true, "keywords": ["từ_khóa_1"]} hoặc {"isReady": true, "keywords": ["từ_khóa"], "targetPrice": 20000000}

        2. SẢN PHẨM BÁN CHẠY:
        - Khách hỏi hàng hot, bán chạy.
        - TRẢ VỀ: {"isReady": true, "keywords": ["BEST_SELLER"]}

        3. TƯƠNG TÁC GIAO DIỆN BẢNG:
        - Khách muốn thu gọn: TRẢ VỀ: {"action": "COLLAPSE_LIST"}
        - Khách muốn mở rộng bảng: TRẢ VỀ: {"action": "EXPAND_LIST"}
        - Khách muốn tắt/đóng bảng: TRẢ VỀ: {"action": "CLOSE_LIST"}

        4. XEM CHI TIẾT SẢN PHẨM:
        - Khách muốn xem thông tin chi tiết của một sản phẩm cụ thể.
        - Xem theo số thứ tự trên bảng (vd "xem con số 3", "chi tiết máy thứ 1"): TRẢ VỀ: {"action": "VIEW_DETAIL", "index": 3}
        - Xem theo tên (vd "cho xem chi tiết HP Victus"): TRẢ VỀ: {"action": "VIEW_DETAIL", "productName": "HP Victus"}

        5. GIỎ HÀNG & THANH TOÁN:
        - Thêm vào giỏ theo số (vd "mua cái số 2"): TRẢ VỀ: {"action": "ADD_BY_INDEX", "index": 2}
        - Thêm vào giỏ theo tên (vd "lấy con Victus"): TRẢ VỀ: {"action": "ADD_TO_CART", "productName": "Victus"}
        - Khách muốn mua sản phẩm ĐANG XEM TRÊN MÀN HÌNH (vd "mua con này", "thêm cái này vào giỏ"): TRẢ VỀ: {"action": "ADD_CURRENT_TO_CART"}
        - Muốn tính tiền / thanh toán: TRẢ VỀ: {"action": "CHECKOUT"}

        6. YÊU CẦU TÓM TẮT (RẤT QUAN TRỌNG):
        - Khách hỏi "nãy giờ nói gì", "tóm tắt lại". Bạn PHẢI đọc [LỊCH SỬ CHAT] ở dưới và tự viết một câu tóm tắt.
        - TRẢ VỀ: {"action": "SUMMARIZE", "message": "Dạ nãy giờ bạn đã nhờ em tìm [A], và thêm [B] vào giỏ hàng..."}

        7. GIAO TIẾP THÔNG THƯỜNG HOẶC NGOÀI LỀ:
        - Chào hỏi, cảm ơn, xác nhận ("đúng thế", "ok"), HOẶC hỏi những thứ không liên quan đến máy tính (như thời tiết, nấu ăn).
        - TRẢ VỀ: {"action": "CHAT", "message": "Câu trả lời thân thiện, hoặc khéo léo từ chối nếu hỏi ngoài lề."}`;

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
            if (aiData.action === "VIEW_DETAIL") {
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

            // NẰM TRONG NHÓM CHỐT ĐƠN & THANH TOÁN (cùng chỗ với ADD_TO_CART)
            if (aiData.action === "ADD_CURRENT_TO_CART") {
                const currentPath = req.body.currentPath || ""; // Lấy URL Frontend gửi lên
                
                // Nếu khách thực sự đang ở trang chi tiết sản phẩm (có chữ /product/)
                if (currentPath.includes("/product/")) {
                    // Lấy đoạn cuối của URL (chính là ID hoặc Slug của sản phẩm)
                    const slugOrId = currentPath.split("/").pop(); 
                    
                    // Tìm sản phẩm trong Database
                    let query = { slug: slugOrId };
                    // Nếu đường dẫn là _id (24 ký tự) thì đổi query
                    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
                        query = { $or: [{ slug: slugOrId }, { _id: slugOrId }] };
                    }

                    const currentProduct = await Product.findOne(query);

                    if (currentProduct) {
                        // Trả về type cart_success (Frontend của bạn đã có sẵn code xử lý cái này rồi, không cần viết thêm gì ở UI)
                        return res.status(200).json({
                            type: "cart_success",
                            message: `Dạ, em đã thêm sản phẩm **${currentProduct.name}** mà bạn đang xem vào giỏ hàng rồi ạ!`,
                            product: currentProduct
                        });
                    }
                }

                // Nếu khách KHÔNG ở trang chi tiết (ví dụ đang ở Trang Chủ) mà tự nhiên nói "mua con này"
                return res.status(200).json({
                    type: "text",
                    message: "Dạ em chưa xác định được bạn đang xem sản phẩm nào. Bạn có thể cho em xin tên cụ thể của máy không ạ?"
                });
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