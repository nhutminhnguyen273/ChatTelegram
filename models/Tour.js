const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    maxParticipants: {
        type: Number,
        required: true
    },
    currentParticipants: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Tour', tourSchema); 