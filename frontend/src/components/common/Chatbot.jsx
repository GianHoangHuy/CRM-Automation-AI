import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { OrderAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Chatbot = () => {
    const navigate = useNavigate();
    // 1. KIỂM TRA ĐĂNG NHẬP TỪ SESSION (Tắt trình duyệt là mất đăng nhập)
    const token = sessionStorage.getItem('token'); // Đổi tên 'token' cho khớp với web bạn nhé
    const isLoggedIn = !!token;

    // Lấy thông tin user để biết ID của họ là gì (Đổi 'user' cho khớp với key của bạn)
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const userId = currentUser._id || currentUser.id || 'guest'; 

    // 2. TẠO CHÌA KHÓA LƯU TRỮ RIÊNG CHO TỪNG TÀI KHOẢN
    // Vd: Đăng nhập thì key là 'chatMessages_abc123', chưa đăng nhập thì 'chatMessages_guest'
    const chatKey = `chatMessages_${userId}`;
    const productKey = `chatProducts_${userId}`;
    const openKey = `chatIsOpen_${userId}`;
    const collapseKey = `chatListCollapsed_${userId}`;

    // 3. KHỞI TẠO STATE
    const [messages, setMessages] = useState(() => {
        // Đã đăng nhập thì moi từ Local (Trí nhớ dài hạn). Chưa thì moi từ Session (Ngắn hạn)
        const storage = isLoggedIn ? localStorage : sessionStorage;
        const saved = storage.getItem(chatKey);
        return saved ? JSON.parse(saved) : [{ sender: 'ai', type: 'text', text: 'Xin chào! Mình là trợ lý AI. Bạn đang tìm dòng sản phẩm nào?' }];
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

    // XÓA DANH SÁCH KHI VÀO TRANG GIỎ HÀNG
    useEffect(() => {
        if (window.location.pathname.includes('/cart')) {
            setSuggestedProducts([]);
            const storage = isLoggedIn ? localStorage : sessionStorage;
            storage.removeItem(productKey);
        }
    }, [isLoggedIn, productKey]);

    // LƯU LẠI MỖI KHI CÓ THAY ĐỔI VÀO ĐÚNG KHO LƯU TRỮ CỦA TÀI KHOẢN ĐÓ
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
                currentPath: window.location.pathname
            });
            const data = response.data;
            let finalAiMessage = data.message;

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
                    
                    // Ưu tiên dùng slug, nếu database không có slug thì tự động rớt về _id
                    const productPath = targetP.slug ? `/product/${targetP.slug}` : `/product/${targetP._id}`;
                    
                    // Dùng navigate để chuyển trang mượt mà không reload web
                    setTimeout(() => { 
                        navigate(productPath); 
                    }, 1000);
                } else {
                    // Nếu khách chọn số không có thật trong bảng
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px 0', borderBottom: '2px solid #0084ff', paddingBottom: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '20px', color: '#333', display: isListCollapsed ? 'none' : 'block' }}>
                            📋 Sản phẩm đề xuất
                        </h4>
                        
                        <button 
                            onClick={() => setIsListCollapsed(true)}
                            style={{ background: '#f1f0f0', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '5px', fontSize: '13px', cursor: 'pointer', color: '#333', display: isListCollapsed ? 'none' : 'block', fontWeight: 'bold' }}
                        >
                            Thu gọn {'[<<]'}
                        </button>

                        <button 
                            onClick={() => setIsListCollapsed(false)}
                            style={{ background: '#0084ff', border: 'none', padding: '10px 5px', borderRadius: '5px', fontSize: '13px', cursor: 'pointer', color: '#fff', display: isListCollapsed ? 'block' : 'none', width: '100%', textAlign: 'center', fontWeight: 'bold' }}
                        >
                            {'[>>]'}
                        </button>
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
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>🤖 Trợ lý AI</h3>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✖</button>
                        </div>
                        <div style={{ height: '350px', overflowY: 'auto', marginBottom: '15px' }}>
                            {messages.map((msg, index) => (
                                <div key={index} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '12px 0' }}>
                                    <div style={{
                                        display: 'inline-block', padding: '10px 15px', maxWidth: '80%', background: msg.sender === 'user' ? '#0084ff' : '#f1f0f0',
                                        color: msg.sender === 'user' ? '#fff' : '#333', borderRadius: '15px', textAlign: 'left', fontSize: '14px', lineHeight: '1.4'
                                    }}>
                                        {msg.text}
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