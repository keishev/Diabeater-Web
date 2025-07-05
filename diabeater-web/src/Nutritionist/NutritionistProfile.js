// src/Nutritionist/NutritionistProfile.js
import React, { useState, useEffect } from 'react';
import './NutritionistProfile.css';
// Corrected import path for firebase.js
import { db, storage, auth } from '../firebase'; // Import auth to get current user UID
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const NutritionistProfile = () => {
    // States for profile data
    const [profileImage, setProfileImage] = useState(null); // Holds File object for new upload, or URL for existing
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // Holds URL for image display (either local or remote)

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [address, setAddress] = useState('');

    // State for loading and error handling
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get the current authenticated user's UID (this is crucial for fetching/saving their specific profile)
    // In a real application, you'd likely get this from a global auth context or Redux store.
    // For now, we'll try to get it directly from Firebase Auth.
    const currentUser = auth.currentUser;
    // IMPORTANT: The NUTRITIONIST_ID should be the Firebase Auth UID of the logged-in nutritionist.
    // If no user is logged in, or if you're testing with a fixed ID, adjust this.
    const NUTRITIONIST_ID = currentUser ? currentUser.uid : null;
    // If you are absolutely sure there's only ONE nutritionist profile with a fixed ID,
    // like 'specificNutrID123', you could hardcode it IF you handle authentication roles/UIDs carefully in rules.
    // Example: const NUTRITIONIST_ID = "specificNutrID123";

    // Effect to fetch nutritionist profile data on component mount
    useEffect(() => {
        const fetchNutritionistProfile = async () => {
            if (!NUTRITIONIST_ID) {
                setError('No nutritionist ID found. Please ensure you are logged in.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const docRef = doc(db, "nutritionists", NUTRITIONIST_ID);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFirstName(data.firstName || '');
                    setLastName(data.lastName || '');
                    setEmail(data.email || '');
                    setContactNumber(data.contactNumber || '');
                    setAddress(data.address || '');
                    setProfileImage(data.profileImageURL || null); // Store the URL if it exists
                    setImagePreviewUrl(data.profileImageURL || null); // Use the URL for preview
                } else {
                    console.log("No nutritionist profile found for this ID. Creating new profile on save.");
                    // Initialize with default or empty values for new profile creation
                    setFirstName('');
                    setLastName('');
                    setEmail(currentUser ? currentUser.email : ''); // Pre-fill email if available from auth
                    setContactNumber('');
                    setAddress('');
                    setProfileImage(null);
                    setImagePreviewUrl(null);
                }
            } catch (err) {
                setError(`Failed to load profile: ${err.message}`);
                console.error('Error fetching nutritionist profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNutritionistProfile();

        // Cleanup function for imagePreviewUrl
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [NUTRITIONIST_ID, imagePreviewUrl, currentUser]); // Re-run if NUTRITIONIST_ID or currentUser changes

    // Handle saving the profile data to Firebase
    const handleSave = async () => {
        if (!NUTRITIONIST_ID) {
            alert('Cannot save profile: No nutritionist ID available. Please log in.');
            return;
        }

        setLoading(true);
        setError(null);

        let finalProfileImageURL = profileImage; // Start with current image state (File object or existing URL)

        try {
            // 1. Handle Image Upload to Firebase Storage
            if (profileImage instanceof File) {
                const storageRef = ref(storage, `nutritionistProfiles/${NUTRITIONIST_ID}/${profileImage.name}`);
                const uploadTask = uploadBytes(storageRef, profileImage);
                const snapshot = await uploadTask;
                finalProfileImageURL = await getDownloadURL(snapshot.ref);
                console.log('New image uploaded to Firebase Storage:', finalProfileImageURL);
            } else if (profileImage === null && imagePreviewUrl) {
                // If profileImage is null AND there was a previous image (imagePreviewUrl is not null)
                // This means the user explicitly removed a previously saved image.
                console.log("Attempting to delete old image from Storage and clear URL.");
                try {
                    // Fetch the current document to get the old image URL
                    const docSnap = await getDoc(doc(db, "nutritionists", NUTRITIONIST_ID));
                    if (docSnap.exists() && docSnap.data().profileImageURL) {
                        const oldImageUrlToDelete = docSnap.data().profileImageURL;
                        const oldImageRef = ref(storage, oldImageUrlToDelete);
                        await deleteObject(oldImageRef);
                        console.log('Old image deleted from Firebase Storage.');
                    }
                } catch (deleteError) {
                    // Log but don't stop the save operation if old image deletion fails
                    console.warn('Could not delete old image from storage:', deleteError);
                }
                finalProfileImageURL = null; // Set URL to null in Firestore
            }
            // If profileImage is already a URL and not a File (means no new upload/deletion),
            // finalProfileImageURL remains the existing URL.

            // 2. Save Profile Data to Firestore
            const nutritionistDocRef = doc(db, "nutritionists", NUTRITIONIST_ID);
            await setDoc(nutritionistDocRef, {
                firstName,
                lastName,
                email,
                contactNumber,
                address,
                profileImageURL: finalProfileImageURL // Save the new/existing/null image URL
            }, { merge: true }); // Use merge: true to update fields without overwriting the whole document

            alert('Profile saved successfully! 🎉');
            // Update states to reflect the saved data, especially the image URL
            setProfileImage(finalProfileImageURL); // Now profileImage holds the URL
            setImagePreviewUrl(finalProfileImageURL); // Ensure preview also shows the saved URL

        } catch (err) {
            setError(`Failed to save profile: ${err.message}`);
            console.error('Error saving nutritionist profile:', err);
            alert(`Failed to save profile: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle image file selection
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProfileImage(file); // Store the File object to be uploaded
            setImagePreviewUrl(URL.createObjectURL(file)); // Create a local URL for immediate display
        } else {
            // If user cancels file selection, revert to previous state
            // If there was an old image, profileImage would be its URL, imagePreviewUrl would be too.
            // If no old image, they both would be null.
            if (!(profileImage instanceof File)) { // Only clear if it wasn't a new file already
                setProfileImage(profileImage);
            }
            if (!imagePreviewUrl) { // Only clear if there's no existing preview
                setImagePreviewUrl(imagePreviewUrl);
            }
        }
    };

    // Handle removing the image (clears preview and marks for deletion from storage on save)
    const handleRemoveImage = () => {
        setProfileImage(null); // Mark for deletion (by setting to null)
        setImagePreviewUrl(null); // Clear the local preview
        console.log('Profile image marked for removal upon save.');
    };

    // Display loading or error messages
    if (loading) {
        return <div className="my-profile-content">Loading nutritionist profile...</div>;
    }

    if (error) {
        return <div className="my-profile-content error-message">Error: {error}</div>;
    }

    return (
        <div className="my-profile-content">
            <header className="nutritionist-header">
                <h1 className="nutritionist-page-title">MY PROFILE</h1> {/* Added a title */}
            </header>
            <div className="profile-card">
                <div className="profile-avatar-section">
                    <div className="profile-avatar-container">
                        {imagePreviewUrl ? ( // Use imagePreviewUrl for display
                            <img src={imagePreviewUrl} alt="Profile" className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                <i className="fas fa-user-circle"></i> {/* Placeholder icon */}
                            </div>
                        )}
                    </div>

                    <div className="profile-image-upload-area">
                        <input
                            type="file"
                            id="profile-upload-photo"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
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

                    <div className="form-group full-width">
                        <label htmlFor="address">Address</label>
                        <input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <button className="np-save-button" onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NutritionistProfile;