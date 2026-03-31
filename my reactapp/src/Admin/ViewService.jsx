import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ViewService() {
    const API = 'http://localhost:3000/api/services';
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {fetchService();},[]);

    const fetchService = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/all`);
            const data = await res.json();
            if (res.ok) setProducts(data);
            else setError(data.message || 'Failed to fetch products');
        }
        catch {
            setError('Server error. Make sure backend is running.');
        }   
        finally {
            setLoading(false);
        }
    };

    return(
        <div className="VS-container">
            <div className="VS-header1">
                <button className="back-btn" onClick={() => navigate('/AdminPanel')}> Back</button>
                <h2>All Services</h2>
                <button className="refresh-btn" onClick={fetchService}> Refresh</button>
            </div>
            {loading && <p className="status">Loading services...</p>}
            {error && <p className="status-error">{error}</p>}
            {!loading && !error && products.length === 0 && (
                <p className="status">No services found.</p>
            )}
            {!loading && !error && products.length > 0 && (
                <>

                    <table className="VS-table">
                        <tr>
                            <th>#</th>
                            <th>Title</th>
                        </tr>
                        {products.map((product, index) => (
                            <tr key={product._id}>
                                <td>{index + 1}</td>    
                                <td>{product.Title}</td>
                            </tr>
                        ))}
                    </table>
                </>
            )}
        </div>

    )
}

export default ViewService; 
