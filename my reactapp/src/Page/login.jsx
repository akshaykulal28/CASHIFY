import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';
import '../CSS/login.css';

function Login() {
  const [activeTab, setActiveTab] = useState('login'); 
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { setUserProfile } = useContext(AuthContext);
  const API = import.meta.env.VITE_API;

  const resetForm = () => {
    setPhoneNumber('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAgreed(false);
    setError('');
    setSuccess('');
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!phoneNumber || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (activeTab === 'signup' && !email.trim()) {
      setError('Please enter your email address.');
      return;
    }


    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, password }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccess('Login successful!');
        setUserProfile(data.user || { phone: phoneNumber, email: '' });
        setTimeout(() => navigate('/'), 1000);
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch {
      setError('Server error. Please try again later.');
    }
  };



  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!phoneNumber || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (!email.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms and Conditions.');
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Account created! You can now login.');
        setTimeout(() => handleTabSwitch('login'), 1500);
      } else {
        setError(data.message || 'Signup failed.');
      }
    } catch {
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-container">
        <div className="login-left">
          <h3>{activeTab === 'login' ? 'Welcome Back!' : 'Join Us!'}</h3>
          <p className="login-left-text">
            {activeTab === 'login'
              ? 'Login to access your account'
              : 'Create an account to get started'}
          </p>
        </div>

        <div className="login-right">
          
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
            >
              Login
            </button>
            <button
              className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('signup')}
            >
              Sign Up
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          {activeTab === 'login' ? (
            


            <form className="auth-form" onSubmit={handleLogin}>
              <label className="auth-label">Phone Number</label>
              <input
                type="tel"
                className="auth-input"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />

              <label className="auth-label">Password</label>
              <input
                type="password"
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button className="auth-btn" type="submit">Login</button>

              <p className="auth-switch-text">
                Don't have an account?{' '}
                <span className="auth-switch-link" onClick={() => handleTabSwitch('signup')}>
                  Sign Up
                </span>
              </p>
            </form>
          ) : (
           

            <form className="auth-form" onSubmit={handleSignup}>
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label className="auth-label">Phone Number</label>
              <input
                type="tel"
                className="auth-input"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />

              <label className="auth-label">Password</label>
              <input
                type="password"
                className="auth-input"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <label className="auth-label">Confirm Password</label>
              <input
                type="password"
                className="auth-input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <label className="auth-checkbox-label">
                  I agree to the <a href="#">Terms and Conditions</a> &{' '}
                  <a href="#">Privacy Policy</a>
                </label>
              </div>

              <button className="auth-btn" type="submit">Sign Up</button>

              <p className="auth-switch-text">
                Already have an account?{' '}
                <span className="auth-switch-link" onClick={() => handleTabSwitch('login')}>
                  Login
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
