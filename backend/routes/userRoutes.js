const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const {
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
} = require('../controllers/userController');

// Đăng ký và đăng nhập
router.post('/register', registerUser);
router.post('/login', loginUser);

// Đăng nhập băng google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login-failed' }),
        (req, res) => {
            res.redirect(`http://localhost:3000/login-success?token=${req.user.token}`);
        }
);

// Lấy dữ liệu cho tài khoản đăng nhập bằng google
router.get('/me', protect(), async (req, res) => {
    res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin
    });
});

// Xử lý lỗi đăng nhập OAuth
router.get('/login-failed', (req, res) => res.status(401).json({ message: 'Đăng nhập thất bại!' }));

// Hồ sơ người dùng
router.get('/profile', protect(true), getUserProfile);
router.put('/profile', protect(true), updateUserProfile);

// Đổi mật khẩu - Quên mật khẩu - Đặt lại mật khẩu
router.put('/change-password', protect(true), changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Quản lý địa chỉ
router.get('/addresses', protect(true), getAddresses);
router.post('/addresses', protect(true), addAddress);
router.put('/addresses/:id', protect(true), updateAddress);
router.delete('/addresses/:id', protect(true), deleteAddress);
router.put('/addresses/default/:id', protect(true), setDefaultAddress);

// Đăng xuất
router.post('/logout', protect(true), async(req, res) => {
    try {
        let userId = null;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (err) {}
        }

        if (!userId && req.session && req.session.userId) {
            userId = req.session.userId;
        }

        if (userId) {
            await User.findByIdAndUpdate(userId, { tokenInvalidBefore: new Date() });
        }

        if (req.session) {
            req.session.destroy(err => {
                res.clearCookie('connect.sid');
                if (err) {
                    return res.status(500).json({ message: 'Đăng xuất thất bại' });
                }
                return res.json({ message: 'Đã đăng xuất' });
            });
        } else {
            return res.json({ message: 'Đã đăng xuất' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi đăng xuất' });
    }
});

module.exports = router;