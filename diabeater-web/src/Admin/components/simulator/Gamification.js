// src/Admin/components/simulator/Gamification.js
import React from 'react';
import './Gamification.css';

function Gamification({ content }) {
    return (
        <section className="sim-gamification-section">
            <h2 className="sim-section-heading">{content.gamificationSectionTitle}</h2>
            <p className="sim-gamification-description">{content.gamificationDescription}</p>
            <div className="sim-gamification-features">
                <div className="sim-game-feature-item">
                    <i className="fas fa-trophy"></i>
                    <span>{content.gamificationFeature1}</span>
                </div>
                <div className="sim-game-feature-item">
                    <i className="fas fa-certificate"></i>
                    <span>{content.gamificationFeature2}</span>
                </div>
                <div className="sim-game-feature-item">
                    <i className="fas fa-medal"></i>
                    <span>{content.gamificationFeature3}</span>
                </div>
            </div>
        </section>
    );
}

export default Gamification;