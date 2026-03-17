const mongoose = require('mongoose');

const pointRuleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên quy tắc (VD: Mua hàng trên 500k)'],
        trim: true
    },
    eventType: {
        type: String,
        enum: ['view', 'click', 'add_to_cart', 'purchase', 'review'],
        required: true
    },
    conditions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    pointsReward: {
        type: Number,
        required: [true, 'Vui lòng nhập số điểm thưởng'],
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        default: null
    }
}, { 
    timestamps: true 
});

const PointRule = mongoose.model('PointRule', pointRuleSchema);
module.exports = PointRule;