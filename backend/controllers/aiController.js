const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/Product");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        const systemPrompt = `Bạn là nhân viên bán hàng điện tử. 
        Luật 1: Nếu khách hỏi chung chung, hãy hỏi lại để làm rõ nhu cầu.
        Luật 2: Nếu khách đã cung cấp thông tin, trả về JSON. Cấu trúc chuẩn: {"isReady": true, "keywords": ["HP", "16GB"], "targetPrice": 25000000}.
        Luật 3: Trường "targetPrice" là TÙY CHỌN. Nếu khách nói mức giá (vd: "20 triệu", "tầm 15 củ"), hãy đổi thành số nguyên (20000000, 15000000). Nếu khách không nhắc đến giá, tuyệt đối KHÔNG đưa trường targetPrice vào JSON.
        Luật 4: Nếu khách hỏi sản phẩm bán chạy nhất, best seller, trả về: {"isReady": true, "keywords": ["BEST_SELLER"]}. Tuyệt đối không nói thêm gì ngoài JSON.`;

        const prompt = `${systemPrompt}\n\nLịch sử đoạn chat trước đó:\n${history}\n\nKhách hàng vừa nói thêm: "${message}"`;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\nKhách hàng: "${message}"`);
        const aiResponse = result.response.text();

        try {
            const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            const aiData = JSON.parse(cleanJson);

            // Đổi điều kiện if chỉ cần isReady là được chạy
            if (aiData.isReady) {
                let products = [];

                // Kịch bản 1: Tìm hàng bán chạy
                if (aiData.keywords && aiData.keywords.includes("BEST_SELLER")) {
                     products = await Product.find({}).limit(3); 
                } 
                // Kịch bản 2: Tìm theo từ khóa và giá tiền
                else {
                    let query = {}; // Tạo một bộ lọc rỗng

                    // 1. Thêm bộ lọc từ khóa (nếu AI nhặt được từ khóa)
                    if (aiData.keywords && aiData.keywords.length > 0) {
                        const searchQueries = aiData.keywords.map(kw => new RegExp(kw, 'i'));
                        query.$or = [
                            { name: { $in: searchQueries } },
                            { description: { $in: searchQueries } }
                        ];
                    }

                    // 2. Thêm bộ lọc khoảng giá +- 5 triệu (nếu AI bắt được số tiền)
                    if (aiData.targetPrice) {
                        const target = Number(aiData.targetPrice);
                        query.price = {
                            $gte: target - 5000000, // Lớn hơn hoặc bằng giá mục tiêu - 5 triệu
                            $lte: target + 5000000  // Nhỏ hơn hoặc bằng giá mục tiêu + 5 triệu
                        };
                    }

                    // Chọc vào Database bằng bộ lọc tổng hợp ở trên
                    products = await Product.find(query).limit(3); 
                } 

                return res.status(200).json({
                    type: "form",
                    message: products.length > 0 
                        ? "Dạ, hệ thống tìm thấy một số mẫu này cực kỳ phù hợp với yêu cầu của bạn ạ:"
                        : "Dạ hiện tại trong tầm giá này hệ thống chưa tìm thấy mẫu khớp chính xác. Bạn tham khảo mức giá khác hoặc mẫu khác nhé!",
                    products: products 
                });
            }
        } catch (err) {
            return res.status(200).json({
                type: "text",
                message: aiResponse,
                products: []
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