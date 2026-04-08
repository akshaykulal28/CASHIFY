import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CartContext } from '../Context/CartContext';
import '../CSS/PaymentSuccess.css';



function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, clearCart } = useContext(CartContext);
  const API = import.meta.env.VITE_API;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Verifying payment...');
  const [paymentMeta, setPaymentMeta] = useState(null);

  

    const createOrdersAfterVerification = async () => {

      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        setError('Missing payment session id.');
        setLoading(false);
        return;
      }

      try {
        const processedKey = `processedStripeSession:${sessionId}`;
        if (sessionStorage.getItem(processedKey)) {
          setMessage('Payment already processed.');
          setPaymentMeta({ sessionId });
          clearCart();
          sessionStorage.removeItem('pendingCheckoutItems');
          sessionStorage.removeItem('pendingCheckoutAddress');
          setLoading(false);
          return;
        }

        const verifyRes = await fetch(`${API}/api/payment/verify-session?session_id=${encodeURIComponent(sessionId)}`);
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
          throw new Error(verifyData.message || 'Failed to verify payment session.');
        }

        if (verifyData.paymentStatus !== 'paid') {
          throw new Error('Payment is not completed yet.');
        }

        if (!verifyData.customerEmail) {
          throw new Error('Payment completed, but customer email was not found in Stripe session.');
        }

        const storedAddress = JSON.parse(sessionStorage.getItem('pendingCheckoutAddress') || 'null');
        const shippingAddress = verifyData.shippingAddress || storedAddress;

        if (!shippingAddress?.fullName || !shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.postalCode || !shippingAddress?.country) {
          throw new Error('Payment completed, but shipping address was not found.');
        }

        const persistedItems = JSON.parse(sessionStorage.getItem('pendingCheckoutItems') || '[]');
        const itemsToOrder = cartItems.length ? cartItems : persistedItems;

        if (!itemsToOrder.length) {
          setMessage('Payment successful. No pending cart items were found to convert into orders.');
          setPaymentMeta({
            sessionId: verifyData.sessionId,
            customerEmail: verifyData.customerEmail,
          });
          sessionStorage.setItem(processedKey, '1');
          sessionStorage.removeItem('pendingCheckoutItems');
          clearCart();
          setLoading(false);
          return;
        }

        for (const item of itemsToOrder) {
          const orderPayload = {
            quantity: item.quantity,
            name: item.name,
            productId: item._id || item.id,
            price: Number(item.price),
            totalAmount: Number(verifyData.amountTotal || 0),
            stripeSessionId: verifyData.sessionId,
            paymentStatus: verifyData.paymentStatus,
            customerEmail: verifyData.customerEmail,
            shippingAddress,
          };

          const orderRes = await fetch(`${API}/api/order/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
          });

          const orderData = await orderRes.json();
          if (!orderRes.ok) {
            throw new Error(orderData.message || `Failed to create order for ${item.name}.`);
          }
        }

        const emailRes = await fetch(`${API}/api/order/send-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stripeSessionId: verifyData.sessionId,
            customerEmail: verifyData.customerEmail,
            currency: verifyData.currency || 'INR',
          }),
        });

        const emailData = await emailRes.json();
        if (!emailRes.ok) {
          throw new Error(emailData.message || 'Order placed but failed to send confirmation email.');
        }

        sessionStorage.setItem(processedKey, '1');
        sessionStorage.removeItem('pendingCheckoutItems');
        sessionStorage.removeItem('pendingCheckoutAddress');
        clearCart();
        setPaymentMeta({
          sessionId: verifyData.sessionId,
          customerEmail: verifyData.customerEmail,
          shippingAddress,
        });
        setMessage('Payment successful, your order has been placed, and a confirmation email was sent.');

      } catch (err) {
        setError(err.message || 'Unable to complete order placement.');
      } finally {
        setLoading(false);
      }

      

    };

    useEffect(() => {
        createOrdersAfterVerification();},  []);
    

    

  return (
    <main className="payment-success-page">
      <section className="payment-success-card" aria-live="polite">
        <div className="payment-success-icon" aria-hidden="true">
          ✓
        </div>
        <h1 className="payment-success-title">Payment Successful</h1>
        <p className="payment-success-subtitle">
          Your payment has been received. We are now preparing your order details.
        </p>

        <p
          className={`payment-success-status ${
            loading ? 'is-loading' : error ? 'is-error' : 'is-success'
          }`}
        >
          {message}
        </p>

        {!loading && !error && paymentMeta?.sessionId && (
          <div className="payment-success-meta">
            <span className="meta-label">Reference</span>
            <span className="meta-value">{paymentMeta.sessionId}</span>
            {paymentMeta.customerEmail && (
              <>
                <span className="meta-label">Receipt Sent To</span>
                <span className="meta-value">{paymentMeta.customerEmail}</span>
              </>
            )}
            {paymentMeta.shippingAddress && (
              <>
                <span className="meta-label">Shipping Address</span>
                <span className="meta-value">
                  {paymentMeta.shippingAddress.fullName}, {paymentMeta.shippingAddress.street}, {paymentMeta.shippingAddress.city}, {paymentMeta.shippingAddress.state}, {paymentMeta.shippingAddress.postalCode}, {paymentMeta.shippingAddress.country}
                </span>
              </>
            )}
          </div>
        )}

        <div className="payment-success-actions">
          <Link to="/" className="btn btn-primary">
            Go to Home
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/ManageOrder')}
          >
            View Orders
          </button>
        </div>
      </section>
    </main>
  );
}


export default PaymentSuccess;
