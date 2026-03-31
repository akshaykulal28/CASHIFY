const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    quantity: {
        type: Number,
        required: true,
    },
    name:{
        type: String,
         required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    },
    price: {
        type: Number,
        required: true,
    },
    totalAmount: {
        type: Number,
    },
    customerEmail: {
        type: String,
        trim: true,
        lowercase: true,
    },
    stripeSessionId: {
        type: String,
    },
    paymentStatus: {
        type: String,
        default: 'paid',
    },
    confirmationEmailSent: {
        type: Boolean,
        default: false,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Order', orderSchema);