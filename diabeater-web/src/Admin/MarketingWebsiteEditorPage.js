//admin

import React, { useState } from 'react';
import MarketingEditorSection from './components/MarketingEditorSection';
import MarketingWebsiteSimulator from './components/MarketingWebsiteSimulator';
import ConfirmationModal from './components/ConfirmationModal';
import APKUploadWidget from './APKUploadWidget';
import './MarketingWebsiteEditorPage.css'; 
import './components/MarketingWebsiteSimulator.css'; 
import './components/simulator/index.css'; 

import { useWebsiteContent, saveContentField, stopHostingWebsite, uploadAPKFile, deleteAPKFile } from '../ViewModels/MarketingWebsiteEditorViewModel';

function MarketingWebsiteEditorPage() {
    
    const { websiteContent, loading, error, setWebsiteContent } = useWebsiteContent();
    const [showStopHostingModal, setShowStopHostingModal] = useState(false);

    
   const handleSaveContent = async (key, value) => {
    
    let processedValue = value;
    
    if (key === 'basicFeatureList' || key === 'premiumFeatureList') {
        
        processedValue = typeof value === 'string' 
            ? value.split(',').map(item => item.trim()).filter(item => item.length > 0)
            : (Array.isArray(value) ? value : []);
        
        console.log(`Processing ${key}:`, value, '→', processedValue);
    }
    
    
    setWebsiteContent(prevContent => ({
        ...prevContent,
        [key]: processedValue,
    }));
    
    try {
        
        await saveContentField(key, processedValue);
        console.log(`Successfully saved ${key}:`, processedValue);
        return true; 
    } catch (err) {
        console.error("MarketingWebsiteEditorPage: Failed to save content:", err);
        
        setWebsiteContent(prevContent => ({
            ...prevContent,
            [key]: websiteContent[key], 
        }));
        throw err; 
    }
};

    const handleAPKUpload = async (file) => {
        try {
            const downloadURL = await uploadAPKFile(file);
            console.log("APK uploaded successfully:", downloadURL);
            return downloadURL;
        } catch (error) {
            console.error("Failed to upload APK:", error);
            throw error;
        }
    };

    const handleAPKDelete = async (fileName) => {
        try {
            await deleteAPKFile(fileName);
            console.log("APK deleted successfully");
        } catch (error) {
            console.error("Failed to delete APK:", error);
            throw error;
        }
    };

    const handleStopHostingClick = () => {
        setShowStopHostingModal(true);
    };

    const confirmStopHosting = async () => {
        try {
            
            await stopHostingWebsite();
            alert("Marketing website hosting stopped! (Action triggered)");
        } catch (error) {
            alert(`Failed to stop hosting: ${error.message}`);
        } finally {
            setShowStopHostingModal(false);
        }
    };

    const cancelStopHosting = () => {
        setShowStopHostingModal(false);
    };

    if (loading) {
        return <div className="marketing-editor-page">Loading editor...</div>;
    }

    if (error) {
        return <div className="marketing-editor-page">Error: {error}</div>;
    }

    return (
        <div className="marketing-editor-page">
            <h1 className="editor-main-title">EDIT MARKETING WEBSITE</h1>

            <div className="editor-sections-container">
                {/* Header Section */}
                <MarketingEditorSection title="Header Logo Text" initialContent={websiteContent?.headerLogoText} onSave={handleSaveContent} contentKey="headerLogoText" />
                <MarketingEditorSection title="Header Nav Home" initialContent={websiteContent?.headerNavHome} onSave={handleSaveContent} contentKey="headerNavHome" />
                <MarketingEditorSection title="Header Nav Features" initialContent={websiteContent?.headerNavFeatures} onSave={handleSaveContent} contentKey="headerNavFeatures" />
                <MarketingEditorSection title="Header Nav About Us" initialContent={websiteContent?.headerNavAbout} onSave={handleSaveContent} contentKey="headerNavAbout" />
                <MarketingEditorSection title="Header Nav Contact" initialContent={websiteContent?.headerNavContact} onSave={handleSaveContent} contentKey="headerNavContact" />
                <MarketingEditorSection title="Header CTA Button Text" initialContent={websiteContent?.headerCtaButton} onSave={handleSaveContent} contentKey="headerCtaButton" />

                {/* Hero Section */}
                <MarketingEditorSection title="Hero Title" initialContent={websiteContent?.heroTitle} onSave={handleSaveContent} contentKey="heroTitle" />
                <MarketingEditorSection title="Hero Subtitle" initialContent={websiteContent?.heroSubtitle} onSave={handleSaveContent} contentKey="heroSubtitle" contentType="textarea" />
                <MarketingEditorSection title="Hero CTA Text" initialContent={websiteContent?.heroCtaText} onSave={handleSaveContent} contentKey="heroCtaText" />

                {/* YouTube Video Section */}
                <MarketingEditorSection title="YouTube Video Link" initialContent={websiteContent?.youtubeVideoLink} onSave={handleSaveContent} contentKey="youtubeVideoLink" />
                
                {/* Features Section */}
                <MarketingEditorSection title="Features Section Title" initialContent={websiteContent?.featuresSectionTitle} onSave={handleSaveContent} contentKey="featuresSectionTitle" />
                <MarketingEditorSection title="Feature 1 Title" initialContent={websiteContent?.feature1Title} onSave={handleSaveContent} contentKey="feature1Title" />
                <MarketingEditorSection title="Feature 1 Description" initialContent={websiteContent?.feature1Description} onSave={handleSaveContent} contentKey="feature1Description" contentType="textarea" />
                <MarketingEditorSection title="Feature 2 Title" initialContent={websiteContent?.feature2Title} onSave={handleSaveContent} contentKey="feature2Title" />
                <MarketingEditorSection title="Feature 2 Description" initialContent={websiteContent?.feature2Description} onSave={handleSaveContent} contentKey="feature2Description" contentType="textarea" />
                <MarketingEditorSection title="Feature 3 Title" initialContent={websiteContent?.feature3Title} onSave={handleSaveContent} contentKey="feature3Title" />
                <MarketingEditorSection title="Feature 3 Description" initialContent={websiteContent?.feature3Description} onSave={handleSaveContent} contentKey="feature3Description" contentType="textarea" />
                <MarketingEditorSection title="Feature 4 Title" initialContent={websiteContent?.feature4Title} onSave={handleSaveContent} contentKey="feature4Title" />
                <MarketingEditorSection title="Feature 4 Description" initialContent={websiteContent?.feature4Description} onSave={handleSaveContent} contentKey="feature4Description" contentType="textarea" />

                {/* Testimonials Section */}
                <MarketingEditorSection title="Testimonials Section Title" initialContent={websiteContent?.testimonialsSectionTitle} onSave={handleSaveContent} contentKey="testimonialsSectionTitle" />
                <MarketingEditorSection title="Testimonial 1 Text" initialContent={websiteContent?.testimonial1Text} onSave={handleSaveContent} contentKey="testimonial1Text" contentType="textarea" />
                <MarketingEditorSection title="Testimonial 1 Author" initialContent={websiteContent?.testimonial1Author} onSave={handleSaveContent} contentKey="testimonial1Author" />
                <MarketingEditorSection title="Testimonial 2 Text" initialContent={websiteContent?.testimonial2Text} onSave={handleSaveContent} contentKey="testimonial2Text" contentType="textarea" />
                <MarketingEditorSection title="Testimonial 2 Author" initialContent={websiteContent?.testimonial2Author} onSave={handleSaveContent} contentKey="testimonial2Author" />
                <MarketingEditorSection title="Testimonial 3 Text" initialContent={websiteContent?.testimonial3Text} onSave={handleSaveContent} contentKey="testimonial3Text" contentType="textarea" />
                <MarketingEditorSection title="Testimonial 3 Author" initialContent={websiteContent?.testimonial3Author} onSave={handleSaveContent} contentKey="testimonial3Author" />

                {/* Nutritionists Section */}
                <MarketingEditorSection title="Nutritionists Section Title" initialContent={websiteContent?.nutritionistsSectionTitle} onSave={handleSaveContent} contentKey="nutritionistsSectionTitle" />
                <MarketingEditorSection title="Nutritionist 1 Name" initialContent={websiteContent?.nutritionist1Name} onSave={handleSaveContent} contentKey="nutritionist1Name" />
                <MarketingEditorSection title="Nutritionist 1 Bio" initialContent={websiteContent?.nutritionist1Bio} onSave={handleSaveContent} contentKey="nutritionist1Bio" contentType="textarea" />
                <MarketingEditorSection title="Nutritionist 2 Name" initialContent={websiteContent?.nutritionist2Name} onSave={handleSaveContent} contentKey="nutritionist2Name" />
                <MarketingEditorSection title="Nutritionist 2 Bio" initialContent={websiteContent?.nutritionist2Bio} onSave={handleSaveContent} contentKey="nutritionist2Bio" contentType="textarea" />
                <MarketingEditorSection title="Nutritionist 3 Name" initialContent={websiteContent?.nutritionist3Name} onSave={handleSaveContent} contentKey="nutritionist3Name" />
                <MarketingEditorSection title="Nutritionist 3 Bio" initialContent={websiteContent?.nutritionist3Bio} onSave={handleSaveContent} contentKey="nutritionist3Bio" contentType="textarea" />
                <MarketingEditorSection title="Join Us Link" initialContent={websiteContent?.joinUsLink} onSave={handleSaveContent} contentKey="joinUsLink" />

                {/* Gamification Section */}
                <MarketingEditorSection title="Gamification Section Title" initialContent={websiteContent?.gamificationSectionTitle} onSave={handleSaveContent} contentKey="gamificationSectionTitle" />
                <MarketingEditorSection title="Gamification Description" initialContent={websiteContent?.gamificationDescription} onSave={handleSaveContent} contentKey="gamificationDescription" contentType="textarea" />
                <MarketingEditorSection title="Gamification Feature 1" initialContent={websiteContent?.gamificationFeature1} onSave={handleSaveContent} contentKey="gamificationFeature1" />
                <MarketingEditorSection title="Gamification Feature 2" initialContent={websiteContent?.gamificationFeature2} onSave={handleSaveContent} contentKey="gamificationFeature2" />
                <MarketingEditorSection title="Gamification Feature 3" initialContent={websiteContent?.gamificationFeature3} onSave={handleSaveContent} contentKey="gamificationFeature3" />

                {/* Features Comparison Section */}
                <MarketingEditorSection title="Features Comparison Title" initialContent={websiteContent?.featuresComparisonTitle} onSave={handleSaveContent} contentKey="featuresComparisonTitle" />
                <MarketingEditorSection title="Basic Plan Header" initialContent={websiteContent?.basicHeader} onSave={handleSaveContent} contentKey="basicHeader" />
                <MarketingEditorSection title="Premium Plan Header" initialContent={websiteContent?.premiumHeader} onSave={handleSaveContent} contentKey="premiumHeader" />
                
                {/* Array fields for feature lists */}
                <MarketingEditorSection
                    title="Basic Features (comma-separated)"
                    initialContent={Array.isArray(websiteContent?.basicFeatureList) ? websiteContent.basicFeatureList.join(', ') : ''}
                    onSave={handleSaveContent}
                    contentKey="basicFeatureList"
                    contentType="textarea"
                    isArrayField={true}
                />
                <MarketingEditorSection
                    title="Premium Features (comma-separated)"
                    initialContent={Array.isArray(websiteContent?.premiumFeatureList) ? websiteContent.premiumFeatureList.join(', ') : ''}
                    onSave={handleSaveContent}
                    contentKey="premiumFeatureList"
                    contentType="textarea"
                    isArrayField={true}
                />
                <MarketingEditorSection title="Comparison CTA Text" initialContent={websiteContent?.comparisonCtaText} onSave={handleSaveContent} contentKey="comparisonCtaText" />

                {/* Download CTA Section */}
                <MarketingEditorSection title="Download CTA Title" initialContent={websiteContent?.downloadCTATitle} onSave={handleSaveContent} contentKey="downloadCTATitle" />
                <MarketingEditorSection title="Download CTA Subtitle" initialContent={websiteContent?.downloadCTASubtitle} onSave={handleSaveContent} contentKey="downloadCTASubtitle" contentType="textarea" />
                <MarketingEditorSection title="App Store Link" initialContent={websiteContent?.appStoreLink} onSave={handleSaveContent} contentKey="appStoreLink" />
                <MarketingEditorSection title="Google Play Link" initialContent={websiteContent?.googlePlayLink} onSave={handleSaveContent} contentKey="googlePlayLink" />

                {/* APK Upload Widget - NEW */}
                <APKUploadWidget
                    currentAPKUrl={websiteContent?.apkDownloadUrl}
                    currentFileName={websiteContent?.apkFileName}
                    onUpload={handleAPKUpload}
                    onDelete={handleAPKDelete}
                />

                {/* APK Configuration - NEW */}
                <MarketingEditorSection title="APK Fallback Google Drive Link" initialContent={websiteContent?.apkFallbackGDriveLink} onSave={handleSaveContent} contentKey="apkFallbackGDriveLink" />
                <MarketingEditorSection title="APK Fallback Message" initialContent={websiteContent?.apkFallbackMessage} onSave={handleSaveContent} contentKey="apkFallbackMessage" contentType="textarea" />

                {/* Footer Section */}
                <MarketingEditorSection title="Footer About Text" initialContent={websiteContent?.footerAboutText} onSave={handleSaveContent} contentKey="footerAboutText" contentType="textarea" />
                <MarketingEditorSection title="Footer Contact Email" initialContent={websiteContent?.footerContactEmail} onSave={handleSaveContent} contentKey="footerContactEmail" />
                <MarketingEditorSection title="Footer Contact Phone" initialContent={websiteContent?.footerContactPhone} onSave={handleSaveContent} contentKey="footerContactPhone" />
                <MarketingEditorSection title="Footer Address" initialContent={websiteContent?.footerAddress} onSave={handleSaveContent} contentKey="footerAddress" contentType="textarea" />
                <MarketingEditorSection title="Footer Copyright" initialContent={websiteContent?.footerCopyright} onSave={handleSaveContent} contentKey="footerCopyright" />
                <MarketingEditorSection title="Footer Privacy Policy Text" initialContent={websiteContent?.footerPrivacyPolicy} onSave={handleSaveContent} contentKey="footerPrivacyPolicy" />
                <MarketingEditorSection title="Footer Terms of Service Text" initialContent={websiteContent?.footerTermsOfService} onSave={handleSaveContent} contentKey="footerTermsOfService" />
            </div>
        </div>
    );
}

export default MarketingWebsiteEditorPage;