// src/Admin/components/simulator/DownloadCTA.js
import React from 'react';
import './DownloadCTA.css';

function DownloadCTA({ content }) {
    return (
        <section className="sim-download-cta-section">
            <h2 className="sim-section-heading">{content.downloadCTATitle}</h2>
            <p className="sim-download-subtitle">{content.downloadCTASubtitle}</p>
            <div className="sim-app-buttons">
                <a href={content.appStoreLink} target="_blank" rel="noopener noreferrer" className="sim-app-button apple">
                    <i className="fab fa-apple"></i> App Store
                </a>
                <a href={content.googlePlayLink} target="_blank" rel="noopener noreferrer" className="sim-app-button google">
                    <i className="fab fa-google-play"></i> Google Play
                </a>
            </div>
        </section>
    );
}

export default DownloadCTA;