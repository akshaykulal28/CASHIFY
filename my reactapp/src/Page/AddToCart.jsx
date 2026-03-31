
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../Context/CartContext';
import { useState } from 'react';
import '../CSS/AddToCart.css';


function AddToCart() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [buyLoading, setBuyLoading] = useState(false);
    const [buyMessage, setBuyMessage] = useState('');
    const { cartItems, addToCart, removeFromCart, clearCart, getCartTotal } = useContext(CartContext);

    const totalItems = cartItems.reduce((count, item) => count + item.quantity, 0);

    
    // const handelbuy = async () => {
    //     setBuyLoading(true);
    //     setBuyMessage('');
    //     try {
    //         const res = await fetch('http://localhost:3000/api/order/add',  {
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
    //             const res = await fetch('http://localhost:3000/api/order/add',  {
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
    //     const response = await fetch('http://localhost:3000/api/payment/create', {
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
    //         const response = await fetch('http://localhost:3000/api/payment/create', {
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
            <div className="cart-header">
                <h2>Your Cart</h2>
                {cartItems.length > 0 && (
                    <button className="cart-clear-btn" onClick={clearCart}>Clear Cart</button>
                )}
            </div>

            {cartItems.length === 0 ? (
                <div className="cart-empty-state">
                    <h3>Your cart is empty</h3>
                    <p>Add products to your cart to view them here.</p>
                    <button className="cart-continue-btn" onClick={() => navigate('/')}>Continue Shopping</button>
                </div>
            ) : (
                <>
                    <div className="cart-items-list">
                        {cartItems.map((item) => (
                            <div className="cart-item" key={item._id || item.id}>
                                <img src={`http://localhost:3000/uploads/${item.imageUrl}`} alt={item.name} className="cart-item-image"/>
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

                    <div className="cart-summary">
                        <p>Items: {totalItems}</p>
                        <p>Total: Rs. {getCartTotal()}</p>
                    </div>
                    <div >
                        
                        <button onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default AddToCart;
