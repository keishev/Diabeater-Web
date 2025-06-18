// src/Admin/components/simulator/Nutritionists.js
import React from 'react';
import './Nutritionists.css';

function Nutritionists({ content }) {
    return (
        <section className="sim-nutritionists-section">
            <h2 className="sim-section-heading">{content.nutritionistsSectionTitle}</h2>
            <div className="sim-nutritionist-grid">
                <div className="sim-nutritionist-card">
                    <img src="https://via.placeholder.com/100/1e525c/FFFFFF?text=NW1" alt="Nutritionist 1" className="sim-nutritionist-img" />
                    <h3>{content.nutritionist1Name}</h3>
                    <p>{content.nutritionist1Bio}</p>
                </div>
                <div className="sim-nutritionist-card">
                    <img src="https://via.placeholder.com/100/1e525c/FFFFFF?text=NW2" alt="Nutritionist 2" className="sim-nutritionist-img" />
                    <h3>{content.nutritionist2Name}</h3>
                    <p>{content.nutritionist2Bio}</p>
                </div>
                <div className="sim-nutritionist-card">
                    <img src="https://via.placeholder.com/100/1e525c/FFFFFF?text=NW3" alt="Nutritionist 3" className="sim-nutritionist-img" />
                    <h3>{content.nutritionist3Name}</h3>
                    <p>{content.nutritionist3Bio}</p>
                </div>
            </div>
        </section>
    );
}

export default Nutritionists;