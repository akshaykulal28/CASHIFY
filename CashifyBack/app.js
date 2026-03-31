const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();
const ServiceRouter = require('./routes/ServiceRouter');
const productRoutes = require('./routes/productRoutes');
const OrderRouter = require('./routes/OrderRouter');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);

const app = express();
const port = process.env.PORT || 3000;  
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cashify';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));


  const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);



app.post('/api/auth/signup', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required.' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this phone number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ phone, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Account created successfully!' });
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
      user: { id: user._id, phone: user.phone },
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




app.post('/api/payment/create-payment-intent', async (req, res) => {
  try {
    if (!stripeSecretKey) {
      return res.status(500).json({ message: 'Stripe is not configured on server.' });
    }

    const { product } = req.body;

    if (!Array.isArray(product) || product.length === 0) {
      return res.status(400).json({ message: 'Product list is required.' });
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
        productData.images = [imageUrl.startsWith('http') ? imageUrl : `${process.env.SERVER_URL || 'http://localhost:3000'}/uploads/${imageUrl}`];
      }

      return {
        price_data: {
          currency: 'inr',
          product_data: productData,
          unit_amount: Math.round(price * 100),
        },
        quantity,
      };
    });

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
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
      lineItems,
    });
  } catch (err) {
    console.error('Stripe session verify error:', err.message);
    return res.status(500).json({ message: 'Unable to verify payment session.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


