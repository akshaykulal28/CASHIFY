import { Link } from 'react-router-dom';

function PaymentCancel() {
  return (
    <div style={{ maxWidth: '640px', margin: '24px auto', padding: '24px' }}>
      <h2>Payment Cancelled</h2>
      <p>Your payment was cancelled. Your cart is still available.</p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <Link to="/checkout">Try Again</Link>
        <Link to="/addtocart">Back to Cart</Link>
      </div>
    </div>
  );
}

export default PaymentCancel;
