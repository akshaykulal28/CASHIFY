const router = require('express').Router();
const Order = require('../models/Order');
const { generateGstInvoiceAttachment, sendOrderConfirmationEmail, sendDeliveryStatusEmail } = require('../utils/mailService');





router.post('/add', async (req, res) => {
    try {
        
        // if (!productId || !quantity) {
        //     return res.status(400).json({ message: 'Product ID and quantity are required.' });
        // }


        const { quantity, name, productId, price, totalAmount, stripeSessionId, paymentStatus, customerEmail, shippingAddress } = req.body;

        const requiredAddressFields = ['fullName', 'street', 'city', 'state', 'postalCode', 'country'];
        const normalizedAddress = requiredAddressFields.reduce((accumulator, field) => {
            accumulator[field] = typeof shippingAddress?.[field] === 'string' ? shippingAddress[field].trim() : '';
            return accumulator;
        }, {});

        if (!quantity || !name || !productId || !price) {
            return res.status(400).json({ message: 'quantity, name, productId and price are required.' });
        }

        const missingAddressField = requiredAddressFields.find((field) => !normalizedAddress[field]);
        if (missingAddressField) {
            return res.status(400).json({ message: 'shippingAddress is required.' });
        }

        if (stripeSessionId) {
            const existingOrder = await Order.findOne({ stripeSessionId, productId });
            if (existingOrder) {
                return res.status(200).json({
                    message: 'Order already exists for this payment session.',
                    order: existingOrder,
                });
            }
        }
        
        const newOrder = new Order({
            quantity,
            name,
            productId,
            price,
            totalAmount,
            stripeSessionId,
            paymentStatus,
            deliveryStatus: 'pending',
            customerEmail,
            shippingAddress: normalizedAddress,
        });
        await newOrder.save();
        res.status(201).json({ message: 'Order created successfully.', order: newOrder });
    }
    catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

router.post('/send-confirmation', async (req, res) => {
    try {
        const { stripeSessionId, customerEmail, currency = 'INR' } = req.body;
        console.info(`[order] send-confirmation requested. sessionId=${stripeSessionId || 'missing'}`);

        if (!stripeSessionId) {
            return res.status(400).json({ message: 'stripeSessionId is required.' });
        }

        const alreadySent = await Order.exists({
            stripeSessionId,
            confirmationEmailSent: true,
        });

        if (alreadySent) {
            console.info(`[order] send-confirmation skipped. reason=already-sent sessionId=${stripeSessionId}`);
            return res.status(200).json({ message: 'Confirmation email already sent for this payment session.' });
        }

        const sessionOrders = await Order.find({ stripeSessionId }).sort({ createdAt: 1 });
        if (!sessionOrders.length) {
            console.warn(`[order] send-confirmation failed. reason=no-orders sessionId=${stripeSessionId}`);
            return res.status(404).json({ message: 'No orders found for this payment session.' });
        }

        const to = customerEmail || sessionOrders.find((order) => order.customerEmail)?.customerEmail;
        if (!to) {
            console.warn(`[order] send-confirmation failed. reason=missing-recipient sessionId=${stripeSessionId}`);
            return res.status(400).json({ message: 'Customer email is required to send confirmation.' });
        }

        const computedTotal = sessionOrders.reduce((sum, order) => {
            return sum + (Number(order.price || 0) * Number(order.quantity || 0));
        }, 0);
        let attachments = [];

        try {
            const invoiceAttachment = await generateGstInvoiceAttachment({
                orders: sessionOrders,
                sessionId: stripeSessionId,
                currency,
                totalAmount: computedTotal,
            });

            attachments = [invoiceAttachment];
            console.info(`[order] GST invoice generated. sessionId=${stripeSessionId} bytes=${invoiceAttachment.content?.length || 0}`);
        } catch (invoiceError) {
            console.error(`[order] GST invoice generation failed. sessionId=${stripeSessionId}`, invoiceError);
        }

        await sendOrderConfirmationEmail({
            to,
            orders: sessionOrders,
            sessionId: stripeSessionId,
            currency,
            totalAmount: computedTotal,
            attachments,
        });
        console.info(`[order] send-confirmation success. sessionId=${stripeSessionId} recipient=${to}`);

        await Order.updateMany(
            { stripeSessionId },
            { $set: { confirmationEmailSent: true } }
        );

        return res.status(200).json({ message: 'Confirmation email sent successfully.' });
    } catch (err) {
        console.error('Send confirmation email error:', err);
        const message = String(err?.message || '');
        const isTransportFailure = /smtp|socket|timeout|connection|unable to send order confirmation email/i.test(message);
        if (isTransportFailure) {
            return res.status(202).json({
                message: 'Order placed successfully. Confirmation email is delayed. Please check your inbox shortly.',
                emailDelayed: true,
            });
        }

        return res.status(500).json({ message: 'Failed to send confirmation email.' });
    }
});

router.get('/session-status/:stripeSessionId', async (req, res) => {
    try {
        const { stripeSessionId } = req.params;
        if (!stripeSessionId) {
            return res.status(400).json({ message: 'stripeSessionId is required.' });
        }

        const sessionOrders = await Order.find({ stripeSessionId }).sort({ createdAt: 1 });
        const confirmationEmailSent = sessionOrders.some((order) => order.confirmationEmailSent);
        const paymentStatus = sessionOrders.find((order) => order.paymentStatus)?.paymentStatus || null;
        const customerEmail = sessionOrders.find((order) => order.customerEmail)?.customerEmail || null;

        return res.status(200).json({
            stripeSessionId,
            orderCount: sessionOrders.length,
            confirmationEmailSent,
            paymentStatus,
            customerEmail,
        });
    } catch (err) {
        console.error('Session status lookup error:', err);
        return res.status(500).json({ message: 'Unable to fetch session status.' });
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


router.get('/user/dashboard/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const customerEmail = String(req.query.email || '').trim().toLowerCase();

        const filters = [];
        if (userId) {
            filters.push({ userId });
        }
        if (customerEmail) {
            filters.push({ customerEmail });
        }

        const query = filters.length ? { $or: filters } : {};
        const orders = await Order.find(query).sort({ createdAt: -1 });

        const totalOrders = orders.length;

        const totalSpent = orders.reduce((sum, order) => {
            const amount = Number(order.totalAmount);
            if (Number.isFinite(amount) && amount > 0) {
                return sum + amount;
            }
            return sum + (Number(order.price || 0) * Number(order.quantity || 0));
        }, 0);

        let totalProducts = 0;
        orders.forEach((order) => {
            if (Array.isArray(order.items)) {
                order.items.forEach((item) => {
                    totalProducts += Number(item.quantity || 0);
                });
                return;
            }
            totalProducts += Number(order.quantity || 0);
        });

        const delivered = orders.filter((o) => o.status === 'Delivered' || o.deliveryStatus === 'delivered').length;

        const cancelled = orders.filter((o) => o.status === 'Cancelled' || o.paymentStatus === 'cancelled').length;

        const pending = orders.filter((o) => {
            return (
                o.status === 'Placed' ||
                o.status === 'Preparing' ||
                o.status === 'Out for Delivery' ||
                o.deliveryStatus === 'pending' ||
                o.deliveryStatus === 'shipped'
            );
        }).length;

        const statusChart = [
            { name: 'Delivered', value: delivered },
            { name: 'Pending', value: pending },
            { name: 'Cancelled', value: cancelled },
        ];

        const monthMap = {};
        orders.forEach((order) => {
            const month = new Date(order.createdAt).toLocaleString('default', { month: 'short' });
            const amount = Number(order.totalAmount);
            const safeAmount = Number.isFinite(amount) && amount > 0
                ? amount
                : (Number(order.price || 0) * Number(order.quantity || 0));
            monthMap[month] = (monthMap[month] || 0) + safeAmount;
        });

        const monthChart = Object.keys(monthMap).map((month) => ({
            month,
            amount: monthMap[month],
        }));

        res.json({
            totalOrders,
            totalProducts,
            totalSpent,
            delivered,
            pending,
            cancelled,
            statusChart,
            monthChart,
            recentOrders: orders.slice(0, 5),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});





router.patch('/update-delivery-status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryStatus } = req.body;

        if (!orderId || !deliveryStatus) {
            return res.status(400).json({ message: 'orderId and deliveryStatus are required.' });
        }

        const validStatuses = ['pending', 'shipped', 'delivered'];
        if (!validStatuses.includes(deliveryStatus)) {
            return res.status(400).json({ message: 'Invalid delivery status. Must be pending, shipped, or delivered.' });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { deliveryStatus },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Send email  customer
        if (order.customerEmail) {
            try {
                await sendDeliveryStatusEmail({
                    to: order.customerEmail,
                    orderName: order.name,
                    deliveryStatus,
                });
            } catch (emailErr) {
                console.error('Failed to send delivery status email:', emailErr);
                
            }
        }

        return res.status(200).json({ message: `Order status updated to ${deliveryStatus} and email sent.`, order });
    } catch (err) {
        console.error('Update delivery status error:', err);
        return res.status(500).json({ message: 'Failed to update delivery status.' });
    }
});



router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Order.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Order not found.' });
        res.status(200).json({ message: 'Order deleted successfully.' });
    }
        catch (err) {   
        console.error('Delete order error:', err);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});



router.get('/dashboard/status-chart', async (req, res) => {
    try {
        const orders = await Order.find();

        delivered = orders.filter((o) => o.status === 'Delivered' || o.deliveryStatus === 'delivered').length;

        cancelled = orders.filter((o) => o.status === 'Cancelled' || o.paymentStatus === 'cancelled').length;

        pending = orders.filter((o) => {
            return (
                o.status === 'Placed' ||
                o.status === 'Preparing' ||
                o.status === 'Out for Delivery' ||
                o.deliveryStatus === 'pending' ||
                o.deliveryStatus === 'shipped'
            );
        }).length;

        const statusChart = [
            { name: 'Delivered', value: delivered },
            { name: 'Pending', value: pending },
            { name: 'Cancelled', value: cancelled },
        ];

        res.json({
            statusChart,
            delivered,
            pending,
            cancelled,
        });
    }
       
        catch (err) {
        res.status(500).json({ error: err.message });
    }
});





module.exports = router;