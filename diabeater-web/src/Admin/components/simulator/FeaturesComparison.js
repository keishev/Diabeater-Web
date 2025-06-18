// src/Admin/components/simulator/FeaturesComparison.js
import React from 'react';
import './FeaturesComparison.css';

function FeaturesComparison({ content }) {
    return (
        <section className="sim-comparison-section">
            <h2 className="sim-section-heading">{content.featuresComparisonTitle}</h2>
            <div className="sim-comparison-grid">
                <div className="sim-plan-card basic-plan">
                    <h3>{content.basicHeader}</h3>
                    <ul>
                        {content.basicFeatureList.map((feature, index) => (
                            <li key={`basic-${index}`}><i className="fas fa-check-circle"></i> {feature}</li>
                        ))}
                    </ul>
                </div>
                <div className="sim-plan-card premium-plan">
                    <h3>{content.premiumHeader}</h3>
                    <ul>
                        {content.premiumFeatureList.map((feature, index) => (
                            <li key={`premium-${index}`}><i className="fas fa-check-circle"></i> {feature}</li>
                        ))}
                    </ul>
                    <button className="sim-comparison-cta">{content.comparisonCtaText}</button>
                </div>
            </div>
        </section>
    );
}

export default FeaturesComparison;