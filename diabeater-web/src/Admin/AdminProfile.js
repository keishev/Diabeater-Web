// src/Admin/AdminProfile.js
import React, { useState } from 'react';
import './AdminProfile.css'; // Make sure this CSS file exists

const AdminProfile = () => {
    // Mock data for the profile
    const [profileImage, setProfileImage] = useState(null); // State for the profile image URL or File object
    const [firstName, setFirstName] = useState('System');
    const [lastName, setLastName] = useState('Admin');
    const [email, setEmail] = useState('johndoe@gmail.com');
    const [contactNumber, setContactNumber] = useState(''); // New state for contact number
    const [address, setAddress] = useState(''); // New state for address

    const handleSave = () => {
        // Here you would typically send this data to a backend
        // including handling the profileImage upload if it's a new file
        console.log('Profile Saved:', {
            firstName,
            lastName,
            email,
            contactNumber,
            address,
            profileImage: profileImage ? profileImage.name || 'existing_image' : 'no_image'
        });
        alert('Profile saved successfully!');
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // In a real app, you'd upload this file to a server (e.g., Firebase Storage)
            // and get back a URL. For now, we'll just use a temporary URL.
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result); // Store the base64 URL for display
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteImage = () => {
        setProfileImage(null); // Clear the image
        // In a real app, you'd also send a request to delete the image from the server
        console.log('Profile image deleted.');
    };

    return (
        <div className="my-profile-content">
            <header className="admin-header">
                <h1 className="admin-page-title">MY PROFILE</h1>
            </header>
            <div className="profile-card">
                <div className="profile-avatar-section"> {/* Wrapper for avatar and buttons */}
                    <div className="profile-avatar-container">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                {/* Using a simple text placeholder or a default icon */}
                                <i className="fas fa-user-circle"></i> {/* If you have Font Awesome */}
                                {/* Or simply: <p>No Photo</p> */}
                            </div>
                        )}
                    </div>
                    <div className="profile-actions">
                        <label htmlFor="upload-photo" className="upload-button">
                            Upload Photo
                            <input
                                type="file"
                                id="upload-photo"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }} // Hide the actual file input
                            />
                        </label>
                        {profileImage && ( // Only show delete button if an image is present
                            <button className="delete-button" onClick={handleDeleteImage}>
                                Delete Image
                            </button>
                        )}
                    </div>
                </div>

                <div className="profile-details">
                    <h2 className="section-title">Basic Information</h2>
                    {/* First row: First Name and Last Name */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Second row: Email Address and Contact Number */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="contactNumber">Contact Number</label>
                            <input
                                type="text"
                                id="contactNumber"
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Third row: Address (full width) */}
                    <div className="form-group full-width">
                        <label htmlFor="address">Address</label>
                        <input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <button className="adminp-save-button" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;