const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const generatePassword = require('../utils/generatePassword');

// Đăng ký người dùng
const registerUser = async(req, res) => {
    const { name, email, addresses } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Email đã tồn tại!' });

        const password = generatePassword(12);
        const user = await User.create({ name, email, password, addresses });

        if (user) {
            if (req.session) {
                req.session.userId = user._id;
                req.session.user = { id: user._id, email: user.email, name: user.name };
            }

            const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
            const html = `
                <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: auto; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
                  <div style="background:#0d6efd; color:#fff; padding:16px; text-align:center;">
                    <h2 style="margin:0;">E-Commerce Store</h2>
                    <p style="margin:4px 0;">Thông tin tài khoản mới</p>
                  </div>
                  <div style="padding:20px;">
                    <p>Xin chào <strong>${user.name || user.email}</strong>,</p>
                    <p>Tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập tạm thời:</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Mật khẩu tạm thời:</strong> <code style="background:#f1f1f1;padding:4px 6px;border-radius:4px;">${password}</code></p>
                    <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập để bảo mật tài khoản.</p>
                    <p style="text-align:center; margin:24px 0;">
                      <a href="${loginUrl}" style="background:#0d6efd;color:#fff;padding:12px 20px;text-decoration:none;border-radius:5px;font-weight:bold;">Đăng nhập</a>
                    </p>
                    <p>Nếu bạn không yêu cầu tạo tài khoản, vui lòng bỏ qua email này.</p>
                    <p>Trân trọng,<br/><strong>Đội ngũ E-Commerce Store</strong></p>
                  </div>
                  <div style="background:#f8f9fa; padding:10px; text-align:center; font-size:12px; color:#666;">
                    <p>© ${new Date().getFullYear()} E-Commerce Store. Mọi quyền được bảo lưu.</p>
                  </div>
                </div>
            `;
            try {
                await sendEmail({ to: user.email, subject: 'Thông tin tài khoản mới', html });
            } catch (sendErr) {
                console.error('[registerUser] sendEmail error', sendErr);
            }

            return res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                isBlocked: user.isBlocked,
                loyaltyPoints: user.loyaltyPoints,
                addresses: user.addresses,
                token: generateToken(user._id),
            });
        } else {
            return res.status(400).json({ message: 'Thông tin người dùng không hợp lệ.' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi tạo tài khoản' });
    }
};

// Đăng nhập người dùng
const loginUser = async(req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        if (user.isBlocked) return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa.' });
        if (await user.matchPassword(password)) {
            if (req.session) {
                req.session.userId = user._id;
                req.session.user = { id: user._id, email: user.email, name: user.name };
            }

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                isBlocked: user.isBlocked,
                loyaltyPoints: user.loyaltyPoints,
                addresses: user.addresses,
                token: generateToken(user._id),
            });
        } else {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
    }
};

// Lấy thông tin profile người dùng
const getUserProfile = async(req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });
        const defaultAddress = req.user.addresses.find(addr => addr.isDefault) || null;
        return res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            isAdmin: req.user.isAdmin,
            isBlocked: req.user.isBlocked,
            loyaltyPoints: req.user.loyaltyPoints,
            defaultAddress
        });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi xem thông tin người dùng' });
    }
};

// Cập nhật thông tin người dùng
const updateUserProfile = async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.name = req.body.name || user.name;
            
            if (req.body.email && req.body.email !== user.email) {
                const exists = await User.findOne({ email: req.body.email });
                if (exists) return res.status(400).json({ message: 'Email đã được sử dụng' });
                user.email = req.body.email;
            }

            if (req.body.addresses) {
                const defaultAddress = user.addresses.find(addr => addr.isDefault);
                if (defaultAddress) {
                    defaultAddress.phone = req.body.addresses.phone || defaultAddress.phone;
                    defaultAddress.street = req.body.addresses.street || defaultAddress.street;
                    defaultAddress.city = req.body.addresses.city || defaultAddress.city;
                    defaultAddress.country = req.body.addresses.country || defaultAddress.country;
                }
            }

            const updatedUser = await user.save();
            return res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
                isBlocked: updatedUser.isBlocked,
                loyaltyPoints: updatedUser.loyaltyPoints,
                defaultAddress: updatedUser.addresses.find(addr => addr.isDefault) || null,
                token: generateToken(updatedUser._id),
            });
        } else {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin người dùng' });
    }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user._id).select('+password');
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });
        if (!(await user.matchPassword(oldPassword))) return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
        user.password = newPassword;
        await user.save();
        return res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu' });
    }
};

