import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ViewProduct.css';




function ViewProduct() {
    const API = import.meta.env.VITE_API;
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => { fetchProducts(); }, []);

    useEffect(() => {
        if (location.state?.message) {
            setMessage(location.state.message);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname, location.state, navigate]);

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


    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`${API}/api/products/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                setProducts(products.filter(p => p._id !== id));
            } else {
                alert(data.message || 'Failed to delete product');
            }
        } catch {
            alert('Server error. Make sure backend is running.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="VP-container">
            <div className="header1">
                <button className="back-btn" onClick={() => navigate('/AdminPanel')}> Back</button>
                <h2>All Products</h2>
                <button className="refresh-btn" onClick={fetchProducts}> Refresh</button>
            </div>

            {loading && <p className="status">Loading products...</p>}
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p className="status-error">{error}</p>}

            {!loading && !error && products.length === 0 && (
                <p className="status">No products found. Add some from the Admin Panel.</p>
            )}
            {!loading && !error && products.length > 0 && (
                <>
                
            <table>
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Brand</th>
                        <th>Actions</th>
                        <th>Edit</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product._id}>
                            <td><img src={`${API}/uploads/${product.imageUrl}`} alt={product.name} style={{ width: '120px', height: 'auto' }} /></td>
                            <td>{product.name}</td>
                            <td>{product.price}</td>
                            <td>{product.description}</td>
                            <td>{product.category}</td>
                            <td>{product.brand}</td>
                            <td><button className='btn-pd-delete' onClick={() => handleDelete(product._id)} disabled={deletingId === product._id}>{deletingId === product._id ? 'Deleting...' : 'Delete'}</button></td>
                            <td><button className='btn-pd-edit' onClick={() => navigate(`/AdminPanel/edit/${product._id}`)}>Edit</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
                </>
            )}

        </div>
    );
}

            

                          
export default ViewProduct;
