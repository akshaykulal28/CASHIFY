import React ,{useState } from "react";
import { useNavigate } from "react-router-dom";

const SellLaptop = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [images, setImages] = useState([]);
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        condition: '',
        batteryLife: '',
        durationUsed: '',
        damage: '',
        description: '',
        email: '',
        phone: '',
    });

    const laptopModels = {
        Dell: ['XPS 13', 'XPS 15', 'Inspiron 14', 'Inspiron 15', 'Latitude 7420', 'Latitude 9520', 'Alienware m15', 'Alienware x17'],
        HP: ['Spectre x360', 'Envy 13', 'Pavilion 15', 'Omen 16', 'Elite Dragonfly', 'ProBook 450', 'ZBook Firefly', 'ZBook Studio'],
        Lenovo: ['ThinkPad X1 Carbon', 'ThinkPad T14', 'Yoga 9i', 'Legion 5 Pro', 'IdeaPad 5', 'IdeaPad Flex 5', 'ThinkBook 14s', 'ThinkBook Plus'],
        Apple: ['MacBook Air M2', 'MacBook Pro 13 M2', 'MacBook Pro 14 M1 Pro', 'MacBook Pro 16 M1 Max'],
        Asus: ['ZenBook 14', 'ROG Zephyrus G14', 'VivoBook S15', 'TUF Gaming A15', 'ExpertBook B9', 'ProArt StudioBook 16'],
        Acer: ['Swift 3', 'Aspire 5', 'Predator Helios 300', 'Nitro 5', 'Spin 5', 'Enduro N3'],
    };

    const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
    const batteryOptions = ['80-100%', '60-80%', '40-60%', 'Below 40%'];
    const durationOptions = ['Less than 3 months', '3-6 months', '6-12 months', '1-2 years', 'More than 2 years'];
    const damageOptions = ['No Damage', 'Screen', 'Body', 'Keyboard', 'Trackpad', 'Port', 'Water Damage', 'Multiple'];

    const API = import.meta.env.VITE_API;
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'brand' && { model: '' })
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = new FormData();
            Object.keys(formData).forEach(key => {
                payload.append(key, formData[key]);
            });
            images.forEach((image, index) => {
                payload.append(`images`, image);
            });

            const res = await fetch(`${API}/api/sell-laptop`, {
                method: 'POST',
                body: payload,
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {navigate('/')}, 2000);
            }   
            else throw new Error(data.message || 'Failed to submit laptop');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to submit laptop. Please try again.');
        }
        finally {            setLoading(false);
        }
    };
    if (success) {
        return (
            <div className="selllaptop-success">
                <div className="success-message">
                    <h2>✓ Thank You!</h2>
                    <p>Your laptop submission has been received.</p>
                    <p>Our team will review it soon and contact you at {formData.phone}.</p>
                </div>
            </div>
        );
    }
    return (
        <div className="selllaptop-container">
            <h1>Sell Your Laptop</h1>
            <form className="selllaptop-form" onSubmit={handleSubmit}>

                <div className="form-group">
                    <label htmlFor="brand">Brand:</label>
                    <select name="brand" id="brand" value={formData.brand} onChange={handleInputChange} required>
                        <option value="">Select Brand</option>
                        {Object.keys(laptopModels).map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="model">Model:</label>
                    <select name="model" id="model" value={formData.model} onChange={handleInputChange} required disabled={!formData.brand}>
                        <option value="">Select Model</option>
                        {formData.brand && laptopModels[formData.brand].map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="condition">Condition:</label>
                    <select name="condition" id="condition" value={formData.condition} onChange={handleInputChange} required>
                        <option value="">Select Condition</option>
                        {conditions.map(condition => (
                            <option key={condition} value={condition}>{condition}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="batteryLife">Battery Life:</label>
                    <select name="batteryLife" id="batteryLife" value={formData.batteryLife} onChange={handleInputChange} required>
                        <option value="">Select Battery Life</option>
                        {batteryOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="durationUsed">Duration Used:</label>
                    <select name="durationUsed" id="durationUsed" value={formData.durationUsed} onChange={handleInputChange} required>
                        <option value="">Select Duration</option>
                        {durationOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>


                <div className="form-group">    
                    <label htmlFor="damage">Any Damage:</label>
                    <select name="damage" id="damage" value={formData.damage} onChange={handleInputChange} required>
                        <option value="">Select Damage</option>
                        {damageOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Additional Details:</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} placeholder="Provide any additional details about your laptop..." />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Contact Email:</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required placeholder="
Enter your email address" />
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Contact Phone:</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required placeholder="Enter your phone number" />
                </div>


                <div className="form-group">
                    <label htmlFor="images">Upload Images:</label>
                    <input type="file" name="images" id="images" onChange={handleImageChange} multiple accept="image/*" />
                </div>

                <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Laptop'}</button>
            </form>
        </div>
    );
}

export default SellLaptop;