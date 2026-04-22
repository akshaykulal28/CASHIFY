import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';




function ManageRequest() {

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const API = import.meta.env.VITE_API;

    useEffect(() => {
        fetchRequests();
    }, []);


    const fetchRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/api/phone-submission/all`);
            const data = await res.json();
            if (res.ok) setRequests(data);
            else setError(data.message || 'Failed to fetch requests.');
        } catch {
            setError('Server error. Make sure the backend is running.');
        }
        finally {

            setLoading(false);
        }
    };


    return (
        <div className="mr-container">
            <div className="mr-header">
                <button className="mr-back-button" onClick={() => window.history.back()}>Back</button>
                <h2>Manage Request</h2>
                <button className="mr-refresh-button" onClick={() => window.location.reload()}>Refresh</button>
            </div>
            {loading && <p className="mr-status">Loading requests...</p>}
            {error && <p className="mr-status-error">{error}</p>}

            {!loading && !error && requests.length === 0 && (
                <p className="mr-status">No requests found.</p>
            )}

            {!loading && !error && requests.length > 0 && (
                <table className="mr-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Device Type</th>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>Condition</th>
                            <th>Battery Life</th>
                            <th>Duration Used</th>
                        </tr>
                    </thead>

                    <tbody>
                        {requests.map((req, index) => (
                            <tr key={req._id}>
                                <td>{index + 1}</td>
                                <td>{req.DeviceType}</td>
                                <td>{req.brand}</td>
                                <td>{req.model}</td>
                                <td>{req.condition}</td>
                                <td>{req.batteryLife}</td>
                                <td>{req.durationUsed}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}


            
        </div>
    );
}

export default ManageRequest;