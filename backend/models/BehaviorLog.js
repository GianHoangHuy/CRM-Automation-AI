const mongoose = require('mongoose');

const behaviorLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    sessionId: {
        type: String,
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: ['view', 'click', 'add_to_cart', 'purchase'],
        required: true
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null
    },

    metadata: {
        type: mongoose.Schema.Types.Mixed, 
        default: {}
    }
}, { 
    timestamps: true 
});

behaviorLogSchema.index({ user: 1, eventType: 1 });
behaviorLogSchema.index({ createdAt: -1 });

const BehaviorLog = mongoose.model('BehaviorLog', behaviorLogSchema);
module.exports = BehaviorLog;