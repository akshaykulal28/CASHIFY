const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    ImageUrl: {
        type: String,
        required: true
    },
    Title: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Service', serviceSchema);