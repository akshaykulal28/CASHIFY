import { useEffect } from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './MAnageOrder.css';
import emailjs from '@emailjs/browser';
const API = 'http://localhost:3000/api/order/all';

function ManageOrder (){

    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect( () => { fetchOrders (); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try{
            const res = await fetch(API)
            const data = await res.json();
            if(res.ok) setOrders(data);
            else setError(data.message || 'Failed to fetch orders.');
        } catch {
            setError('Server error. Make sure the backend is running.');
        } finally {
            setLoading(false);
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
                                <tr >
                                    <td>{index + 1}</td>
                                    <td>{user.productId}</td>
                                    <td>{user.name}</td>
                                    <td>{user.quantity}</td>
                                    <td>{user.price}</td>
                                    <td>{user.totalAmount}</td>
                                    <td>{user.paymentStatus}</td>
                                    <td>
                                        <select value={user.deliveryStatus} onChange={() => {sendMail}}>
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