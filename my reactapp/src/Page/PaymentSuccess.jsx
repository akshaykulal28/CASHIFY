import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CartContext } from '../Context/CartContext';
import { AuthContext } from '../Context/AuthContext';
import '../CSS/PaymentSuccess.css';



function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, clearCart } = useContext(CartContext);
  const { userEmail, setUserProfile } = useContext(AuthContext);
  const API = import.meta.env.VITE_API;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Verifying payment...');
  const [paymentMeta, setPaymentMeta] = useState(null);
  const [emailWarning, setEmailWarning] = useState('');

  const genericEmailDelayMessage = 'Order placed successfully. Confirmation email is delayed. Please check your inbox in a few minutes.';

  

    const createOrdersAfterVerification = async () => {
      if (!API) {
        setError('Frontend API URL is missing. Set VITE_API in frontend environment settings.');
        setLoading(false);
        return;
      }

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

        setMessage('Verifying payment...');
        const verifyRes = await fetch(`${API}/api/payment/verify-session?session_id=${encodeURIComponent(sessionId)}`);
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
          throw new Error(verifyData.message || 'Failed to verify payment session.');
        }

        if (verifyData.paymentStatus !== 'paid') {
          throw new Error('Payment is not completed yet.');
        }

        const storedCustomerEmail = sessionStorage.getItem('pendingCustomerEmail') || '';
        const resolvedCustomerEmail = verifyData.customerEmail || userEmail || storedCustomerEmail;

        if (!resolvedCustomerEmail) {
          throw new Error('Payment completed, but customer email was not found in Stripe session or shared auth state.');
        }

        setUserProfile((currentUser) => ({
          ...(currentUser || {}),
          email: resolvedCustomerEmail,
        }));

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
            customerEmail: resolvedCustomerEmail,
          });
          sessionStorage.setItem(processedKey, '1');
          sessionStorage.removeItem('pendingCheckoutItems');
          clearCart();
          setLoading(false);
          return;
        }

        setMessage('Payment verified. Creating your order...');
        for (const item of itemsToOrder) {
          const orderPayload = {
            quantity: item.quantity,
            name: item.name,
            productId: item._id || item.id,
            price: Number(item.price),
            totalAmount: Number(verifyData.amountTotal || 0),
            stripeSessionId: verifyData.sessionId,
            paymentStatus: verifyData.paymentStatus,
            customerEmail: resolvedCustomerEmail,
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

        setMessage('Order placed. Sending confirmation email...');
        try {
          const emailRes = await fetch(`${API}/api/order/send-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stripeSessionId: verifyData.sessionId,
              customerEmail: resolvedCustomerEmail,
              currency: verifyData.currency || 'INR',
            }),
          });

          const emailData = await emailRes.json();
          if (!emailRes.ok) {
            const errorText = String(emailData?.message || '');
            const shouldHideDetails = /socket|connection|timeout|smtp|unexpected/i.test(errorText);
            setEmailWarning(shouldHideDetails ? genericEmailDelayMessage : (emailData.message || genericEmailDelayMessage));
          }
        } catch (emailErr) {
          setEmailWarning(genericEmailDelayMessage);
        }

        sessionStorage.setItem(processedKey, '1');
        sessionStorage.removeItem('pendingCheckoutItems');
        sessionStorage.removeItem('pendingCheckoutAddress');
        clearCart();
        setPaymentMeta({
          sessionId: verifyData.sessionId,
          customerEmail: resolvedCustomerEmail,
          shippingAddress,
        });
        setMessage('Payment successful and your order has been placed.');

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

        {!loading && !error && emailWarning && (
          <p className="payment-success-status is-error">{emailWarning}</p>
        )}

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
