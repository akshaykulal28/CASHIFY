
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManageUser.css';

const API = import.meta.env.VITE_API

function ManageUser() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`${API}/api/auth/users/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) setUsers(users.filter(u => u._id !== id));
            else alert(data.message || 'Failed to delete user.');
        } catch {
            alert('Server error. Make sure the backend is running.');
        }
    };
    

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/api/auth/users/all`);
            const data = await res.json();
            if (res.ok) setUsers(data);
            else setError(data.message || 'Failed to fetch users.');
        } catch {
            setError('Server error. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mu-container">
            <div className="mu-header">
                <button className="mu-back-btn" onClick={() => navigate('/AdminPanel')}> Back</button>
                <h2>Manage Users</h2>
                <button className="mu-refresh-btn" onClick={fetchUsers}> Refresh</button>
            </div>

            {loading && <p className="mu-status">Loading users...</p>}
            {error && <p className="mu-status-error">{error}</p>}

            {!loading && !error && users.length === 0 && (
                <p className="mu-status">No users found.</p>
            )}

            {!loading && !error && users.length > 0 && (
                <>
                    <table className="mu-table">
                            <tr>
                                <th>#</th>
                                <th>Phone Number</th>
                                <th>Joined On</th>
                                <th>Action</th>
                            </tr>
                        
                            {users.map((user, index) => (
                                <tr key={user._id}>
                                    <td>{index + 1}</td>
                                    <td>{user.phone}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric'
                                    })}</td>
                                    <td>
                                        <button className="mu-delete-btn" onClick={() => handleDelete(user._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                    </table>
                </>
            )}
        </div>
    );
}

export default ManageUser;