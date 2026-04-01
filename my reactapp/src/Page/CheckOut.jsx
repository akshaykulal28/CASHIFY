import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../Context/CartContext';

const API = import.meta.env.VITE_API

function CheckOut() {
    const navigate = useNavigate();
    const { cartItems, getCartTotal } = useContext(CartContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    
    const handleHostedCheckout = async () => {
        setError('');

        if (!cartItems.length) {
            setError('Your cart is empty. Add items before checkout.');
            return;
        }

        setLoading(true);
        try {
            sessionStorage.setItem('pendingCheckoutItems', JSON.stringify(cartItems));

            const response = await fetch(`${API}/api/payment/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: cartItems }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Unable to create checkout session.');
            }

            if (data.url) {
                window.location.assign(data.url);
                return;
            }

            if (data.id) {
                window.location.assign(`${API}/api/payment/checkout-redirect/${encodeURIComponent(data.id)}`);
                return;
            }

            throw new Error('Checkout URL was not returned by server.');
        } catch (err) {
            setError(err.message || 'Payment initialization failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '24px auto', padding: '24px' }}>
            <h2>Checkout</h2>
            <p>Total Items: {cartItems.reduce((count, item) => count + item.quantity, 0)}</p>
            <p>Total Amount: Rs. {getCartTotal()}</p>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => navigate('/addtocart')} disabled={loading}>
                    Back to Cart
                </button>
                <button type="button" onClick={handleHostedCheckout} disabled={loading || !cartItems.length}>
                    {loading ? 'Redirecting...' : 'Pay with Stripe'}
                </button>
            </div>
        </div>
    );
}

export default CheckOut;