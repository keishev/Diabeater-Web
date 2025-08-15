// Updated AlertProvider.js
import React, { createContext, useContext, useState } from 'react';
import CustomAlert from './CustomAlert';
import CustomConfirm from './CustomConfirm';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
  };

  const hideAlert = () => {
    setAlert(null);
  };

  const showConfirm = (options) => {
    return new Promise((resolve) => {
      setConfirm({
        ...options,
        onConfirm: () => {
          setConfirm(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirm(null);
          resolve(false);
        }
      });
    });
  };

  const showSuccess = (message) => showAlert(message, 'success');
  const showError = (message) => showAlert(message, 'error');
  const showWarning = (message) => showAlert(message, 'warning');
  const showInfo = (message) => showAlert(message, 'info');

  return (
    <AlertContext.Provider value={{
      showAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showConfirm,
      hideAlert
    }}>
      {children}
      
      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          isVisible={!!alert}
          onClose={hideAlert}
        />
      )}

      {confirm && (
        <CustomConfirm
          isVisible={!!confirm}
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          cancelText={confirm.cancelText}
          type={confirm.type}
          onConfirm={confirm.onConfirm}
          onCancel={confirm.onCancel}
        />
      )}
    </AlertContext.Provider>
  );
};