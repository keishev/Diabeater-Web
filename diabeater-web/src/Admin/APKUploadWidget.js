// src/components/APKUploadWidget.js //admin
import React, { useState, useRef } from 'react';
import './APKUploadWidget.css';

const APKUploadWidget = ({ currentAPKUrl, currentFileName, onUpload, onDelete }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.name.endsWith('.apk')) {
            setError('Please select a valid APK file.');
            return;
        }

        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            setError('File size must be less than 100MB.');
            return;
        }

        try {
            setIsUploading(true);
            setError(null);
            setSuccess(null);
            setUploadProgress(0);

            // Simulate upload progress (you can implement real progress tracking with Firebase)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            // Upload the file
            const downloadURL = await onUpload(file);
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            setSuccess(`APK uploaded successfully! File: ${file.name}`);
            
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            setError(`Upload failed: ${error.message}`);
            setUploadProgress(0);
        } finally {
            setIsUploading(false);
            // Clear progress after a delay
            setTimeout(() => setUploadProgress(0), 3000);
        }
    };

    const handleDelete = async () => {
        if (!currentFileName) return;
        
        if (!window.confirm(`Are you sure you want to delete ${currentFileName}?`)) {
            return;
        }

        try {
            setIsUploading(true);
            setError(null);
            setSuccess(null);
            
            await onDelete(currentFileName);
            setSuccess('APK file deleted successfully!');
        } catch (error) {
            setError(`Delete failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="apk-upload-widget">
            <div className="apk-upload-header">
                <h3>APK File Management</h3>
                <p>Upload your Android APK file for users to download</p>
            </div>

            {/* Current APK Info */}
            {currentAPKUrl && currentAPKUrl !== "/assets/Diabeater.apk" && (
                <div className="current-apk-info">
                    <div className="apk-file-info">
                        <div className="apk-icon">📱</div>
                        <div className="apk-details">
                            <p className="apk-name">{currentFileName}</p>
                            <p className="apk-url">URL: {currentAPKUrl}</p>
                        </div>
                        <button 
                            className="delete-btn"
                            onClick={handleDelete}
                            disabled={isUploading}
                            title="Delete current APK"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            <div className="upload-area">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".apk"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={isUploading}
                />
                
                <div 
                    className={`upload-dropzone ${isUploading ? 'uploading' : ''}`}
                    onClick={triggerFileInput}
                >
                    {isUploading ? (
                        <div className="upload-progress">
                            <div className="progress-circle">
                                <div className="progress-text">{uploadProgress}%</div>
                            </div>
                            <p>Uploading APK file...</p>
                        </div>
                    ) : (
                        <div className="upload-prompt">
                            <div className="upload-icon">📂</div>
                            <p>Click to select APK file</p>
                            <small>Maximum file size: 100MB</small>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {uploadProgress > 0 && (
                <div className="progress-bar-container">
                    <div 
                        className="progress-bar"
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
            )}

            {/* Status Messages */}
            {error && (
                <div className="status-message error">
                    <span className="status-icon">❌</span>
                    {error}
                </div>
            )}

            {success && (
                <div className="status-message success">
                    <span className="status-icon">✅</span>
                    {success}
                </div>
            )}

            {/* Upload Instructions */}
            <div className="upload-instructions">
                <h4>Instructions:</h4>
                <ul>
                    <li>Upload your latest APK file to make it available for download</li>
                    <li>The file will be stored securely in Firebase Storage</li>
                    <li>Users will be able to download it from the marketing website</li>
                    <li>If the download fails, users will see the Google Drive fallback link</li>
                </ul>
            </div>
        </div>
    );
};

export default APKUploadWidget;