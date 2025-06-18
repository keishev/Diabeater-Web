// src/Admin/components/simulator/Header.js
import React from 'react';
import './Header.css'; // Specific CSS for this Header component

function Header({ content }) {
    return (
        <header className="sim-main-header">
            <div className="sim-header-left">
                <span className="sim-logo-text">{content.headerLogoText}</span>
            </div>
            <nav className="sim-nav">
                <a href="#home">{content.headerNavHome}</a>
                <a href="#features">{content.headerNavFeatures}</a>
                <a href="#about">{content.headerNavAbout}</a>
                <a href="#contact">{content.headerNavContact}</a>
            </nav>
            <div className="sim-header-right">
                <button className="sim-header-cta">{content.headerCtaButton}</button>
            </div>
        </header>
    );
}

export default Header;