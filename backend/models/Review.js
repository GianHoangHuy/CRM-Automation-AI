const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    guestName: { type: String },
    guestEmail: { type: String },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, require: true }
},{ timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;