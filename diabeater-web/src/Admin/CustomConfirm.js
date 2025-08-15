// CustomConfirm.js - Add this to your components folder
import React from 'react';
import './CustomConfirm.css';

const CustomConfirm = ({ 
  isVisible, 
  title = "Confirm Action", 
  message, 
  confirmText = "Yes, Delete", 
  cancelText = "Cancel",
  onConfirm, 
  onCancel,
  type = "danger" // danger, warning, info
}) => {
  if (!isVisible) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger': return '🗑️';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  return (
    <div className="custom-confirm-overlay" onClick={handleBackdropClick}>
      <div className={`custom-confirm-modal ${type}`}>
        <div className="custom-confirm-header">
          <span className="custom-confirm-icon">{getIcon()}</span>
          <h3 className="custom-confirm-title">{title}</h3>
        </div>
        
        <div className="custom-confirm-content">
          <p className="custom-confirm-message">{message}</p>
        </div>
        
        <div className="custom-confirm-actions">
          <button 
            className="custom-confirm-button cancel-button"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className="custom-confirm-button confirm-button"
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomConfirm;