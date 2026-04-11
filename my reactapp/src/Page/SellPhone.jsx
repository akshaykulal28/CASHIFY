import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/SellPhone.css';

const SellPhone = () => {
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

  const phoneModels = {
    Apple: ['iPhone 15', 'iPhone 15 Pro', 'iPhone 14', 'iPhone 14 Pro', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 12', 'iPhone SE'],
    Samsung: ['Galaxy S24', 'Galaxy S24 Ultra', 'Galaxy S23', 'Galaxy S23 Ultra', 'Galaxy A55', 'Galaxy A54', 'Galaxy Z Fold', 'Galaxy Z Flip'],
    Xiaomi: ['Redmi Note 13', 'Redmi 13', 'Poco X6', 'Poco X7 Pro', 'Mi 14', 'Mi 14 Ultra', 'Redmi 12', 'Redmi 11'],
    OnePlus: ['OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 11R', 'OnePlus Open', 'OnePlus Nord', 'OnePlus Ace', 'OnePlus Ace Pro'],
    Google: ['Pixel 9', 'Pixel 9 Pro', 'Pixel 8', 'Pixel 8 Pro', 'Pixel 7', 'Pixel 6a', 'Pixel 7a', 'Pixel 8a'],
    Vivo: ['V40 Pro', 'V40', 'X100 Pro', 'X100', 'V30 Pro', 'V30', 'Y200', 'Y100'],
  };

  const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
  const batteryOptions = ['80-100%', '60-80%', '40-60%', 'Below 40%'];
  const durationOptions = ['Less than 3 months', '3-6 months', '6-12 months', '1-2 years', 'More than 2 years'];
  const damageOptions = ['No Damage', 'Screen', 'Body', 'Camera', 'Button', 'Water Damage', 'Multiple'];

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
        payload.append('images', image);
      });

      const response = await fetch(`${API}/api/phone-submission/add`, {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) throw new Error('Failed to submit phone');

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit phone. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="sellphone-success">
        <div className="success-message">
          <h2>✓ Thank You!</h2>
          <p>Your phone submission has been received.</p>
          <p>Our team will review it soon and contact you at {formData.phone}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sellphone-container">
      <h1>Sell Your Phone</h1>
      <p className="sellphone-subtitle">Help us understand your device better</p>

      <form onSubmit={handleSubmit} className="sellphone-form">
        <div className="sellphone-row">
          <div className="sellphone-field">
            <label htmlFor="brand">Brand *</label>
            <select
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              required
              className="sellphone-input"
            >
              <option value="">Select Brand</option>
              {Object.keys(phoneModels).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="sellphone-field">
            <label htmlFor="model">Model *</label>
            <select
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              required
              className="sellphone-input"
              disabled={!formData.brand}
            >
              <option value="">Select Model</option>
              {formData.brand && phoneModels[formData.brand]?.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sellphone-row">
          <div className="sellphone-field">
            <label htmlFor="condition">Condition *</label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              required
              className="sellphone-input"
            >
              <option value="">Select Condition</option>
              {conditions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="sellphone-field">
            <label htmlFor="batteryLife">Battery Health *</label>
            <select
              id="batteryLife"
              name="batteryLife"
              value={formData.batteryLife}
              onChange={handleInputChange}
              required
              className="sellphone-input"
            >
              <option value="">Select Battery Health</option>
              {batteryOptions.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sellphone-row">
          <div className="sellphone-field">
            <label htmlFor="durationUsed">Duration Used *</label>
            <select
              id="durationUsed"
              name="durationUsed"
              value={formData.durationUsed}
              onChange={handleInputChange}
              required
              className="sellphone-input"
            >
              <option value="">Select Duration</option>
              {durationOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="sellphone-field">
            <label htmlFor="damage">Damage Assessment *</label>
            <select
              id="damage"
              name="damage"
              value={formData.damage}
              onChange={handleInputChange}
              required
              className="sellphone-input"
            >
              <option value="">Select Damage</option>
              {damageOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sellphone-full">
          <div className="sellphone-field">
            <label htmlFor="description">Additional Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Any additional details about your phone..."
              className="sellphone-textarea"
              rows="3"
            />
          </div>
        </div>

        <div className="sellphone-full">
          <div className="sellphone-field">
            <label htmlFor="images">Upload Photos (up to 10) *</label>
            <input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              required
              className="sellphone-file-input"
            />
            {images.length > 0 && (
              <p className="image-count">{images.length} image(s) selected</p>
            )}
          </div>
        </div>

        <div className="sellphone-row">
          <div className="sellphone-field">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="your@email.com"
              className="sellphone-input"
            />
          </div>

          <div className="sellphone-field">
            <label htmlFor="phone">Phone *</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder="Your phone number"
              className="sellphone-input"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="sellphone-btn">
          {loading ? 'Submitting...' : 'Submit Phone for Review'}
        </button>
      </form>
    </div>
  );
};

export default SellPhone;
