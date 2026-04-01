import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CartContext } from '../Context/CartContext';



function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, clearCart } = useContext(CartContext);
  const API = import.meta.env.VITE_API;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Verifying payment...');

  

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
          clearCart();
          sessionStorage.removeItem('pendingCheckoutItems');
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

        const persistedItems = JSON.parse(sessionStorage.getItem('pendingCheckoutItems') || '[]');
        const itemsToOrder = cartItems.length ? cartItems : persistedItems;

        if (!itemsToOrder.length) {
          setMessage('Payment successful. No pending cart items were found to convert into orders.');
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
        clearCart();
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
    <div style={{ maxWidth: '640px', margin: '24px auto', padding: '24px' }}>
      <h2>Payment Success</h2>
      {loading && <p>{message}</p>}
      {!loading && !error && <p>{message}</p>}
      {!loading && error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>

        <Link to="/">Go to Home</Link>

        <button type="button" onClick={() => navigate('/ManageOrder')}>View Orders</button>
      </div>
    </div>
  );
}


export default PaymentSuccess;
