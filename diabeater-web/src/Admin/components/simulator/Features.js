// src/Admin/components/simulator/Features.js
import React from 'react';
import './Features.css';

function Features({ content }) {
    return (
        <section className="sim-features-section">
            <h2 className="sim-section-heading">{content.featuresSectionTitle}</h2>
            <div className="sim-features-grid">
                <div className="sim-feature-card">
                    <h3>{content.feature1Title}</h3>
                    <p>{content.feature1Description}</p>
                </div>
                <div className="sim-feature-card">
                    <h3>{content.feature2Title}</h3>
                    <p>{content.feature2Description}</p>
                </div>
                <div className="sim-feature-card">
                    <h3>{content.feature3Title}</h3>
                    <p>{content.feature3Description}</p>
                </div>
                <div className="sim-feature-card">
                    <h3>{content.feature4Title}</h3>
                    <p>{content.feature4Description}</p>
                </div>
            </div>
        </section>
    );
}

export default Features;