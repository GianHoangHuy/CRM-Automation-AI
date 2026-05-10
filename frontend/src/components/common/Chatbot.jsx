import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { OrderAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Chatbot = () => {
    const navigate = useNavigate();
    // 1. KIỂM TRA ĐĂNG NHẬP VÀ LẤY THÔNG TIN
    const token = sessionStorage.getItem('token') || localStorage.getItem('token'); 
    const isLoggedIn = !!token;

    // SỬA Ở ĐÂY: Thay 'user' thành 'userInfo'
    const userString = sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo') || '{}';
    const currentUser = JSON.parse(userString);
    
    // Bây giờ nó sẽ lấy được ID thật của Admin thay vì chữ 'guest'
    const userId = currentUser._id || currentUser.id || 'guest'; 
    
    // Kiểm tra quyền Admin
    const isUserAdmin = currentUser.isAdmin === true; 
    const userRole = isUserAdmin ? 'admin' : 'user';

    // 2. TẠO CHÌA KHÓA LƯU TRỮ RIÊNG CHO TỪNG TÀI KHOẢN
    const chatKey = `chatMessages_${userId}`;
    const productKey = `chatProducts_${userId}`;
    const openKey = `chatIsOpen_${userId}`;
    const collapseKey = `chatListCollapsed_${userId}`;

    // 3. KHỞI TẠO STATE
    const [messages, setMessages] = useState(() => {
        const storage = isLoggedIn ? localStorage : sessionStorage;
        const saved = storage.getItem(chatKey);
        // Đổi câu chào một chút nếu là Admin
        const defaultGreeting = userRole === 'admin' 
            ? 'Xin chào Quản trị viên! Anh/chị cần xem thống kê doanh thu hay top bán chạy hôm nay không?'
            : 'Xin chào! Mình là trợ lý AI. Bạn đang tìm dòng sản phẩm nào?';
        return saved ? JSON.parse(saved) : [{ sender: 'ai', type: 'text', text: defaultGreeting }];
    });
    
    const [suggestedProducts, setSuggestedProducts] = useState(() => {
        const storage = isLoggedIn ? localStorage : sessionStorage;
        const saved = storage.getItem(productKey);
        return saved ? JSON.parse(saved) : [];
    });

    const [isOpen, setIsOpen] = useState(() => {
        const storage = isLoggedIn ? localStorage : sessionStorage;
        const saved = storage.getItem(openKey);
        return saved === 'true';
    });
    
    const [isListCollapsed, setIsListCollapsed] = useState(() => {
        const storage = isLoggedIn ? localStorage : sessionStorage;
        const saved = storage.getItem(collapseKey);
        return saved === 'true';
    });

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // 1. XÓA DANH SÁCH KHI VÀO TRANG GIỎ HÀNG (Giữ nguyên của bạn)
    useEffect(() => {
        if (window.location.pathname.includes('/cart')) {
            setSuggestedProducts([]);
            const storage = isLoggedIn ? localStorage : sessionStorage;
            storage.removeItem(productKey);
        }
    }, [isLoggedIn, productKey]);

    // ==============================================================
    // 2. THÊM MỚI: LẮNG NGHE SỰ KIỆN ĐĂNG XUẤT HOẶC ĐỔI TÀI KHOẢN
    // ==============================================================
    useEffect(() => {
        const storage = isLoggedIn ? localStorage : sessionStorage;
        
        const savedMessages = storage.getItem(chatKey);
        const savedProducts = storage.getItem(productKey);
        const savedOpen = storage.getItem(openKey);
        const savedCollapse = storage.getItem(collapseKey);
        
        const defaultGreeting = userRole === 'admin' 
            ? 'Xin chào Quản trị viên! Anh/chị cần xem thống kê doanh thu hay top bán chạy hôm nay không?'
            : 'Xin chào! Mình là trợ lý AI. Bạn đang tìm dòng sản phẩm nào?';

        // Cập nhật lại giao diện Chatbot ngay khi tài khoản thay đổi
        setMessages(savedMessages ? JSON.parse(savedMessages) : [{ sender: 'ai', type: 'text', text: defaultGreeting }]);
        setSuggestedProducts(savedProducts ? JSON.parse(savedProducts) : []);
        setIsOpen(savedOpen === 'true');
        setIsListCollapsed(savedCollapse === 'true');

        // Ép dọn dẹp sạch sẽ nếu phát hiện người dùng vừa Đăng xuất (Thành guest)
        if (!isLoggedIn) {
            setSuggestedProducts([]);
            setIsOpen(false);
            setIsListCollapsed(false);
        }
    }, [userId, isLoggedIn, chatKey, productKey, openKey, collapseKey, userRole]); 

    // ==============================================================
    // 3. LƯU LẠI MỖI KHI CÓ THAY ĐỔI (Giữ nguyên của bạn)
    // ==============================================================
    useEffect(() => { 
        const storage = isLoggedIn ? localStorage : sessionStorage;
        storage.setItem(chatKey, JSON.stringify(messages)); 
    }, [messages, isLoggedIn, chatKey]);

    useEffect(() => { 
        const storage = isLoggedIn ? localStorage : sessionStorage;
        storage.setItem(productKey, JSON.stringify(suggestedProducts)); 
    }, [suggestedProducts, isLoggedIn, productKey]);

    useEffect(() => { 
        const storage = isLoggedIn ? localStorage : sessionStorage;
        storage.setItem(openKey, isOpen); 
    }, [isOpen, isLoggedIn, openKey]);

    useEffect(() => { 
        const storage = isLoggedIn ? localStorage : sessionStorage;
        storage.setItem(collapseKey, isListCollapsed); 
    }, [isListCollapsed, isLoggedIn, collapseKey]);
    
    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { sender: 'user', type: 'text', text: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const chatHistory = messages.map(msg => `${msg.sender === 'user' ? 'Khách hàng' : 'AI'}: ${msg.text}`).join('\n');
            const response = await axios.post('http://localhost:5000/api/chat', { 
                message: input, 
                history: chatHistory,
                currentPath: window.location.pathname,
                role: userRole // GỬI ROLE LÊN BACKEND ĐỂ NHẬN DIỆN ADMIN
            });
            const data = response.data;
            let finalAiMessage = data.message;

            // ==========================================
            // XỬ LÝ DỮ LIỆU ĐẶC THÙ CHO ADMIN
            // ==========================================
            if (data.type === 'admin_chart' && data.data) {
                finalAiMessage = `${data.message}\n💰 Tổng doanh thu: **${data.data.totalRevenue.toLocaleString('vi-VN')}đ**\n📦 Số đơn thành công: **${data.data.orderCount}**`;
            }
            if (data.type === 'admin_predict') {
                finalAiMessage = `💡 **Dự báo**: ${data.message}\n🚀 **Đề xuất**: ${data.suggestion}`;
            }
            if (data.type === 'admin_general_stats' && data.data) {
                if (data.statType !== 'all') {
                    // Nếu hỏi riêng lẻ, chỉ hiện câu trả lời ngắn gọn từ Backend
                    finalAiMessage = data.message;
                } else {
                    // Nếu hỏi tổng quát, hiện cái "Dashboard thu nhỏ" như cũ
                    finalAiMessage = `${data.message}
                    👥 Người dùng: **${data.data.users}**
                    📦 Sản phẩm: **${data.data.products}**
                    📑 Đơn hàng: **${data.data.orders}**
                    🎟️ Mã giảm giá: **${data.data.discounts}**`;
                }
            }

            // ==========================================
            // XỬ LÝ LOGIC UI & GIỎ HÀNG (DÀNH CHO USER VÀ ADMIN NẾU CẦN)
            // ==========================================
            if (data.type === 'form' && data.products) {
                setSuggestedProducts(data.products);
                setIsListCollapsed(false); 
            }

            if (data.type === 'collapse_list') {
                setIsListCollapsed(true);
                finalAiMessage = "Dạ, em đã thu gọn danh sách sang lề trái rồi ạ.";
            }
            if (data.type === 'expand_list') {
                setIsListCollapsed(false);
                finalAiMessage = "Dạ, em đã mở rộng danh sách lại rồi ạ.";
            }
            if (data.type === 'close_list') {
                setSuggestedProducts([]);
                setIsListCollapsed(false);
                finalAiMessage = "Dạ, em đã đóng bảng sản phẩm rồi ạ.";
            }

            if (data.type === 'view_detail') {
                const pIndex = data.index - 1;
                const targetP = suggestedProducts[pIndex];
                
                if (targetP) {
                    finalAiMessage = `Dạ, em đang mở trang chi tiết sản phẩm số ${data.index}...`;
                    const productPath = targetP.slug ? `/product/${targetP.slug}` : `/product/${targetP._id}`;
                    setTimeout(() => { navigate(productPath); }, 1000);
                } else {
                    finalAiMessage = `Dạ em tìm không thấy sản phẩm số ${data.index} trong danh sách hiện tại. Bạn xem lại số trên bảng giúp em nhé!`;
                }
            }

            if (data.type === 'add_by_index') {
                const productIndex = data.index - 1;
                const targetProduct = suggestedProducts[productIndex];
                if (targetProduct) {
                    try {
                        const defaultVariant = (targetProduct.variants && targetProduct.variants.length > 0) ? targetProduct.variants[0]._id : null;
                        await OrderAPI.addToCart({ productId: targetProduct._id, variantId: defaultVariant, quantity: 1 });
                        toast.success(`🛒 Đã thêm [${targetProduct.name}] vào giỏ!`);
                        finalAiMessage = `Dạ, em đã thêm sản phẩm số ${data.index} vào giỏ hàng rồi ạ. Bạn muốn tính tiền luôn không ạ?`;
                    } catch (err) {
                        finalAiMessage = "Lỗi hệ thống, không thêm được sản phẩm.";
                    }
                }
            }

            if (data.type === 'cart_success' && data.product) {
                try {
                    const defaultVariant = (data.product.variants && data.product.variants.length > 0) ? data.product.variants[0]._id : null;
                    await OrderAPI.addToCart({ productId: data.product._id, variantId: defaultVariant, quantity: 1 });
                    toast.success(`🛒 Đã thêm [${data.product.name}] vào giỏ hàng!`);
                } catch (error) {
                    toast.error("Lỗi khi thêm vào giỏ hàng!");
                }
            }

            if (data.type === 'checkout') {
                toast.info("🔄 Đang chuyển hướng đến trang Thanh toán...");
                setTimeout(() => { window.location.href = '/cart'; }, 1500);
            }

            setMessages(prev => [...prev, { sender: 'ai', type: data.type, text: finalAiMessage }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'ai', type: 'text', text: 'Hệ thống đang bận, vui lòng thử lại!' }]);
        }
        setLoading(false);
    };

    return (
        <Fragment>
            {isOpen && suggestedProducts.length > 0 && (
                <div style={{ 
                    position: 'fixed', top: '80px', bottom: '40px', left: '40px', 
                    overflowY: 'auto', background: '#fff', borderRadius: '15px', 
                    border: '1px solid #e0e0e0', fontFamily: 'sans-serif', zIndex: 99998,
                    transition: 'all 0.3s ease',
                    width: isListCollapsed ? '45px' : '55vw',
                    padding: isListCollapsed ? '15px 5px' : '30px',
                    boxShadow: isListCollapsed ? '0 4px 10px rgba(0,0,0,0.1)' : '0 10px 40px rgba(0,0,0,0.2)' 
                }}>
                    <div style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        margin: '0 0 20px 0', 
                        borderBottom: isListCollapsed ? 'none' : '2px solid #0084ff', 
                        paddingBottom: isListCollapsed ? '0' : '10px', 
                        flexDirection: isListCollapsed ? 'column' : 'row', 
                        gap: '8px' 
                    }}>
                        <h4 style={{ margin: 0, fontSize: '18px', color: '#333', display: isListCollapsed ? 'none' : 'block' }}>
                            📋 Kết quả từ AI
                        </h4>
                        
                        <div style={{ display: 'flex', gap: '5px', flexDirection: isListCollapsed ? 'column-reverse' : 'row', width: isListCollapsed ? '100%' : 'auto' }}>
                            {/* Nút Thu gọn / Mở rộng */}
                            <button 
                                onClick={() => setIsListCollapsed(!isListCollapsed)}
                                style={{ background: isListCollapsed ? '#0084ff' : '#f1f0f0', border: isListCollapsed ? 'none' : '1px solid #ccc', padding: isListCollapsed ? '8px 0' : '5px 10px', borderRadius: '5px', fontSize: '13px', cursor: 'pointer', color: isListCollapsed ? '#fff' : '#333', fontWeight: 'bold', width: '100%', textAlign: 'center' }}
                            >
                                {isListCollapsed ? '[>>]' : 'Thu gọn [<<]'}
                            </button>
                            <button 
                                onClick={() => {
                                    setSuggestedProducts([]);
                                    setIsListCollapsed(false);
                                }}
                                style={{ background: '#e74c3c', border: 'none', padding: isListCollapsed ? '8px 0' : '5px 10px', borderRadius: '5px', fontSize: '13px', cursor: 'pointer', color: '#fff', fontWeight: 'bold', width: '100%', textAlign: 'center' }}
                                title="Đóng hẳn bảng này"
                            >
                                {isListCollapsed ? '✖' : 'Đóng [X]'}
                            </button>
                        </div>
                    </div>

                    {!isListCollapsed && suggestedProducts.map((p, i) => {
                        const displayImage = (p.images && p.images.length > 0) ? (typeof p.images[0] === 'object' ? p.images[0].url : p.images[0]) : p.image_url;
                        return (
                            <div key={p._id} style={{ display: 'flex', gap: '20px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px dashed #ddd', alignItems: 'center' }}>
                                <div style={{ fontSize: '30px', fontWeight: '900', color: '#e74c3c', width: '50px', textAlign: 'center' }}>
                                    {i + 1}
                                </div>
                                <div onClick={() => window.location.href = `/product/${p.slug}`} style={{ display: 'flex', gap: '20px', flex: 1, cursor: 'pointer' }}>
                                    <img src={displayImage || "https://via.placeholder.com/100"} alt={p.name} style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #eee' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{p.name}</div>
                                        <div style={{ color: '#e74c3c', fontSize: '16px', fontWeight: 'bold', marginTop: '6px' }}>{p.price.toLocaleString('vi-VN')}đ</div>
                                        <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>{p.description || "Đang cập nhật..."}</div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {isListCollapsed && suggestedProducts.map((_, i) => (
                        <div key={i} style={{ fontSize: '14px', fontWeight: '900', color: '#e74c3c', textAlign: 'center', marginBottom: '10px' }}>{i + 1}</div>
                    ))}
                </div>
            )}

            <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {isOpen && (
                    <div style={{ 
                        width: '380px', border: '1px solid #e0e0e0', padding: '15px', borderRadius: '15px', background: '#fff', 
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)', marginBottom: '15px', fontFamily: 'sans-serif'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
                                🤖 Trợ lý AI {isUserAdmin ? '(Quản trị)' : ''}
                            </h3>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✖</button>
                        </div>
                        <div style={{ height: '350px', overflowY: 'auto', marginBottom: '15px', whiteSpace: 'pre-line' }}>
                            {messages.map((msg, index) => (
                                <div key={index} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '12px 0' }}>
                                    <div style={{
                                        display: 'inline-block', padding: '10px 15px', maxWidth: '80%', background: msg.sender === 'user' ? '#0084ff' : '#f1f0f0',
                                        color: msg.sender === 'user' ? '#fff' : '#333', borderRadius: '15px', textAlign: 'left', fontSize: '14px', lineHeight: '1.4'
                                    }}>
                                        {/* Sử dụng dangerouslySetInnerHTML để render các thẻ in đậm Markdown do AI trả về */}
                                        <span dangerouslySetInnerHTML={{__html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}}></span>
                                    </div>
                                </div>
                            ))}
                            {loading && <div style={{ textAlign: 'left', fontStyle: 'italic', color: '#888', fontSize: '12px' }}>AI đang suy nghĩ...</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', fontSize: '14px' }}
                                placeholder="Nhập yêu cầu..."
                            />
                            <button onClick={sendMessage} style={{ background: '#0084ff', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Gửi</button>
                        </div>
                    </div>
                )}
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ width: '60px', height: '60px', borderRadius: '50%', background: isOpen ? '#e74c3c' : '#0084ff', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {isOpen ? '✖' : '💬'}
                </button>
            </div>
        </Fragment>
    );
};

export default Chatbot;