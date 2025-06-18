// src/Admin/components/simulator/Testimonials.js
import React from 'react';
import './Testimonials.css';

function Testimonials({ content }) {
    return (
        <section className="sim-testimonials-section">
            <h2 className="sim-section-heading">{content.testimonialsSectionTitle}</h2>
            <div className="sim-testimonials-grid">
                <div className="sim-testimonial-card">
                    <p className="sim-testimonial-text">"{content.testimonial1Text}"</p>
                    <p className="sim-testimonial-author">- {content.testimonial1Author}</p>
                </div>
                <div className="sim-testimonial-card">
                    <p className="sim-testimonial-text">"{content.testimonial2Text}"</p>
                    <p className="sim-testimonial-author">- {content.testimonial2Author}</p>
                </div>
                <div className="sim-testimonial-card">
                    <p className="sim-testimonial-text">"{content.testimonial3Text}"</p>
                    <p className="sim-testimonial-author">- {content.testimonial3Author}</p>
                </div>
            </div>
        </section>
    );
}

export default Testimonials;