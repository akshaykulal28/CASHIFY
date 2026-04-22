import { useEffect } from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './MAnageOrder.css';



function ManageOrder (){

    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [searchEmail, setSearchEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [updateError, setUpdateError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const API = import.meta.env.VITE_API;

    useEffect( () => { fetchOrders (); }, []);

    const fetchOrders = async (email = '') => {
        setLoading(true);
        setError('');
        try{
            const params = new URLSearchParams();
            if (email.trim()) {
                params.set('customerEmail', email.trim());
            }

            const query = params.toString();
            const res = await fetch(`${API}/api/order/all${query ? `?${query}` : ''}`);
            const data = await res.json();
            if(res.ok) setOrders(data);
            else setError(data.message || 'Failed to fetch orders.');
        } catch {
            setError('Server error. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        fetchOrders(searchEmail);
    };

    const clearSearch = () => {
        setSearchEmail('');
        fetchOrders('');
    };

    const handleDeliveryStatusChange = async (orderId, newStatus, customerEmail, orderName) => {
        setUpdatingOrderId(orderId);
        setUpdateError('');
        
        try {
            const res = await fetch(`${API}/api/order/update-delivery-status/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryStatus: newStatus }),
            });

            const data = await res.json();
            if (res.ok) {
                
                setOrders(orders.map(order => 
                    order._id === orderId ? { ...order, deliveryStatus: newStatus } : order
                ));
                alert(`Order status updated to ${newStatus}${customerEmail ? ' and email sent to customer.' : '.'}`);
            } else {
                setUpdateError(data.message || 'Failed to update delivery status.');
                alert('Error: ' + (data.message || 'Failed to update delivery status.'));
            }
        } catch (err) {
            setUpdateError('Server error. Make sure the backend is running.');
            alert('Error: Server error. Make sure the backend is running.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handeldelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        setDeletingId(id);
        try {
            const res = await fetch(`${API}/api/order/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                setOrders(orders.filter(o => o._id !== id));
            } else {
                alert(data.message || 'Failed to delete order');
            }
        } catch {
            alert('Server error. Make sure backend is running.');
        } finally {
            setDeletingId(null);

        }
    };




    
    


    return(
        <div className="mo-container">
                <div className="mo-header">
                    <button className="mu-back-btn" onClick={() => navigate('/AdminPanel')}>&#8592; Back</button>
                    <h2>Manage order</h2>
                    <button className="mu-refresh-btn" onClick={() => fetchOrders(searchEmail)}> Refresh</button>
                </div>
                <form className="mo-searchBar" onSubmit={handleSearch}>
                    <input
                        type="email"
                        placeholder="Search orders by customer email"
                        value={searchEmail}
                        onChange={(event) => setSearchEmail(event.target.value)}
                    />
                    <button type="submit">Search</button>
                    <button type="button" onClick={clearSearch}>Show all</button>
                </form>
                {loading && <p className="mo-status">Loading Orders details..</p>  }
                {error && <p className="mo-status-error">{error}</p>}
                {updateError && <p className="mo-status-error">{updateError}</p>}

                {!loading && !error && orders.length === 0 && (
                    <p className="mo-status">
                        {searchEmail.trim() ? 'No orders found for this user.' : 'No orders found..'}
                    </p>
                )}

                {!loading && !error && orders.length >0 && (
                    <>
                    <table className="mo-table">
                            <tr>
                                <th>#</th>
                                <th>User Email</th>
                                <th>Product Id</th>
                                <th>Product Name</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total Amount</th>
                                <th> Payment Status</th>
                                <th>Delevery Status</th>
                                <th>Action</th>
                            </tr>
                        
                            {orders.map((user, index) => (
                                <tr key={user._id || index}>
                                    <td>{index + 1}</td>
                                    <td>{user.customerEmail || '-'}</td>
                                    <td>{user.productId}</td>
                                    <td>{user.name}</td>
                                    <td>{user.quantity}</td>
                                    <td>{user.price}</td>
                                    <td>{user.totalAmount}</td>
                                    <td>{user.paymentStatus}</td>
                                    <td>
                                        <select 
                                            value={user.deliveryStatus || 'pending'} 
                                            onChange={(e) => handleDeliveryStatusChange(user._id, e.target.value, user.customerEmail, user.name)}
                                            disabled={updatingOrderId === user._id}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button 
                                            className="mo-action-btn" onClick={() => handeldelete(user._id)} disabled={deletingId === user._id}>Delete</button>
                                    </td>

                                </tr>
                            ))}
                    </table>
                </>
                   
                )}



        

        </div>
    )
}

export default ManageOrder;