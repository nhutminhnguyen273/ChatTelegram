const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'stripe'],
        required: true,
        default: 'cash'
    },
    stripeSessionId: {
        type: String
    },
    stripePaymentIntentId: {
        type: String
    },
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'usd'
    },
    bookingDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', bookingSchema); 