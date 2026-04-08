import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../Context/CartContext';
import '../CSS/Checkout.css';

function CheckOut() {
    const navigate = useNavigate();
    const { cartItems, getCartTotal } = useContext(CartContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [shippingAddress, setShippingAddress] = useState({
        fullName: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
    });
    const API = import.meta.env.VITE_API;

    const updateShippingAddress = (field) => (event) => {
        const { value } = event.target;
        setShippingAddress((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const validateShippingAddress = () => {
        const requiredFields = ['fullName', 'street', 'city', 'state', 'postalCode', 'country'];
        const missingField = requiredFields.find((field) => !shippingAddress[field].trim());

        if (missingField) {
            return 'Please enter your full shipping address before continuing.';
        }

        return '';
    };

    const handleHostedCheckout = async () => {
        setError('');

        if (!cartItems.length) {
            setError('Your cart is empty. Add items before checkout.');
            return;
        }

        const addressError = validateShippingAddress();
        if (addressError) {
            setError(addressError);
            return;
        }

        const normalizedAddress = {
            fullName: shippingAddress.fullName.trim(),
            street: shippingAddress.street.trim(),
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            postalCode: shippingAddress.postalCode.trim(),
            country: shippingAddress.country.trim(),
        };

        setLoading(true);
        try {
            sessionStorage.setItem('pendingCheckoutItems', JSON.stringify(cartItems));
            sessionStorage.setItem('pendingCheckoutAddress', JSON.stringify(normalizedAddress));

            const response = await fetch(`${API}/api/payment/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product: cartItems,
                    shippingAddress: normalizedAddress,
                }),
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
        <div className="checkout-container">
            <h2>Checkout</h2>

            <section className="checkout-address-section" aria-labelledby="shipping-address-heading">
                <h3 id="shipping-address-heading">Shipping Address</h3>
                <div className="checkout-address-grid">
                    <label className="checkout-field">
                        <span>Full Name</span>
                        <input
                            type="text"
                            value={shippingAddress.fullName}
                            onChange={updateShippingAddress('fullName')}
                            placeholder="Enter full name"
                            autoComplete="name"
                        />
                    </label>
                    <label className="checkout-field checkout-field-full-width">
                        <span>Street Address</span>
                        <input
                            type="text"
                            value={shippingAddress.street}
                            onChange={updateShippingAddress('street')}
                            placeholder="House number, street, area"
                            autoComplete="shipping address-line1"
                        />
                    </label>
                    <label className="checkout-field">
                        <span>City</span>
                        <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={updateShippingAddress('city')}
                            placeholder="City"
                            autoComplete="address-level2"
                        />
                    </label>
                    <label className="checkout-field">
                        <span>State</span>
                        <input
                            type="text"
                            value={shippingAddress.state}
                            onChange={updateShippingAddress('state')}
                            placeholder="State"
                            autoComplete="address-level1"
                        />
                    </label>
                    <label className="checkout-field">
                        <span>Postal Code</span>
                        <input
                            type="text"
                            value={shippingAddress.postalCode}
                            onChange={updateShippingAddress('postalCode')}
                            placeholder="Postal code"
                            autoComplete="postal-code"
                        />
                    </label>
                    <label className="checkout-field">
                        <span>Country</span>
                        <input
                            type="text"
                            value={shippingAddress.country}
                            onChange={updateShippingAddress('country')}
                            placeholder="Country"
                            autoComplete="country-name"
                        />
                    </label>
                </div>
            </section>

            <p>
                Total Items: {cartItems.reduce((count, item) => count + item.quantity, 0)}
            </p>

            <p>Total Amount: Rs. {getCartTotal()}</p>

            {error && <p className="checkout-error">{error}</p>}

            <div className="checkout-actions">
                <button onClick={() => navigate('/addtocart')} disabled={loading}>
                    Back to Cart
                </button>

                <button
                    onClick={handleHostedCheckout}
                    disabled={loading || !cartItems.length}
                >
                    {loading ? 'Redirecting...' : 'Pay with Stripe'}
                </button>
            </div>
        </div>
    );
}

export default CheckOut;