// CustomAlert.js
import React from 'react';
import './CustomAlert.css';

const CustomAlert = ({ message, type = 'success', onClose, isVisible }) => {
  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '✅';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="custom-alert-overlay" onClick={handleBackdropClick}>
      <div className={`custom-alert-modal ${type}`}>
        <div className="custom-alert-header">
          <span className="custom-alert-icon">{getIcon()}</span>
          <h3 className="custom-alert-title">
            {type === 'success' && 'Success'}
            {type === 'error' && 'Error'}
            {type === 'warning' && 'Warning'}
            {type === 'info' && 'Information'}
          </h3>
        </div>
        
        <div className="custom-alert-content">
          <p className="custom-alert-message">{message}</p>
        </div>
        
        <div className="custom-alert-actions">
          <button 
            className="custom-alert-button"
            onClick={onClose}
            autoFocus
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;