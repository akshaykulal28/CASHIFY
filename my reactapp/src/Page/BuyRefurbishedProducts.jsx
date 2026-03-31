import { useState , useEffect } from "react";
import '../CSS/BuyRefurbishedProduct.css';
import { useNavigate } from "react-router-dom";
function BuyRefurbishedProducts() {
    
        const API = process.env.API
        const [products, setProducts] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');
        useEffect(() => {fetchProducts();},[]);
        const navigate = useNavigate();
        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`${API}/api/products/all`);
                const data = await res.json();
                if (res.ok) setProducts(data);
                else setError(data.message || 'Failed to fetch products');  
            } catch {
                setError('Server error. Make sure backend is running.');

            } finally {
                setLoading(false);
            }
        };
    return (
        <div className="BRP-container">
            <div className="BRP-header">
                <h2>Buy Refurbished Products</h2>
                <span className="viewall">View All</span>
            </div>

            {loading && <p className="status">Loading products...</p>}
            {error && <p className="status-error">{error}</p>}

            <div className="product-grid">
                {products.map((product) => (
                    <div className="product-card" key={product._id} onClick={() =>navigate(`/products/${product._id}`)}>
                        <img src={`${API}/uploads/${product.imageUrl}`} alt={product.name} />
                        <p className="offer">-{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF</p>
                        <h4>{product.name}</h4>

                        <div className="rating">
                            <span className="tag">{product.tag}</span>
                            {product.rating}
                        </div>

                        <div>
                            <span className="discount">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
                            <span className="price">{product.price}</span>
                            <span className="original-price">{product.originalPrice}</span>
                        </div>
                    </div>
                ))}
            </div>

        </div>
        
    );
}

export default BuyRefurbishedProducts;