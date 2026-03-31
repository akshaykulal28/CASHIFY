import { useState } from "react";
import './AddService.css';

function AddService() {
    const [formData, setFormData] = useState({
        image: null,
        title: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const API = process.env.API

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handlephoto = (e) => {
        setFormData({ ...formData, image: e.target.files[0] });
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {            
            const payload = new FormData(); 
            payload.append('image', formData.image);
            payload.append('title', formData.title);

            const response = await fetch(`${API}/api/services/add`, {
                method: 'POST',
                body: payload
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Service added successfully!');
                setFormData({ image: null, title: '' });
            } else {
                setError(data.message || 'Failed to add service');
            }
        } catch (err) {
            setError('Server error. Make sure backend is running.');
        }
    };

    return(
        <div className="add-se-container">
            <h2>Add Service</h2>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form className="add-se-form" onSubmit={handleSubmit} encType="multipart/form-data">
                <label className="add-se-label">Image</label>
                <input type="file" name="image" onChange={handlephoto} required />

                <label className="add-se-label">Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required />

                <button type="submit" className="add-se-btn">Add Service</button>
            </form>
        </div>
    );
}

export default AddService;