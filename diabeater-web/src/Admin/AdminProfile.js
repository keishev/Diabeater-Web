import React, { useState, useEffect } from 'react';
import './AdminProfile.css';
// CORRECTED IMPORT PATH: Assuming your firebase.js is directly in 'src'
import { db, storage } from '../firebase'; // <-- Changed from './firebaseConfig'
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const AdminProfile = () => {
    const [profileImage, setProfileImage] = useState(null); // Can be URL string or File object
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [contactNumber, setContactNumber] = useState(''); // Initialize as empty string
    const [address, setAddress] = useState(''); // Initialize as empty string
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // !! IMPORTANT: Update this ADMIN_ID to match the document ID in your 'admins' collection !!
    // Based on your screenshot, this ID is "DAXPIeAyYbqXBFZwynIt"
    const ADMIN_ID = "DAXPIeAyYbqXBFZwynIt"; 

    // Fetch profile data from Firestore
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const docRef = doc(db, "admins", ADMIN_ID); // Collection "admins", document ID for current admin
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFirstName(data.firstName || '');
                    setLastName(data.lastName || '');
                    setEmail(data.email || '');
                    setContactNumber(data.contactNumber || '');
                    setAddress(data.address || '');
                    setProfileImage(data.profileImageURL || null); // Load existing image URL
                } else {
                    console.log("No such admin profile exists in Firestore!");
                    // If no document exists, initialize with default values (or leave blank)
                    setFirstName('System');
                    setLastName('Admin');
                    setEmail('admin@example.com');
                    setContactNumber('');
                    setAddress('');
                    setProfileImage(null);
                }
            } catch (err) {
                setError('Failed to load profile data from Firebase.');
                console.error('Error fetching profile from Firestore:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [ADMIN_ID]); // Depend on ADMIN_ID in case it changes dynamically

    const handleSave = async () => {
        setLoading(true);
        setError(null);

        let newProfileImageURL = profileImage; // Default to current state

        try {
            // 1. Handle Image Upload to Firebase Storage
            if (profileImage instanceof File) {
                const storageRef = ref(storage, `profileImages/${ADMIN_ID}/${profileImage.name}`);
                const uploadTask = uploadBytes(storageRef, profileImage);
                const snapshot = await uploadTask;
                newProfileImageURL = await getDownloadURL(snapshot.ref);
                console.log('Image uploaded to Firebase Storage:', newProfileImageURL);
            } else if (profileImage === null && typeof profileImage === 'object') { // Image was explicitly set to null (deleted)
                // Optionally delete the old image from storage if its URL was known
                // To do this properly, you would need to store the *previous* URL
                // in a separate state or fetch it before this operation.
                // For now, we are just clearing the URL in Firestore.
                newProfileImageURL = null;
                console.log('Profile image marked for deletion (cleared URL in Firestore).');
            }

            // 2. Save Profile Data to Firestore
            const adminDocRef = doc(db, "admins", ADMIN_ID);
            await setDoc(adminDocRef, {
                firstName,
                lastName,
                email,
                contactNumber,
                address,
                profileImageURL: newProfileImageURL // Save the new image URL (or null)
            }, { merge: true }); // Use merge: true to update fields without overwriting the whole document

            alert('Profile saved successfully to Firebase! 🎉');
            // Update profileImage state with the new URL for consistent display
            setProfileImage(newProfileImageURL);

        } catch (err) {
            setError(`Failed to save profile to Firebase: ${err.message}`);
            console.error('Error saving profile to Firebase:', err);
            alert(`Failed to save profile: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProfileImage(file); // Store the File object
        }
    };

    const handleDeleteImage = async () => {
        setProfileImage(null); // Mark for deletion/clearance
        // If you want to delete from Firebase Storage immediately upon clicking "Delete Image"
        // (rather than waiting for save), you would implement that logic here:
        // try {
        //     const docRef = doc(db, "admins", ADMIN_ID);
        //     const docSnap = await getDoc(docRef);
        //     if (docSnap.exists() && docSnap.data().profileImageURL) {
        //         const oldImageUrl = docSnap.data().profileImageURL;
        //         const imageRef = ref(storage, oldImageUrl);
        //         await deleteObject(imageRef);
        //         console.log("Old image deleted from Firebase Storage.");
        //         // Then update Firestore to remove the URL
        //         await setDoc(docRef, { profileImageURL: null }, { merge: true });
        //     }
        // } catch (error) {
        //     console.error("Error deleting image from Storage/Firestore:", error);
        //     alert("Failed to delete image immediately.");
        // }
    };

    if (loading) {
        return <div className="my-profile-content">Loading profile...</div>;
    }

    if (error) {
        return <div className="my-profile-content error-message">Error: {error}</div>;
    }

    return (
        <div className="my-profile-content">
            <header className="admin-header">
                <h1 className="admin-page-title">MY PROFILE</h1>
            </header>
            <div className="profile-card">
                <div className="profile-avatar-section">
                    <div className="profile-avatar-container">
                        {profileImage ? (
                            <img
                                src={profileImage instanceof File ? URL.createObjectURL(profileImage) : profileImage}
                                alt="Profile"
                                className="profile-avatar-img"
                            />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                <i className="fas fa-user-circle"></i>
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
                                style={{ display: 'none' }}
                            />
                        </label>
                        {profileImage && (
                            <button className="delete-button" onClick={handleDeleteImage}>
                                Delete Image
                            </button>
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

                    <button className="adminp-save-button" onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;