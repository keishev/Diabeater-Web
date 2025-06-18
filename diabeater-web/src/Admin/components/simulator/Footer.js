// src/Admin/components/simulator/Footer.js
import React from 'react';
import './Footer.css';

function Footer({ content }) {
    return (
        <footer className="sim-footer-section">
            <div className="sim-footer-content">
                <div className="sim-footer-col">
                    <h4>About DiaBeater</h4>
                    <p>{content.footerAboutText}</p>
                </div>
                <div className="sim-footer-col">
                    <h4>Contact Us</h4>
                    <p>Email: <a href={`mailto:${content.footerContactEmail}`}>{content.footerContactEmail}</a></p>
                    <p>Phone: {content.footerContactPhone}</p>
                    <p>{content.footerAddress}</p>
                </div>
                <div className="sim-footer-col">
                    <h4>Legal</h4>
                    <p><a href="#privacy">{content.footerPrivacyPolicy}</a></p>
                    <p><a href="#terms">{content.footerTermsOfService}</a></p>
                </div>
            </div>
            <div className="sim-footer-bottom">
                <p>{content.footerCopyright}</p>
            </div>
        </footer>
    );
}

export default Footer;