const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên sản phẩm'],
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Vui lòng nhập mô tả sản phẩm']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: [true, 'Vui lòng nhập giá sản phẩm'],
        default: 0
    },

    images: [mongoose.Schema.Types.Mixed],

    variants: [{
        sku: String,
        name: String,
        price: Number,
        stock: Number,
        attributes: [{
            key: String,
            value: String
        }]
    }],
    rating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    numComments: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);