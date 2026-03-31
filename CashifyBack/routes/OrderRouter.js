const router = require('express').Router();
const Order = require('../models/Order');
const { sendOrderConfirmationEmail } = require('../utils/mailService');





router.post('/add', async (req, res) => {
    try {
        
        // if (!productId || !quantity) {
        //     return res.status(400).json({ message: 'Product ID and quantity are required.' });
        // }


        const { quantity, name, productId, price, totalAmount, stripeSessionId, paymentStatus, customerEmail } = req.body;

        if (!quantity || !name || !productId || !price) {
            return res.status(400).json({ message: 'quantity, name, productId and price are required.' });
        }
        
        const newOrder = new Order({
            quantity,
            name,
            productId,
            price,
            totalAmount,
            stripeSessionId,
            paymentStatus,
            customerEmail,
        });
        await newOrder.save();
        res.status(201).json({ message: 'Order created successfully.', order: newOrder });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

router.post('/send-confirmation', async (req, res) => {
    try {
        const { stripeSessionId, customerEmail, currency = 'INR' } = req.body;

        if (!stripeSessionId) {
            return res.status(400).json({ message: 'stripeSessionId is required.' });
        }

        const alreadySent = await Order.exists({
            stripeSessionId,
            confirmationEmailSent: true,
        });

        if (alreadySent) {
            return res.status(200).json({ message: 'Confirmation email already sent for this payment session.' });
        }

        const sessionOrders = await Order.find({ stripeSessionId }).sort({ createdAt: 1 });
        if (!sessionOrders.length) {
            return res.status(404).json({ message: 'No orders found for this payment session.' });
        }

        const to = customerEmail || sessionOrders.find((order) => order.customerEmail)?.customerEmail;
        if (!to) {
            return res.status(400).json({ message: 'Customer email is required to send confirmation.' });
        }

        const computedTotal = sessionOrders.reduce((sum, order) => {
            return sum + (Number(order.price || 0) * Number(order.quantity || 0));
        }, 0);

        await sendOrderConfirmationEmail({
            to,
            orders: sessionOrders,
            sessionId: stripeSessionId,
            currency,
            totalAmount: computedTotal,
        });

        await Order.updateMany(
            { stripeSessionId },
            { $set: { confirmationEmailSent: true } }
        );

        return res.status(200).json({ message: 'Confirmation email sent successfully.' });
    } catch (err) {
        console.error('Send confirmation email error:', err);
        return res.status(500).json({ message: err.message || 'Failed to send confirmation email.' });
    }
});

router.get('/all', async (req,res) => {
    try {
        const order = await Order.find()
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error1', error: error.message });
    }
});



module.exports = router;