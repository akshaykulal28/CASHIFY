import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import '../CSS/Product.css';
import { CartContext } from '../Context/CartContext';
import axios from 'axios';


function Products() {

    const API = import.meta.env.VITE_API;
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [buyLoading, setBuyLoading] = useState(false);
    const [buyMessage, setBuyMessage] = useState('');
    const navigate = useNavigate();

    const { addToCart } = useContext(CartContext);

    const { id } = useParams();

    useEffect(() => {
        fetchProducts();
    }, [id]);

    const fetchProducts = async () => {
        setLoading(true);
        setError('');
        setBuyMessage('');

        try {
            const res = await fetch(`${API}/api/products/${id}`);
            const data = await res.json();
            if (res.ok) setProduct(data);
            else setError(data.message || 'Failed to fetch products');  
        } catch {
            setError('Server error. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

//   const handleBuy = async () => {
//         // if (!product || !product._id) return;

//         setBuyLoading(true);
//         setBuyMessage('');

//         try {
//             const payload = new FormData();
//             // payload.append('productId', product._id);
//             payload.append('quantity', 1);
//             payload.append('name',product.name)

//             const res = await fetch(`${API}/api/order/add`, {
//                 method : 'POST',
//                 body:payload
//             });
//             const data = await res.json();
//             if (res.ok) {
//                 setBuyMessage('Order placed successfully.');
//             } else {
//                 setBuyMessage(data.message || 'Failed to place order.');
//             }

//         } catch {
//             setBuyMessage('Server error. Make sure backend is running.');
//         } finally {
//             setBuyLoading(false);
//         }
//     };


    const handleBuy = async () => {
        if (!product || !product._id) return;
        setBuyLoading(true);
        setBuyMessage('');

        try {
            const res = await axios.post(`${API}/api/order/add`, {
                quantity: 1,
                name: product.name,
                productId: product._id,
                price: product.price,
            });
            if (res.status === 201) {
                setBuyMessage('Order placed successfully.');
                alert('Order placed successfully.');
            } else {
                setBuyMessage(res.data.message || 'Failed to place order.');
            }
        } catch (err) {
            setBuyMessage('Server error. Make sure backend is running.');
        } finally {
            setBuyLoading(false);
        }
    };

    const discountPercent = useMemo(() => {
    if (!product) return 0;

    const price = Number(product.price) || 0;
    const originalPrice = Number(product.originalPrice) || 0;
    if (originalPrice <= 0 || price >= originalPrice) return 0;

    return Math.round(((originalPrice - price) / originalPrice) * 100);
    }, [product]);


    if (loading) {
        return (
            <div className="products-state-card">
                <h3>Loading product details...</h3>
            </div>
        );
    }



    const handleAddToCart = () => {
        if (!product || !product._id) return;

        addToCart({
            _id: product._id,
            id: product._id,
            name: product.name,
            price: Number(product.price) || 0,
            imageUrl: product.imageUrl,
            description: product.description,
        });

        navigate('/addtocart');
    };




    return (
        <div className="Productspage-container">
            <div className="Products-left">
                <div className="Products-media-card">
                    <img src={`${API}/uploads/${product.imageUrl}`} alt={product.name} />
                    {discountPercent > 0 && <span className="discount-chip">{discountPercent}% OFF</span>}
                </div>
            </div>

            <div className="Products-right">
                <div className="Products-title-row">
                    <h2>{product.name}</h2>
                    {product.tag && <span className="meta-badge">{product.tag}</span>}
                </div>

                <p className="Products-description">{product.description}</p>

                <div className="Products-price-row">
                    <span className="current-price">Rs. {Number(product.price) || 0}</span>
                    {Number(product.originalPrice) > 0 && (
                        <span className="original-price">Rs. {Number(product.originalPrice)}</span>
                    )}
                </div>

                <div className="Products-actions">
                    <button className="buy-btn" onClick={handleBuy} >Buy</button>
                    <button className="add-to-cart-btn" onClick={handleAddToCart}>Add to Cart</button>
                </div>

            
            </div>
        </div>
    );
}


export default Products;


