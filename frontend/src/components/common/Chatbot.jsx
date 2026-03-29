import React, { useState } from 'react';
import axios from 'axios';

const Chatbot = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { sender: 'ai', type: 'text', text: 'Xin chào! Mình là trợ lý AI. Bạn đang tìm dòng sản phẩm nào?' }
    ]);
    const [loading, setLoading] = useState(false);
    
    // ĐÂY LÀ CHÌA KHÓA: State để quản lý việc ẩn/hiện popup chat
    const [isOpen, setIsOpen] = useState(false);

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
                history: chatHistory 
            });
            const data = response.data;

            setMessages(prev => [...prev, {
                sender: 'ai',
                type: data.type, 
                text: data.message,
                products: data.products 
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { 
                sender: 'ai', 
                type: 'text', 
                text: 'Xin lỗi, hệ thống chat đang gián đoạn. Vui lòng thử lại sau!' 
            }]);
        }
        setLoading(false);
    };

    return (
        // THẺ BỌC NGOÀI CÙNG: position 'fixed' giúp nó thoát khỏi bố cục trang và nổi lên trên mọi thứ
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            
            {/* KHUNG CHAT: Chỉ xuất hiện khi isOpen là true */}
            {isOpen && (
                <div style={{ 
                    width: '380px', border: '1px solid #e0e0e0', padding: '15px', 
                    borderRadius: '15px', background: '#fff', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)', // Đổ bóng cho hiệu ứng nổi
                    marginBottom: '15px',
                    fontFamily: 'sans-serif'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>🤖 Trợ lý AI</h3>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>
                            ✖
                        </button>
                    </div>
                    
                    <div style={{ height: '350px', overflowY: 'auto', marginBottom: '15px', paddingRight: '5px' }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '12px 0' }}>
                                <div style={{
                                    display: 'inline-block', padding: '10px 15px', maxWidth: '80%',
                                    background: msg.sender === 'user' ? '#0084ff' : '#f1f0f0',
                                    color: msg.sender === 'user' ? '#fff' : '#000',
                                    borderRadius: '15px', textAlign: 'left', fontSize: '14px', lineHeight: '1.4'
                                }}>
                                    {msg.text}
                                </div>

                                {msg.type === 'form' && msg.products && msg.products.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                        {msg.products.map(product => {
                                            const displayImage = (product.images && product.images.length > 0) ? product.images[0] : (product.image_url || 'https://via.placeholder.com/100');
                                            return (
                                                <div key={product._id} style={{ 
                                                    minWidth: '140px', maxWidth: '140px', border: '1px solid #eee', padding: '10px', 
                                                    borderRadius: '8px', background: '#fff', textAlign: 'center' 
                                                }}>
                                                    <img src={displayImage} alt={product.name} style={{ width: '100%', height: '90px', objectFit: 'contain', marginBottom: '5px' }} />
                                                    <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={product.name}>
                                                        {product.name}
                                                    </p>
                                                    <p style={{ fontSize: '13px', color: '#e74c3c', fontWeight: 'bold', margin: '5px 0' }}>
                                                        {product.price.toLocaleString('vi-VN')}đ
                                                    </p>
                                                    <button style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer', width: '100%', fontSize: '12px' }}>
                                                        Xem chi tiết
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && <div style={{ textAlign: 'left', fontStyle: 'italic', color: '#888', fontSize: '12px' }}>AI đang gõ...</div>}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', fontSize: '14px' }}
                            placeholder="Nhập yêu cầu..."
                        />
                        <button onClick={sendMessage} style={{ background: '#0084ff', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                            Gửi
                        </button>
                    </div>
                </div>
            )}

            {/* NÚT TRÒN FLOATING BUTTON */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: isOpen ? '#e74c3c' : '#0084ff',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}
            >
                {isOpen ? '✖' : '💬'}
            </button>
        </div>
    );
};

export default Chatbot;