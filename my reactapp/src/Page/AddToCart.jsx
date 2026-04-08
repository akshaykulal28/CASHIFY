
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../Context/CartContext';
import '../CSS/AddToCart.css';


function AddToCart() {
    const navigate = useNavigate();
    const { cartItems, addToCart, removeFromCart, clearCart, getCartTotal } = useContext(CartContext);

    const totalItems = cartItems.reduce((count, item) => count + item.quantity, 0);

    const API = import.meta.env.VITE_API;
    const fallbackImage = "data:image/svg+xml," + encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#6b7280' font-family='Arial' font-size='14'>No Image</text></svg>"
    );

    const getItemImageSrc = (item) => {
        const imageValue = item.imageUrl || item.ImageUrl || item.ImageURL || '';

        if (!imageValue) return fallbackImage;

        if (/^https?:\/\//i.test(imageValue) || imageValue.startsWith('data:')) {
            return imageValue;
        }

        if (!API) return fallbackImage;

        return `${API}/uploads/${imageValue}`;
    };

    
    // const handelbuy = async () => {
    //     setBuyLoading(true);
    //     setBuyMessage('');
    //     try {
    //         const res = await fetch(`${API}/api/order/add`,  {
    //             method: 'POST',
    //             headers:{
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 quantity: cartItems.quantity,
    //                 name: cartItems.name,
    //                 productId: cartItems.productId,
    //                 price: cartItems.price,
    //             })});

    //         if (res.status === 201) {
    //             setBuyMessage('Order placed successfully.');
    //             alert('Order placed successfully.');
    //         } else {
    //             setBuyMessage(res.data.message || 'Failed to place order.');
    //         }
    //     } catch (err) {
    //         setBuyMessage('Server error. Make sure backend is running.');
    //     } finally {
    //         setBuyLoading(false);
    //     }
    // };

    //     const handelbuy = async () => {
    //     setBuyLoading(true);
    //     setBuyMessage('');
    //     try {
    //         for (const item of cartItems) {
    //             const res = await fetch(`${API}/api/order/add`,  {
    //                 method: 'POST',
    //                 headers:{
    //                     'Content-Type': 'application/json',
    //                 },
                    
    //                 body: JSON.stringify({
    //                     quantity: item.quantity,
    //                     name: item.name,
    //                     productId: item._id || item.id,
    //                     price: item.price,
    //                 })});
    //             if (res.status === 201) {
    //                 setBuyMessage('Order placed successfully.');
    //             }
    //             else {
    //                 setBuyMessage(data.message || 'Failed to place order.');
    //                 alert(`Failed to place order for ${item.name}.`);
    //             }
    //         }
    //         alert('All orders placed successfully.');
    //     } catch (err) {
    //         setBuyMessage('Server error. Make sure backend is running.');
    //         alert('Server error. Make sure backend is running.');
    //     } finally {
    //         setBuyLoading(false);
    //     }
    // };

    // const handelCheckout = async () => {
    //     const stripe = await loadStripe("pk_test_51TER3pKbt9d3zWKBunNQCHQtNhsW4y5ZDirQJ8u3ZnzBmuzgX4ByjhfFi6FkUCySE1vfvGGkKoTpsDVt6Qn1hrkb00kMVre68K")
    //     const response = await fetch(`${API}/api/payment/create`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ product: cartItems })
    //     });
   
    //     const session = await response.json();
    //     const result = await stripe.redirectToCheckout({
    //         sessionId: session.id
    //     })


    // }

    // const handelCheckout = async () => {
    //     const stripe = await loadStripe("pk_test_51TER3pKbt9d3zWKBunNQCHQtNhsW4y5ZDirQJ8u3ZnzBmuzgX4ByjhfFi6FkUCySE1vfvGGkKoTpsDVt6Qn1hrkb00kMVre68K");
    //     try {
    //         const response = await fetch(`${API}/api/payment/create`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ product: cartItems })
    //         });
    //         if (!response.ok) {
    //             throw new Error('Failed to create checkout session.');
    //         }
    //         const session = await response.json();
    //         const result = await stripe.redirectToCheckout({
    //             sessionId: session.id
    //         });
    //         if (result.error) {
    //             alert(result.error.message);
    //         }
    //     } catch (err) {
    //         alert(err.message || 'Server error. Please try again.');
    //     }
    // };


    return (
        <div className="cart-page">
            {cartItems.length === 0 ? (
                <div className="cart-empty-state">
                    <h3>Your cart is empty</h3>
                    <p>Add products to your cart to view them here.</p>
                    <button className="cart-continue-btn" onClick={() => navigate('/')}>Continue Shopping</button>
                </div>
            ) : (
                <>
                    <div className="cart-header">
                        <h2>{totalItems} Item{totalItems > 1 ? 's' : ''} in Cart</h2>
                        <button className="cart-clear-btn" onClick={clearCart}>Clear Cart</button>
                    </div>

                    <div className="cart-layout">
                        <section className="cart-left-panel">
                            <div className="cart-items-list">
                                {cartItems.map((item) => (
                                    <div className="cart-item" key={item._id || item.id}>
                                        <img
                                            src={getItemImageSrc(item)}
                                            alt={item.name}
                                            className="cart-item-image"
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = fallbackImage;
                                            }}
                                        />

                                        <div className="cart-item-details">
                                            <h4>{item.name}</h4>
                                            <p className="cart-item-price">Rs. {item.price}</p>
                                            <p className="cart-item-subtotal">
                                                Subtotal: Rs. {(Number(item.price) || 0) * item.quantity}
                                            </p>
                                        </div>

                                        <div className="cart-item-controls">
                                            <button className="cart-control-btn" onClick={() => removeFromCart(item)}>-</button>
                                            <span className="cart-qty">{item.quantity}</span>
                                            <button className="cart-control-btn" onClick={() => addToCart(item)}>+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <aside className="cart-right-panel">
                            <div className="cart-summary-card">
                                <h3>Price Summary</h3>

                                <div className="cart-summary-row">
                                    <span>Price ({totalItems} item{totalItems > 1 ? 's' : ''})</span>
                                    <span>Rs. {getCartTotal()}</span>
                                </div>

                                <div className="cart-summary-row">
                                    <span>Delivery Charges</span>
                                    <span className="cart-free">Free</span>
                                </div>

                                <div className="cart-summary-total">
                                    <span>Total Amount</span>
                                    <span>Rs. {getCartTotal()}</span>
                                </div>

                                <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
                                    Proceed to Checkout
                                </button>
                            </div>
                        </aside>
                    </div>
                </>
            )}
        </div>
    );
}

export default AddToCart;
