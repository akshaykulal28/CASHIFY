import React from "react";
import './AdminPanel.css';

import { useNavigate } from "react-router-dom";

function AdminPanel() {
    const navigate = useNavigate();
    return(
        <div className="AdminPanel">
            <h1>Admin Panel</h1>
            <div className="Admin-buttons">
                <button onClick={() => navigate('/AddProduct')} >Add Product</button>
                <button onClick={() => navigate('/ViewProduct')} >View Product</button>
                <button onClick={() => navigate('/ManageUser')} >Manage Users</button>
                <button onClick={() => navigate('/AddService')}>AddService</button>
                <button onClick={() => navigate('/ViewService')}>View Service</button>
                <button onClick={() => navigate('/ManageOrder')}>ManageOrder</button>
                <button onClick={() => navigate('/Managerequest')}>Manage Request</button>
                <button onClick={() => navigate('/dashboard')} >Dashboard</button>

            </div>
        </div>
    );
}   

export default AdminPanel;

