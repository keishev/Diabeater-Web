// src/Admin/components/MarketingWebsiteSimulator.js
import React from 'react';
import Header from './simulator/Header'; // New component path
import Hero from './simulator/Hero'; // New component path
import Features from './simulator/Features'; // New component path
import Testimonials from './simulator/Testimonials'; // New component path
import Nutritionists from './simulator/Nutritionists'; // New component path
import Gamification from './simulator/Gamification'; // New component path
import FeaturesComparison from './simulator/FeaturesComparison'; // New component path
import DownloadCTA from './simulator/DownloadCTA'; // New component path
import Footer from './simulator/Footer'; // New component path

import './MarketingWebsiteSimulator.css'; // Main wrapper CSS for the simulator
import './simulator/index.css'; // Global styles for the simulator's content

function MarketingWebsiteSimulator({ content }) {
    return (
        <div className="website-simulator">
            <h4 className="simulator-header">Live Preview of Marketing Website</h4>
            <div className="simulator-content-area">
                {/* Render the modular components, passing relevant content */}
                <Header content={content} />
                <main>
                    <Hero content={content} /> {/* Hero is now a separate component */}
                    <Features content={content} />
                    <Testimonials content={content} />
                    <Nutritionists content={content} />
                    <Gamification content={content} />
                    <FeaturesComparison content={content} />
                    <DownloadCTA content={content} />
                </main>
                <Footer content={content} />
            </div>
        </div>
    );
}

export default MarketingWebsiteSimulator;