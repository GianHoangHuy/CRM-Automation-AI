const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require("../models/Product");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        const systemPrompt = `Bạn là nhân viên bán hàng điện tử. Dưới đây là các quy tắc BẮT BUỘC để phân tích câu nói của khách hàng:
        Luật 1 (Giao tiếp): Nếu khách chỉ chào hỏi hoặc hỏi chung chung chưa rõ nhu cầu, hãy trả lời bằng văn bản ngắn gọn, thân thiện để hỏi thêm (hãng, RAM, tầm giá...).
        Luật 2 (Tìm kiếm thông thường): Nếu khách yêu cầu TÌM KIẾM hoặc TƯ VẤN (vd: "tìm laptop HP 16gb", "tư vấn máy 20 triệu"), trả về JSON: {"isReady": true, "keywords": ["từ khóa 1", "từ khóa 2"], "targetPrice": 20000000}. (Trường targetPrice có thể bỏ trống nếu khách không nói giá).
        Luật 3 (Hàng bán chạy): Nếu khách hỏi sản phẩm bán chạy nhất, hot nhất, best seller, trả về JSON: {"isReady": true, "keywords": ["BEST_SELLER"]}.
        Luật 4 (Đưa vào giỏ hàng): ĐẶC BIỆT CHÚ Ý, nếu khách yêu cầu "THÊM VÀO GIỎ HÀNG", "MUA SẢN PHẨM NÀY", "LẤY CHO TÔI CON..." -> Bắt buộc trả về JSON theo form: {"action": "ADD_TO_CART", "productName": "Tên sản phẩm khách muốn", "targetPrice": 15000000}. (Nếu khách nói tên sản phẩm thì điền productName, nếu khách nói giá thì điền targetPrice).
        Luật 5 (Định dạng): Nếu rơi vào Luật 2, 3 hoặc 4, bạn TUYỆT ĐỐI CHỈ TRẢ VỀ ĐÚNG 1 CHUỖI JSON, cấm tuyệt đối không được nói thêm bất kỳ từ ngữ nào khác ở ngoài chuỗi JSON.`;

        const prompt = `${systemPrompt}\n\nLịch sử đoạn chat trước đó:\n${history}\n\nKhách hàng vừa nói thêm: "${message}"`;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\nKhách hàng: "${message}"`);
        const aiResponse = result.response.text();

        try {
            const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            const aiData = JSON.parse(cleanJson);
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

            if (aiData.isReady) {
                let products = [];
                let query = {}; 

                if (aiData.keywords && aiData.keywords.includes("BEST_SELLER")) {
                     products = await Product.find({}).limit(3); 
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
                    products = await Product.find(query).limit(3); 
                } 

                return res.status(200).json({
                    type: "form",
                    message: products.length > 0 
                        ? "Dạ, hệ thống tìm thấy một số mẫu này cực kỳ phù hợp với yêu cầu của bạn ạ:"
                        : "Dạ hiện tại trong tầm giá này hệ thống chưa tìm thấy mẫu khớp chính xác. Bạn tham khảo mức giá khác nhé!",
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