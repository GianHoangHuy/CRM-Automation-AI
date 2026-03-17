const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Bảo vệ các route - chỉ người dùng đã đăng nhập mới có thể truy cập
const protect = (required = true) => async (req, res, next) => {
    try {
        if (req.user && req.user._id) {
            if (req.user.isBlocked) return res.status(403).json({ message: 'Tài khoản của bạn đã bị chặn' });
            return next();
        }

        // JWT flow
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            const token = req.headers.authorization.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('+tokenInvalidBefore -password');

                if (!user) {
                    if (required) return res.status(401).json({ message: 'Người dùng không tồn tại' });
                    return next();
                }

                if (user.isBlocked) return res.status(403).json({ message: 'Tài khoản của bạn đã bị chặn' });

                if (user.tokenInvalidBefore && decoded && decoded.iat) {
                    const tokenIatMs = decoded.iat * 1000;
                    if (user.tokenInvalidBefore.getTime() > tokenIatMs) {
                        if (required) return res.status(401).json({ message: 'Token đã bị thu hồi, vui lòng đăng nhập lại' });
                        return next();
                    }
                }

                req.user = user;
                return next();
            } catch (err) {
                if (required) return res.status(401).json({ message: 'Không được phép, token không hợp lệ' });
                return next();
            }
        }

        // Session flow
        if (req.session && req.session.userId) {
            try {
                const user = await User.findById(req.session.userId).select('-password');

                if (!user) {
                    if (required) return res.status(401).json({ message: 'Người dùng không tồn tại (session)' });
                    return next();
                }

                if (user.isBlocked) return res.status(403).json({ message: 'Tài khoản của bạn đã bị chặn' });
                req.user = user;
                return next();
            } catch (err) {
                if (required) return res.status(401).json({ message: 'Không được phép (session)' });
                return next();
            }
        }
        if (required) return res.status(401).json({ message: 'Không có token, từ chối truy cập' });
        return next();
    } catch (error) {
        if (required) return res.status(401).json({ message: 'Không được phép truy cập' });
        return next();
    }
};

// Chỉ admin mới có thể truy cập
const adminOnly = (req, res, next) => {
    if (req.user && req.user.isAdmin) return next();
    return res.status(403).json({ message: 'Chỉ admin mới được truy cập' });
};

module.exports = { protect, adminOnly };