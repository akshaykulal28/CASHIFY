const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();
const ServiceRouter = require('./routes/ServiceRouter');
const productRoutes = require('./routes/productRoutes');
const OrderRouter = require('./routes/OrderRouter');
const PhoneSubmissionRouter = require('./routes/PhoneSubmissionRouter');
const Order = require('./models/Order');
const { sendOrderConfirmationEmail } = require('./utils/mailService');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = require('stripe')(stripeSecretKey);

//app.use(cors({ origin: "https://cashify-gamma.vercel.app" }));

const app = express();
const port = process.env.PORT || 3000;  

function logStartupEnvDiagnostics() {
  const requiredVars = ['MONGO_URI', 'STRIPE_SECRET_KEY', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const optionalButRecommended = ['CLIENT_URL', 'SERVER_URL', 'MAIL_FROM', 'STRIPE_WEBHOOK_SECRET'];

  const missingRequired = requiredVars.filter((name) => !process.env[name] && !(name === 'STRIPE_SECRET_KEY' && process.env.STIPE_SECRET_KEY));
  const missingOptional = optionalButRecommended.filter((name) => !process.env[name]);

  if (missingRequired.length) {
    console.error(`[startup] Missing required env vars: ${missingRequired.join(', ')}`);
  } else {
    console.info('[startup] Required env vars are present.');
  }

  if (missingOptional.length) {
    console.warn(`[startup] Optional env vars not set: ${missingOptional.join(', ')}`);
  }

  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  if (smtpSecure && smtpPort === 587) {
    console.warn('[startup] SMTP_SECURE=true with SMTP_PORT=587 may cause socket close errors. Use SMTP_SECURE=false for 587 or switch to 465 with secure=true.');
  }
  if (!smtpSecure && smtpPort === 465) {
    console.warn('[startup] SMTP_SECURE=false with SMTP_PORT=465 may cause TLS handshake failures. Use SMTP_SECURE=true for 465.');
  }
}

function getShippingAddressFromSession(session) {
  const metadata = session.metadata || {};
  const shippingAddress = {
    fullName: metadata.shippingFullName || '',
    street: metadata.shippingStreet || '',
    city: metadata.shippingCity || '',
    state: metadata.shippingState || '',
    postalCode: metadata.shippingPostalCode || '',
    country: metadata.shippingCountry || '',
  };

  const requiredAddressFields = ['fullName', 'street', 'city', 'state', 'postalCode', 'country'];
  const isValid = requiredAddressFields.every((field) => Boolean(String(shippingAddress[field] || '').trim()));
  return isValid ? shippingAddress : null;
}

logStartupEnvDiagnostics();

app.use(cors());

app.post('/api/payment/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripeSecretKey) {
      return res.status(500).send('Stripe is not configured on server.');
    }

    if (!stripeWebhookSecret) {
      console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is missing.');
      return res.status(500).send('Stripe webhook secret is not configured.');
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).send('Missing Stripe signature.');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error('[stripe-webhook] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type !== 'checkout.session.completed') {
      return res.status(200).json({ received: true, ignored: event.type });
    }

    const checkoutSession = event.data.object;
    const sessionId = checkoutSession.id;
    const enrichedSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    if (enrichedSession.payment_status !== 'paid') {
      console.warn(`[stripe-webhook] Received non-paid checkout completion. sessionId=${sessionId} status=${enrichedSession.payment_status}`);
      return res.status(200).json({ received: true, ignored: 'payment-not-paid' });
    }

    const customerEmail = enrichedSession.customer_details?.email || enrichedSession.customer_email || null;
    const shippingAddress = getShippingAddressFromSession(enrichedSession);
    const amountTotal = Number(enrichedSession.amount_total || 0) / 100;
    const lineItems = enrichedSession.line_items?.data || [];

    if (!lineItems.length) {
      console.warn(`[stripe-webhook] No line items found. sessionId=${sessionId}`);
      return res.status(200).json({ received: true, ignored: 'no-line-items' });
    }

    for (const lineItem of lineItems) {
      const productMetadata = lineItem.price?.product?.metadata || {};
      const productIdFromStripe = productMetadata.productId;
      const hasValidObjectId = mongoose.isValidObjectId(productIdFromStripe);
      const quantity = Number(lineItem.quantity || 1);
      const amountSubtotal = Number(lineItem.amount_subtotal || lineItem.amount_total || 0) / 100;
      const unitPrice = quantity > 0 ? amountSubtotal / quantity : 0;

      const selector = hasValidObjectId
        ? { stripeSessionId: sessionId, productId: productIdFromStripe }
        : { stripeSessionId: sessionId, name: lineItem.description };

      const orderPayload = {
        quantity,
        name: lineItem.description,
        price: unitPrice,
        totalAmount: amountTotal,
        stripeSessionId: sessionId,
        paymentStatus: enrichedSession.payment_status,
        customerEmail,
      };

      if (hasValidObjectId) {
        orderPayload.productId = productIdFromStripe;
      }

      if (shippingAddress) {
        orderPayload.shippingAddress = shippingAddress;
      }

      await Order.findOneAndUpdate(
        selector,
        {
          $setOnInsert: orderPayload,
          $set: {
            paymentStatus: enrichedSession.payment_status,
            totalAmount: amountTotal,
            customerEmail,
            ...(shippingAddress ? { shippingAddress } : {}),
          },
        },
        { upsert: true, new: true }
      );
    }

    const sessionOrders = await Order.find({ stripeSessionId: sessionId }).sort({ createdAt: 1 });
    const alreadySent = await Order.exists({ stripeSessionId: sessionId, confirmationEmailSent: true });

    if (!alreadySent && customerEmail && sessionOrders.length) {
      const computedTotal = sessionOrders.reduce((sum, order) => sum + (Number(order.price || 0) * Number(order.quantity || 0)), 0);
      await sendOrderConfirmationEmail({
        to: customerEmail,
        orders: sessionOrders,
        sessionId,
        currency: (enrichedSession.currency || 'inr').toUpperCase(),
        totalAmount: computedTotal,
      });

      await Order.updateMany(
        { stripeSessionId: sessionId },
        { $set: { confirmationEmailSent: true } }
      );
      console.info(`[stripe-webhook] Confirmation email sent. sessionId=${sessionId} recipient=${customerEmail}`);
    } else {
      console.info(`[stripe-webhook] Confirmation email skipped. sessionId=${sessionId} alreadySent=${Boolean(alreadySent)} hasCustomerEmail=${Boolean(customerEmail)} orderCount=${sessionOrders.length}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] Processing error:', err);
    return res.status(500).send('Webhook processing failed.');
  }
});

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI environment variable.');
  process.exit(1);
}
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));


  const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);



app.post('/api/auth/signup', async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if (!phone || !email || !password) {
      return res.status(400).json({ message: 'Phone, email and password are required.' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this phone number already exists.' });
    }

    const existingEmail = await User.findOne({ email: String(email).toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ phone, email: String(email).trim().toLowerCase(), password: hashedPassword });
    await user.save();

    res.status(201).json({
      message: 'Account created successfully!',
      user: { id: user._id, phone: user.phone, email: user.email },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required.' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone number or password.' });
    }

    res.status(200).json({
      message: 'Login successful!',
      user: { id: user._id, phone: user.phone, email: user.email || '' },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

app.get('/', (req, res) => {
  res.send('Cashify Backend is running.');
});

app.use("/uploads",express.static("uploads"));
app.use('/api/products', productRoutes);
app.use('/api/services', ServiceRouter);
app.use('/api/order', OrderRouter);
app.use('/api/phone-submission', PhoneSubmissionRouter);




app.post('/api/payment/create-payment-intent', async (req, res) => {
  try {
    if (!stripeSecretKey) {
      return res.status(500).json({ message: 'Stripe is not configured on server.' });
    }

    const { product, shippingAddress } = req.body;

    if (!Array.isArray(product) || product.length === 0) {
      return res.status(400).json({ message: 'Product list is required.' });
    }

    const requiredAddressFields = ['fullName', 'street', 'city', 'state', 'postalCode', 'country'];
    const normalizedAddress = requiredAddressFields.reduce((accumulator, field) => {
      accumulator[field] = typeof shippingAddress?.[field] === 'string' ? shippingAddress[field].trim() : '';
      return accumulator;
    }, {});

    const missingAddressField = requiredAddressFields.find((field) => !normalizedAddress[field]);
    if (missingAddressField) {
      return res.status(400).json({ message: 'Shipping address is required.' });
    }

    const lineItems = product.map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (!item.name || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0) {
        throw new Error('Invalid product payload.');
      }

      const imageUrl = item.imageurl || item.imageUrl || '';
      const productData = { name: item.name };
      if (imageUrl) {
        const serverUrl = (process.env.SERVER_URL || '').replace(/\/$/, '');
        const resolvedImageUrl = imageUrl.startsWith('http') || !serverUrl
          ? imageUrl
          : `${serverUrl}/uploads/${imageUrl}`;
        productData.images = [resolvedImageUrl];
      }

      return {
        price_data: {
          currency: 'inr',
          product_data: {
            ...productData,
            metadata: {
              productId: String(item._id || item.id || ''),
            },
          },
          unit_amount: Math.round(price * 100),
        },
        quantity,
      };
    });

    const clientUrl = (process.env.CLIENT_URL || 'https://cashify-gamma.vercel.app').replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      metadata: {
        shippingFullName: normalizedAddress.fullName,
        shippingStreet: normalizedAddress.street,
        shippingCity: normalizedAddress.city,
        shippingState: normalizedAddress.state,
        shippingPostalCode: normalizedAddress.postalCode,
        shippingCountry: normalizedAddress.country,
      },
      success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment-cancel`,
    });

    let checkoutUrl = session.url;
    if (!checkoutUrl) {
      const sessionWithUrl = await stripe.checkout.sessions.retrieve(session.id);
      checkoutUrl = sessionWithUrl.url;
    }

    return res.status(200).json({ id: session.id, url: checkoutUrl || null });
  } catch (err) {
    console.error('Stripe session creation error:', err.message);
    const statusCode = err.message === 'Invalid product payload.' ? 400 : 500;
    return res.status(statusCode).json({ message: statusCode === 400 ? err.message : 'Unable to start payment session.' });
  }
});


