// src/Nutritionist/NutritionistProfile.js
import React, { useState, useEffect } from 'react'; // Import useEffect for cleanup
import './NutritionistProfile.css'; // Ensure this CSS file exists and is correctly named

const NutritionistProfile = () => {
    // Mock data for the profile
    const [profileImage, setProfileImage] = useState(null); // To hold the File object or actual image URL from backend
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // To hold the URL for image src (for preview)

    const [firstName, setFirstName] = useState('Jane');
    const [lastName, setLastName] = useState('Doe');
    const [email, setEmail] = useState('janedoe@example.com');
    const [contactNumber, setContactNumber] = useState('');
    const [address, setAddress] = useState('');

    // Effect for cleaning up the image preview URL
    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const handleSave = () => {
        // Here you would typically send this data to a backend
        // including handling the profileImage upload if it's a new file
        console.log('Profile Saved:', {
            firstName,
            lastName,
            email,
            contactNumber,
            address,
            // If profileImage is a File object, you'd send it via FormData
            // If it's a URL, you'd send the URL
            profileImage: profileImage instanceof File ? profileImage.name : profileImage || 'no_image'
        });
        alert('Profile saved successfully!');
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProfileImage(file); // Store the File object
            setImagePreviewUrl(URL.createObjectURL(file)); // Create a URL for display
        } else {
            // If user cancels selection, clear states
            setProfileImage(null);
            setImagePreviewUrl(null);
        }
    };

    const handleRemoveImage = () => { // Renamed from handleDeleteImage for clarity with the new UX
        setProfileImage(null); // Clear the file object
        setImagePreviewUrl(null); // Clear the preview URL
        // In a real app, you'd also send a request to delete the image from the server if it was already saved
        console.log('Profile image removed.');
    };

    return (
        <div className="my-profile-content">
            <header className="nutritionist-header"> {/* Changed class name */}

            </header>
            <div className="profile-card">
                <div className="profile-avatar-section"> {/* Wrapper for avatar and buttons */}
                    <div className="profile-avatar-container">
                        {imagePreviewUrl ? ( // Use imagePreviewUrl for display
                            <img src={imagePreviewUrl} alt="Profile" className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                {/* Using a simple text placeholder or a default icon */}
                                <i className="fas fa-user-circle"></i> {/* If you have Font Awesome */}
                            </div>
                        )}
                    </div>

                    <div className="profile-image-upload-area"> {/* New wrapper for upload buttons */}
                        <input
                            type="file"
                            id="profile-upload-photo" // Unique ID for this input
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }} // Hide the actual file input
                        />
                        {imagePreviewUrl ? (
                            <div className="uploaded-image-actions">
                                <label htmlFor="profile-upload-photo" className="change-photo-button">
                                    Change Picture
                                </label>
                                <button className="remove-photo-button" onClick={handleRemoveImage}>
                                    Remove Picture
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="profile-upload-photo" className="upload-photo-button-profile">
                                Upload Picture
                            </label>
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

                    <button className="np-save-button" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default NutritionistProfile; // Changed export name