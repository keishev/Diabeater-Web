// src/Admin/MarketingWebsiteEditorPage.js
import React, { useState } from 'react';
import MarketingEditorSection from './components/MarketingEditorSection';
import MarketingWebsiteSimulator from './components/MarketingWebsiteSimulator';
import ConfirmationModal from './components/ConfirmationModal'; // <--- NEW: Import the modal
import './MarketingWebsiteEditorPage.css';

function MarketingWebsiteEditorPage() {
    // State for the modal visibility
    const [showStopHostingModal, setShowStopHostingModal] = useState(false); // <--- NEW STATE

    // Existing website content state
    const [websiteContent, setWebsiteContent] = useState({
        // Header Content
        headerLogoText: "DiaBeater",
        headerNavHome: "Home",
        headerNavFeatures: "Features",
        headerNavAbout: "About Us",
        headerNavContact: "Contact",
        headerCtaButton: "Sign Up",

        // Hero Section Content
        heroTitle: "Welcome to DiaBeater - Manage Your Diabetes Easily!",
        heroSubtitle: "Empowering you with tools for better health management.",
        heroCtaText: "Start Your Journey",

        // Features Section Content
        featuresSectionTitle: "Key Features",
        feature1Title: "Personalized Meal Plans",
        feature1Description: "Get meal plans tailored to your dietary needs and health goals, updated regularly.",
        feature2Title: "Glucose Tracking & Analytics",
        feature2Description: "Monitor your glucose levels with intuitive graphs and detailed reports for better insights.",
        feature3Title: "Secure Data Storage",
        feature3Description: "Your health data is securely stored and accessible anytime, anywhere, ensuring privacy.",
        feature4Title: "Direct Nutritionist Support",
        feature4Description: "Connect directly with certified nutritionists for expert advice and personalized guidance.",

        // Testimonials Section Content
        testimonialsSectionTitle: "What Our Users Say",
        testimonial1Text: "DiaBeater changed my life! Managing my diabetes has never been easier and more effective.",
        testimonial1Author: "Sarah M., Happy User",
        testimonial2Text: "The personalized meal plans are a game-changer. I've seen significant improvements in my health.",
        testimonial2Author: "David P., Premium Member",
        testimonial3Text: "Excellent support from nutritionists and a very user-friendly interface. Highly recommend this app!",
        testimonial3Author: "Emily R., New Client",

        // Nutritionists Section Content
        nutritionistsSectionTitle: "Meet Our Expert Nutritionists",
        nutritionist1Name: "Dr. Emily White",
        nutritionist1Bio: "Specializing in diabetic nutrition with over 10 years of experience helping patients.",
        nutritionist2Name: "Mark Johnson, RD",
        nutritionist2Bio: "A registered dietitian passionate about holistic health and personalized care plans.",
        nutritionist3Name: "Sophia Chen, MPH",
        nutritionist3Bio: "Focuses on preventative care and lifestyle modifications for long-term wellness.",

        // Gamification Section Content
        gamificationSectionTitle: "Stay Motivated with Gamification",
        gamificationDescription: "Earn points, unlock badges, and compete with friends to make managing diabetes fun, engaging, and rewarding!",
        gamificationFeature1: "Daily Challenges",
        gamificationFeature2: "Achievement Badges",
        gamificationFeature3: "Leaderboards",

        // Features Comparison Section Content
        featuresComparisonTitle: "Basic vs. Premium Features",
        basicHeader: "Basic Plan",
        premiumHeader: "Premium Plan",
        basicFeatureList: [
            "Basic Glucose Tracking",
            "Standard Meal Ideas",
            "Community Forum Access"
        ],
        premiumFeatureList: [
            "Advanced Glucose Analytics",
            "Personalized Meal Plans",
            "Direct Nutritionist Chat",
            "Premium Content Library",
            "Exclusive Webinars"
        ],
        comparisonCtaText: "Upgrade Now",

        // Download CTA Section Content
        downloadCTATitle: "Download DiaBeater Today!",
        downloadCTASubtitle: "Available on iOS and Android. Start your journey to better health now.",
        appStoreLink: "#", // Placeholder for actual link
        googlePlayLink: "#", // Placeholder for actual link

        // Footer Content
        footerAboutText: "DiaBeater is committed to providing innovative tools for diabetes management.",
        footerContactEmail: "info@diabeater.com",
        footerContactPhone: "(123) 456-7890",
        footerAddress: "123 Health Ave, Wellness City, DI 54321",
        footerCopyright: `© ${new Date().getFullYear()} DiaBeater. All rights reserved.`,
        footerPrivacyPolicy: "Privacy Policy",
        footerTermsOfService: "Terms of Service",
    });

    const handleSaveContent = (key, value) => {
        setWebsiteContent(prevContent => ({
            ...prevContent,
            [key]: value,
        }));
    };

    // --- NEW MODAL HANDLERS ---
    const handleStopHostingClick = () => {
        setShowStopHostingModal(true); // Open the modal
    };

    const confirmStopHosting = () => {
        // In a real application, you would send an API request here
        // to actually stop hosting the website.
        console.log("STOP HOSTING WEBSITE confirmed!");
        alert("Marketing website hosting stopped!");
        setShowStopHostingModal(false); // Close the modal
        // You might want to redirect the user or disable parts of the page here
    };

    const cancelStopHosting = () => {
        setShowStopHostingModal(false); // Close the modal
    };
    // --- END NEW MODAL HANDLERS ---

    return (
        <div className="marketing-editor-page">
            <h1 className="editor-main-title">Edit Marketing Website Content</h1>

            <div className="editor-sections-container">
                {/* ... (Your existing MarketingEditorSection components for Header, Hero, Features, etc.) ... */}
                {/* Header */}
                <MarketingEditorSection title="Header Logo Text" initialContent={websiteContent.headerLogoText} onSave={(val) => handleSaveContent('headerLogoText', val)} contentType="text" />
                <MarketingEditorSection title="Header Nav Home" initialContent={websiteContent.headerNavHome} onSave={(val) => handleSaveContent('headerNavHome', val)} contentType="text" />
                <MarketingEditorSection title="Header Nav Features" initialContent={websiteContent.headerNavFeatures} onSave={(val) => handleSaveContent('headerNavFeatures', val)} contentType="text" />
                <MarketingEditorSection title="Header Nav About Us" initialContent={websiteContent.headerNavAbout} onSave={(val) => handleSaveContent('headerNavAbout', val)} contentType="text" />
                <MarketingEditorSection title="Header Nav Contact" initialContent={websiteContent.headerNavContact} onSave={(val) => handleSaveContent('headerNavContact', val)} contentType="text" />
                <MarketingEditorSection title="Header CTA Button Text" initialContent={websiteContent.headerCtaButton} onSave={(val) => handleSaveContent('headerCtaButton', val)} contentType="text" />

                {/* Hero Section */}
                <MarketingEditorSection title="Hero Title" initialContent={websiteContent.heroTitle} onSave={(val) => handleSaveContent('heroTitle', val)} contentType="text" />
                <MarketingEditorSection title="Hero Subtitle" initialContent={websiteContent.heroSubtitle} onSave={(val) => handleSaveContent('heroSubtitle', val)} contentType="textarea" />
                <MarketingEditorSection title="Hero CTA Text" initialContent={websiteContent.heroCtaText} onSave={(val) => handleSaveContent('heroCtaText', val)} contentType="text" />

                {/* Features Section */}
                <MarketingEditorSection title="Features Section Title" initialContent={websiteContent.featuresSectionTitle} onSave={(val) => handleSaveContent('featuresSectionTitle', val)} contentType="text" />
                <MarketingEditorSection title="Feature 1 Title" initialContent={websiteContent.feature1Title} onSave={(val) => handleSaveContent('feature1Title', val)} contentType="text" />
                <MarketingEditorSection title="Feature 1 Description" initialContent={websiteContent.feature1Description} onSave={(val) => handleSaveContent('feature1Description', val)} contentType="textarea" />
                <MarketingEditorSection title="Feature 2 Title" initialContent={websiteContent.feature2Title} onSave={(val) => handleSaveContent('feature2Title', val)} contentType="text" />
                <MarketingEditorSection title="Feature 2 Description" initialContent={websiteContent.feature2Description} onSave={(val) => handleSaveContent('feature2Description', val)} contentType="textarea" />
                <MarketingEditorSection title="Feature 3 Title" initialContent={websiteContent.feature3Title} onSave={(val) => handleSaveContent('feature3Title', val)} contentType="text" />
                <MarketingEditorSection title="Feature 3 Description" initialContent={websiteContent.feature3Description} onSave={(val) => handleSaveContent('feature3Description', val)} contentType="textarea" />
                <MarketingEditorSection title="Feature 4 Title" initialContent={websiteContent.feature4Title} onSave={(val) => handleSaveContent('feature4Title', val)} contentType="text" />
                <MarketingEditorSection title="Feature 4 Description" initialContent={websiteContent.feature4Description} onSave={(val) => handleSaveContent('feature4Description', val)} contentType="textarea" />

                {/* Testimonials */}
                <MarketingEditorSection title="Testimonials Section Title" initialContent={websiteContent.testimonialsSectionTitle} onSave={(val) => handleSaveContent('testimonialsSectionTitle', val)} contentType="text" />
                <MarketingEditorSection title="Testimonial 1 Text" initialContent={websiteContent.testimonial1Text} onSave={(val) => handleSaveContent('testimonial1Text', val)} contentType="textarea" />
                <MarketingEditorSection title="Testimonial 1 Author" initialContent={websiteContent.testimonial1Author} onSave={(val) => handleSaveContent('testimonial1Author', val)} contentType="text" />
                <MarketingEditorSection title="Testimonial 2 Text" initialContent={websiteContent.testimonial2Text} onSave={(val) => handleSaveContent('testimonial2Text', val)} contentType="textarea" />
                <MarketingEditorSection title="Testimonial 2 Author" initialContent={websiteContent.testimonial2Author} onSave={(val) => handleSaveContent('testimonial2Author', val)} contentType="text" />
                <MarketingEditorSection title="Testimonial 3 Text" initialContent={websiteContent.testimonial3Text} onSave={(val) => handleSaveContent('testimonial3Text', val)} contentType="textarea" />
                <MarketingEditorSection title="Testimonial 3 Author" initialContent={websiteContent.testimonial3Author} onSave={(val) => handleSaveContent('testimonial3Author', val)} contentType="text" />


                {/* Nutritionists */}
                <MarketingEditorSection title="Nutritionists Section Title" initialContent={websiteContent.nutritionistsSectionTitle} onSave={(val) => handleSaveContent('nutritionistsSectionTitle', val)} contentType="text" />
                <MarketingEditorSection title="Nutritionist 1 Name" initialContent={websiteContent.nutritionist1Name} onSave={(val) => handleSaveContent('nutritionist1Name', val)} contentType="text" />
                <MarketingEditorSection title="Nutritionist 1 Bio" initialContent={websiteContent.nutritionist1Bio} onSave={(val) => handleSaveContent('nutritionist1Bio', val)} contentType="textarea" />
                <MarketingEditorSection title="Nutritionist 2 Name" initialContent={websiteContent.nutritionist2Name} onSave={(val) => handleSaveContent('nutritionist2Name', val)} contentType="text" />
                <MarketingEditorSection title="Nutritionist 2 Bio" initialContent={websiteContent.nutritionist2Bio} onSave={(val) => handleSaveContent('nutritionist2Bio', val)} contentType="textarea" />
                <MarketingEditorSection title="Nutritionist 3 Name" initialContent={websiteContent.nutritionist3Name} onSave={(val) => handleSaveContent('nutritionist3Name', val)} contentType="text" />
                <MarketingEditorSection title="Nutritionist 3 Bio" initialContent={websiteContent.nutritionist3Bio} onSave={(val) => handleSaveContent('nutritionist3Bio', val)} contentType="textarea" />


                {/* Gamification */}
                <MarketingEditorSection title="Gamification Section Title" initialContent={websiteContent.gamificationSectionTitle} onSave={(val) => handleSaveContent('gamificationSectionTitle', val)} contentType="text" />
                <MarketingEditorSection title="Gamification Description" initialContent={websiteContent.gamificationDescription} onSave={(val) => handleSaveContent('gamificationDescription', val)} contentType="textarea" />
                <MarketingEditorSection title="Gamification Feature 1" initialContent={websiteContent.gamificationFeature1} onSave={(val) => handleSaveContent('gamificationFeature1', val)} contentType="text" />
                <MarketingEditorSection title="Gamification Feature 2" initialContent={websiteContent.gamificationFeature2} onSave={(val) => handleSaveContent('gamificationFeature2', val)} contentType="text" />
                <MarketingEditorSection title="Gamification Feature 3" initialContent={websiteContent.gamificationFeature3} onSave={(val) => handleSaveContent('gamificationFeature3', val)} contentType="text" />


                {/* Features Comparison */}
                <MarketingEditorSection title="Features Comparison Title" initialContent={websiteContent.featuresComparisonTitle} onSave={(val) => handleSaveContent('featuresComparisonTitle', val)} contentType="text" />
                <MarketingEditorSection title="Basic Plan Header" initialContent={websiteContent.basicHeader} onSave={(val) => handleSaveContent('basicHeader', val)} contentType="text" />
                <MarketingEditorSection title="Premium Plan Header" initialContent={websiteContent.premiumHeader} onSave={(val) => handleSaveContent('premiumHeader', val)} contentType="text" />
                {/* For lists like these, you might need a more advanced editor section or handle as single string */}
                <MarketingEditorSection title="Basic Features (comma-separated)" initialContent={websiteContent.basicFeatureList.join(', ')} onSave={(val) => handleSaveContent('basicFeatureList', val.split(',').map(item => item.trim()))} contentType="textarea" />
                <MarketingEditorSection title="Premium Features (comma-separated)" initialContent={websiteContent.premiumFeatureList.join(', ')} onSave={(val) => handleSaveContent('premiumFeatureList', val.split(',').map(item => item.trim()))} contentType="textarea" />
                <MarketingEditorSection title="Comparison CTA Text" initialContent={websiteContent.comparisonCtaText} onSave={(val) => handleSaveContent('comparisonCtaText', val)} contentType="text" />


                {/* Download CTA */}
                <MarketingEditorSection title="Download CTA Title" initialContent={websiteContent.downloadCTATitle} onSave={(val) => handleSaveContent('downloadCTATitle', val)} contentType="text" />
                <MarketingEditorSection title="Download CTA Subtitle" initialContent={websiteContent.downloadCTASubtitle} onSave={(val) => handleSaveContent('downloadCTASubtitle', val)} contentType="textarea" />
                <MarketingEditorSection title="App Store Link" initialContent={websiteContent.appStoreLink} onSave={(val) => handleSaveContent('appStoreLink', val)} contentType="text" />
                <MarketingEditorSection title="Google Play Link" initialContent={websiteContent.googlePlayLink} onSave={(val) => handleSaveContent('googlePlayLink', val)} contentType="text" />


                {/* Footer */}
                <MarketingEditorSection title="Footer About Text" initialContent={websiteContent.footerAboutText} onSave={(val) => handleSaveContent('footerAboutText', val)} contentType="textarea" />
                <MarketingEditorSection title="Footer Contact Email" initialContent={websiteContent.footerContactEmail} onSave={(val) => handleSaveContent('footerContactEmail', val)} contentType="text" />
                <MarketingEditorSection title="Footer Contact Phone" initialContent={websiteContent.footerContactPhone} onSave={(val) => handleSaveContent('footerContactPhone', val)} contentType="text" />
                <MarketingEditorSection title="Footer Address" initialContent={websiteContent.footerAddress} onSave={(val) => handleSaveContent('footerAddress', val)} contentType="textarea" />
                <MarketingEditorSection title="Footer Copyright" initialContent={websiteContent.footerCopyright} onSave={(val) => handleSaveContent('footerCopyright', val)} contentType="text" />
                <MarketingEditorSection title="Footer Privacy Policy Text" initialContent={websiteContent.footerPrivacyPolicy} onSave={(val) => handleSaveContent('footerPrivacyPolicy', val)} contentType="text" />
                <MarketingEditorSection title="Footer Terms of Service Text" initialContent={websiteContent.footerTermsOfService} onSave={(val) => handleSaveContent('footerTermsOfService', val)} contentType="text" />
            </div>

            {/* Marketing Website Simulator */}
            <MarketingWebsiteSimulator content={websiteContent} />

            {/* --- NEW STOP HOSTING BUTTON --- */}
            <div className="stop-hosting-section">
                <button
                    className="stop-hosting-button"
                    onClick={handleStopHostingClick}
                >
                    Stop Hosting Marketing Website
                </button>
            </div>
            {/* --- END NEW STOP HOSTING BUTTON --- */}

            {/* --- NEW CONFIRMATION MODAL --- */}
            <ConfirmationModal
                message="Are you sure you want to stop hosting the marketing website? This action cannot be undone."
                onConfirm={confirmStopHosting}
                onCancel={cancelStopHosting}
                isVisible={showStopHostingModal}
            />
            {/* --- END NEW CONFIRMATION MODAL --- */}
        </div>
    );
}

export default MarketingWebsiteEditorPage;