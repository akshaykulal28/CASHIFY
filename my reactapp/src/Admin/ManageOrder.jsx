import { useEffect } from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './MAnageOrder.css';



function ManageOrder (){

    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [updateError, setUpdateError] = useState('');
    const API = import.meta.env.VITE_API;

    useEffect( () => { fetchOrders (); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try{
            const res = await fetch(`${API}/api/order/all`);
            const data = await res.json();
            if(res.ok) setOrders(data);
            else setError(data.message || 'Failed to fetch orders.');
        } catch {
            setError('Server error. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
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
                // Update local state
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

    
    


    return(
        <div className="mo-container">
                <div className="mo-header">
                    <button className="mu-back-btn" onClick={() => navigate('/AdminPanel')}>&#8592; Back</button>
                    <h2>Manage order</h2>
                    <button className="mu-refresh-btn" onClick={fetchOrders}> Refresh</button>
                </div>
                {loading && <p className="mo-status">Loading Orders details..</p>  }
                {error && <p className="mo-status-error">{error}</p>}
                {updateError && <p className="mo-status-error">{updateError}</p>}

                {!loading && !error && orders.length === 0 && (
                    <p className="mo-status">No orders found..</p>
                )}

                {!loading && !error && orders.length >0 && (
                    <>
                    <table className="mo-table">
                            <tr>
                                <th>#</th>
                                <th>Product Id</th>
                                <th>Product Name</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total Amount</th>
                                <th> Payment Status</th>
                                <th>Delevery Status</th>
                            </tr>
                        
                            {orders.map((user, index) => (
                                <tr key={user._id || index}>
                                    <td>{index + 1}</td>
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

                                </tr>
                            ))}
                    </table>
                </>
                   
                )}



        

        </div>
    )
}

export default ManageOrder;