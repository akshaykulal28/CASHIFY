import React, { useEffect, useState } from 'react';




function ManageRequest() {

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingId, setSavingId] = useState('');
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

    const updateRequestStatus = async (id, status) => {
        const notes = window.prompt('Optional admin note for this status update:', '');

        setSavingId(id);
        setError('');
        try {
            const res = await fetch(`${API}/api/phone-submission/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminNotes: notes || '' }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || 'Failed to update request status.');
            }

            setRequests((prev) => prev.map((item) => item._id === id ? data.submission : item));
        } catch (err) {
            setError(err.message || 'Failed to update request status.');
        } finally {
            setSavingId('');
        }
    };

    const getStatusLabel = (status) => {
        if (status === 'approved_for_collection' || status === 'accepted') return 'Approved for Collection';
        if (status === 'collected') return 'Collected';
        if (status === 'reviewing') return 'Reviewing';
        if (status === 'rejected') return 'Rejected';
        return 'Pending';
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
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Admin Notes</th>
                            <th>Actions</th>
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
                                <td>
                                    <div>{req.email}</div>
                                    <div>{req.phone}</div>
                                </td>
                                <td>{getStatusLabel(req.status)}</td>
                                <td>{req.adminNotes || '-'}</td>
                                <td>
                                    <button
                                        type="button"
                                        disabled={savingId === req._id || req.status === 'approved_for_collection' || req.status === 'collected'}
                                        onClick={() => updateRequestStatus(req._id, 'approved_for_collection')}
                                    >
                                        Approve Collection
                                    </button>
                                    <button
                                        type="button"
                                        disabled={savingId === req._id || req.status === 'collected'}
                                        onClick={() => updateRequestStatus(req._id, 'collected')}
                                    >
                                        Mark Collected
                                    </button>
                                    <button
                                        type="button"
                                        disabled={savingId === req._id || req.status === 'rejected' || req.status === 'collected'}
                                        onClick={() => updateRequestStatus(req._id, 'rejected')}
                                    >
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}


            
        </div>
    );
}

export default ManageRequest;