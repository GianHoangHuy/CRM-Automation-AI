const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const addressSchema = new mongoose.Schema({
    phone: { type: String, default: '' },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
}, {timestamps: true});

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },

        email: {
            type: String,
            required: true,
            unique: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Vui lòng nhập đúng định dạng email',
            ],
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false, // không trả về password khi query
        },

        isAdmin: { type: Boolean, required: true, default: false },
        isBlocked: { type: Boolean, required: true, default: false },
        addresses: { type: [addressSchema] },
        loyaltyPoints: { type: Number, default: 0 },
        resetPasswordToken: { type: String, select: false },
        resetPasswordExpire: { type: Date, select: false },
        tokenInvalidBefore: { type: Date, select: false }
    },{ timestamps: true, }
);

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// So sánh mật khẩu nhập vào với mật khẩu đã mã hóa
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Tạo token đặt lại mật khẩu
userSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;