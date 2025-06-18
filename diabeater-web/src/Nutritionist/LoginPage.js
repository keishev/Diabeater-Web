import React, { useState } from 'react';
// Corrected paths: Go up one level (..) from Nutritionist, then into assets
import loginImage from '../assets/login_image.jpg';
import bloodDropLogo from '../assets/blood_drop_logo.png';
import './LoginPage.css';

// IMPORTANT: Destructure 'onLoginSuccess' from props
function LoginPage({ onLoginSuccess, onResetPasswordRequest, onCreateAccountRequest }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState('nutritionist'); // Initial state matching nutritionist
  const [showPassword, setShowPassword] = useState(false);

  const profileOptions = [
    { label: 'Select Profile', value: '' }, // This option remains for selection
    { label: 'Nutritionist', value: 'nutritionist' },
    { label: 'Admin', value: 'admin' },
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Login Attempt:', { email, password, profile });

    // In a real application, you'd send this data to an authentication API
    // and only call onLoginSuccess if the API call is successful.
    // For demonstration, we'll just call it after the alert.

    alert(`Logging in as:\nEmail: ${email}\nPassword: ${password}\nProfile: ${profile}`);

    // *** THE CRUCIAL CHANGE IS HERE ***
    // Pass the 'profile' state directly to onLoginSuccess
    if (onLoginSuccess) {
      onLoginSuccess(profile); // <--- Pass the selected 'profile' (admin or nutritionist)
    }
  };

   const handleResetPasswordClick = () => {
    if (onResetPasswordRequest) {
      onResetPasswordRequest();
    }
  };

  // NEW: Handler for "create account" click
  const handleCreateAccountClick = (e) => {
    e.preventDefault(); // Prevent default <a> tag behavior
    if (onCreateAccountRequest) {
      onCreateAccountRequest();
    }
  };

  return (
    <div className="login-page-container">
      {/* Left Section - Image */}
      <div className="left-section">
        <img src={loginImage} alt="Person checking blood sugar" className="login-image" />
      </div>

      {/* Right Section - Login Form */}
      <div className="right-section">
        <div className="logo-container">
          <img src={bloodDropLogo} alt="DiaBeater Logo" className="blood-drop-logo-img" />
          <h1 className="logo-text">DiaBeater</h1>
        </div>

        <form onSubmit={handleLogin} className="form">
          <label htmlFor="email-input" className="email-input-label">Email Address</label>
          <input
            id="email-input"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="email-input-field"
            required
          />

          <label htmlFor="password-input" className="input-label">Password</label>
          <div className="password-input-container">
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                // Open eye SVG
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              ) : (
                // Closed eye SVG
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.78 9.97 0 0 0 1.3-.15"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
              )}
            </span>
          </div>

          <label htmlFor="profile-select" className="input-label">Profile</label>
          <div className="select-container">
            <select
                id="profile-select"
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="select-field"
                required
            >
                {profileOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.value === ''}>
                    {option.label}
                </option>
                ))}
            </select>
            <span className="select-icon">▼</span>
            </div>

          <button type="submit" className="login-button">
            LOG IN
          </button>
        </form>

        <span
          className="reset-password-link"
          onClick={handleResetPasswordClick}
          style={{ cursor: 'pointer' }}
        >
          Reset Password
        </span>
        {/* NEW: Changed to a clickable <span> for state-based redirection to Create Account Page */}
        <span
          className="create-account-link"
          onClick={handleCreateAccountClick} // <-- Call the new handler
          style={{ cursor: 'pointer' }} // Add a pointer cursor
        >
          create account (for nutritionist)
        </span>
      </div>
    </div>
  );
};

export default LoginPage;