// Quên mật khẩu - Gửi email
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Vui lòng nhập email' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng với email này' });

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        if (process.env.DEV_SEND_RESET_TOKEN === 'true') {
            return res.json({ 
                message: 'Token đặt lại mật khẩu (chỉ dành cho môi trường phát triển)',
                resetToken,
                resetUrl 
            });
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0d6efd; color: #fff; padding: 16px; text-align: center;">
                <h2 style="margin: 0;">E-Commerce Store</h2>
                <p style="margin: 4px 0;">Yêu cầu đặt lại mật khẩu</p>
            </div>

            <div style="padding: 20px;">
                <p>Xin chào <strong>${user.name || user.email}</strong>,</p>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                <p>Nhấn vào nút bên dưới để tạo mật khẩu mới. Liên kết sẽ hết hạn sau <strong>10 phút</strong>.</p>

                <div style="text-align:center; margin: 24px 0;">
                <a href="${resetUrl}" 
                    style="background-color:#0d6efd; color:white; padding:12px 20px; text-decoration:none; border-radius:5px; font-weight:bold;">
                    Đặt lại mật khẩu
                </a>
                </div>

                <p>Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết này vào trình duyệt:</p>
                <p style="word-break:break-all; background:#f8f9fa; padding:10px; border-radius:5px;">${resetUrl}</p>

                <p>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
                <p>Trân trọng,<br><strong>Đội ngũ E-Commerce Store</strong></p>
            </div>

            <div style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #666;">
                <p>© ${new Date().getFullYear()} E-Commerce Store. Mọi quyền được bảo lưu.</p>
            </div>
            </div>
            `;
        try {
            await sendEmail({
                to: user.email,
                subject: 'Yêu cầu đặt lại mật khẩu',
                html
            });
            return res.json({ message: 'Đã gửi email với hướng dẫn đặt lại mật khẩu' });
        } catch (sendErr) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            console.error('[forgotPassword] sendEmail error', sendErr);
            return res.status(500).json({ message: 'Không thể gửi email, vui lòng thử lại sau' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi gửi email để khôi phục mật khẩu' });
    }
};

// Đặt lại mật khẩu
const resetPassword = async (req, res) => {
    try {
        const rawToken = req.params.token;
        const { password: newPassword } = req.body;
        
        if (!newPassword) return res.status(400).json({ message: 'Vui lòng nhập mật khẩu mới' });
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        const token = generateToken ? generateToken(user._id) : null;
        if (req.session) {
            req.session.userId = user._id;
            req.session.user = { id: user._id, email: user.email, name: user.name };
        }
        return res.json({ message: 'Đặt lại mật khẩu thành công', token });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi gửi mật khẩu mới để khổi phục mật khẩu' });
    }
};

// Lấy danh sách địa chỉ
const getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });
        return res.json(user.addresses);
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server lấy danh sách địa chỉ' });
    }
};

// Thêm địa chỉ
const addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.addresses.push(req.body);
        await user.save();    
        return res.status(201).json(user.addresses);
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi thêm địa chỉ mới' });
    }
};

// Cập nhật địa chỉ
const updateAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const address = user.addresses.id(req.params.id);
        if (!address) return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
        Object.assign(address, req.body);
        await user.save();
        return res.json(address);
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin địa chỉ' });
    }
};

// Xóa địa chỉ
const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
        await user.save();
        return res.json({ message: 'Đã xóa địa chỉ' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi xóa địa chỉ' });
    }
};

// Đặt mặc định địa chỉ
const setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.addresses.forEach(addr => { addr.isDefault = false; });
        const address = user.addresses.id(req.params.id);
        if (!address) return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
        address.isDefault = true;
        await user.save();
        return res.json({ message: 'Đã đặt địa chỉ mặc định', addresses: user.addresses });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi cài đặt mặc định cho các địa chỉ' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    changePassword,
    updateUserProfile,
    forgotPassword,
    resetPassword,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};