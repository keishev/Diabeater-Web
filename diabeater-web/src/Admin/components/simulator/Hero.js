// src/Admin/components/simulator/Hero.js
import React from 'react';
import './Hero.css';

function Hero({ content }) {
    return (
        <section className="sim-hero-section">
            <div className="sim-hero-content">
                <h1 className="sim-hero-title">{content.heroTitle}</h1>
                <p className="sim-hero-subtitle">{content.heroSubtitle}</p>
                <button className="sim-hero-cta-button">{content.heroCtaText}</button>
            </div>
        </section>
    );
}

export default Hero;