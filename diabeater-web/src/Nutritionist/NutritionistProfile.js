import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import userAccountsViewModel from '../ViewModels/UserAccountsViewModel';
import './NutritionistProfile.css';

const NutritionistProfile = observer(() => {
  const vm = userAccountsViewModel;
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid) {
        vm.fetchNutritionistProfile(user.uid);
        vm.setCurrentUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    const { firstName, lastName, email, contactNumber, profileImageURL } = vm.profile || {};
    const profileData = { firstName, lastName, email, contactNumber, profileImageURL };

    const cleanedData = Object.fromEntries(
      Object.entries(profileData).filter(([_, v]) => v !== undefined)
    );

    await vm.updateNutritionistProfile(vm.currentUserId, cleanedData, vm.profileImage);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      vm.setProfileImage(file);
    }
  };

  const handleRemoveImage = () => {
    vm.setProfileImage(null);
  };

  if (vm.isLoading) return <div className="my-profile-content">Loading nutritionist profile...</div>;
  if (vm.error) return <div className="my-profile-content error-message">Error: {vm.error}</div>;

  const profile = vm.profile || {};
  const imageSrc =
    vm.profileImage instanceof File
      ? URL.createObjectURL(vm.profileImage)
      : vm.profileImage;

  return (
    <div className="my-profile-content">
      <header className="nutritionist-header">
        <h1 className="nutritionist-page-title">MY PROFILE</h1>
      </header>
      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-container">
            {imageSrc ? (
              <img src={imageSrc} alt="Profile" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">
                <i className="fas fa-user-circle"></i>
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
            {imageSrc ? (
              <div className="uploaded-image-actions">
                <label htmlFor="profile-upload-photo" className="change-photo-button">Change Picture</label>
                <button className="remove-photo-button" onClick={handleRemoveImage}>Remove Picture</button>
              </div>
            ) : (
              <label htmlFor="profile-upload-photo" className="upload-photo-button-profile">Upload Picture</label>
            )}
          </div>
        </div>

        <div className="profile-details">
          <h2 className="section-title">Basic Information</h2>
          <div className="form-row">
            <div className="nutritionist-form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={profile.firstName || ''}
                onChange={(e) => vm.setProfileField('firstName', e.target.value)}
              />
            </div>
            <div className="nutritionist-form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={profile.lastName || ''}
                onChange={(e) => vm.setProfileField('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={profile.email || ''}
                readOnly
              />
            </div>
            
          </div>

          <button className="np-save-button" onClick={handleSave} disabled={vm.isLoading}>
            {vm.isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default NutritionistProfile;