app.get('/api/payment/checkout-redirect/:sessionId', async (req, res) => {
  try {
    if (!stripeSecretKey) {
      return res.status(500).json({ message: 'Stripe is not configured on server.' });
    }

    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session?.url) {
      return res.status(400).json({ message: 'Checkout URL was not available for this session.' });
    }

    return res.redirect(303, session.url);
  } catch (err) {
    console.error('Stripe redirect error:', err.message);
    return res.status(500).json({ message: 'Unable to redirect to checkout.' });
  }
});


app.get('/api/payment/verify-session', async (req, res) => {
  try {
    if (!stripeSecretKey) {
      return res.status(500).json({ message: 'Stripe is not configured on server.' });
    }

    const { session_id: sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ message: 'session_id is required.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    const customerEmail = session.customer_details?.email || session.customer_email || null;
    const customerName = session.customer_details?.name || null;
    const shippingAddress = {
      fullName: session.metadata?.shippingFullName || null,
      street: session.metadata?.shippingStreet || null,
      city: session.metadata?.shippingCity || null,
      state: session.metadata?.shippingState || null,
      postalCode: session.metadata?.shippingPostalCode || null,
      country: session.metadata?.shippingCountry || null,
    };

    const lineItems = session.line_items?.data?.map((lineItem) => ({
      name: lineItem.description,
      quantity: lineItem.quantity,
      amountTotal: (lineItem.amount_total || 0) / 100,
    })) || [];

    return res.status(200).json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: (session.amount_total || 0) / 100,
      currency: session.currency,
      customerEmail,
      customerName,
      shippingAddress,
      lineItems,
    });
  } catch (err) {
    console.error('Stripe session verify error:', err.message);
    return res.status(500).json({ message: 'Unable to verify payment session.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});