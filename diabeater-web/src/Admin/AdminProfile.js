import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import userAccountsViewModel from '../ViewModels/UserAccountsViewModel';
import './AdminProfile.css';

const AdminProfile = observer(() => {
  const vm = userAccountsViewModel;
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('user' + user);
      if (user?.uid) {
        vm.fetchAdminProfile(user.uid);
        console.log('user' + vm.profile.firstName);
        vm.currentUserId = user.uid;
        console.log('uid' + user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    const { firstName, lastName, email, contactNumber, profileImageURL } = vm.profile || {};
    const profileData = { firstName, lastName, email, contactNumber, profileImageURL };
    await vm.updateAdminProfile(vm.currentUserId, profileData, vm.profileImage);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) vm.setProfileImage(file);
  };

  const handleDeleteImage = () => {
    vm.setProfileImage(null);
  };

  if (vm.isLoading) return <div className="my-profile-content">Loading profile...</div>;
  if (vm.error) return <div className="my-profile-content error-message">Error: {vm.error}</div>;

  const profile = vm.profile || {};

  return (
    <div className="my-profile-content">
      <header className="admin-header">
        <h1 className="admin-profile-page-title">MY PROFILE</h1>
      </header>
      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-container">
            {vm.profileImage ? (
              <img
                src={vm.profileImage instanceof File ? URL.createObjectURL(vm.profileImage) : vm.profileImage}
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
            {vm.profileImage && (
              <button className="delete-button" onClick={handleDeleteImage}>
                Delete Image
              </button>
            )}
          </div>
        </div>

        <div className="profile-details">
          <h2 className="section-title">Basic Information</h2>
          <div className="form-row">
            <div className="admin-profile-form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={profile.firstName || ''}
                onChange={(e) => vm.setProfileField('firstName', e.target.value)}
              />
            </div>
            <div className="admin-profile-form-group">
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

          {/* <div className="form-group full-width">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              value={profile.address || ''}
              onChange={(e) => vm.setProfileField('address', e.target.value)}
            />
          </div> */}

          <button className="adminp-save-button" onClick={handleSave} disabled={vm.isLoading}>
            {vm.isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default AdminProfile;
