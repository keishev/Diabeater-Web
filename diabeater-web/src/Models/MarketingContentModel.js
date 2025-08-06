// src/models/MarketingContentModel.js

class MarketingContentModel {
    constructor(data = {}) { // Provide a default empty object to destructure from
        // Destructure and assign all properties from the 'data' object.
        // Use the nullish coalescing operator (??) or logical OR (||) for default values
        // to ensure properties always exist and have a sensible initial state.

        // Header Content
        this.headerLogoText = data.headerLogoText ?? "DiaBeater";
        this.headerNavHome = data.headerNavHome ?? "Home";
        this.headerNavFeatures = data.headerNavFeatures ?? "Features";
        this.headerNavAbout = data.headerNavAbout ?? "About Us";
        this.headerNavContact = data.headerNavContact ?? "Contact";
        this.headerCtaButton = data.headerCtaButton ?? "Sign Up";

        // Hero Section Content
        this.heroTitle = data.heroTitle ?? "Welcome to DiaBeater - Manage Your Diabetes Easily!";
        this.heroSubtitle = data.heroSubtitle ?? "Empowering you with tools for better health management.";
        this.heroCtaText = data.heroCtaText ?? "Start Your Journey";
        this.youtubeVideoLink = data.youtubeVideoLink ?? "https://www.youtube.com/watch?v=your_video_id";

        // Features Section Content
        this.featuresSectionTitle = data.featuresSectionTitle ?? "Key Features";
        this.feature1Title = data.feature1Title ?? "Personalized Meal Plans";
        this.feature1Description = data.feature1Description ?? "Get meal plans tailored to your dietary needs and health goals, updated regularly.";
        this.feature2Title = data.feature2Title ?? "Glucose Tracking & Analytics";
        this.feature2Description = data.feature2Description ?? "Monitor your glucose levels with intuitive graphs and detailed reports for better insights.";
        this.feature3Title = data.feature3Title ?? "Secure Data Storage";
        this.feature3Description = data.feature3Description ?? "Your health data is securely stored and accessible anytime, anywhere, ensuring privacy.";
        this.feature4Title = data.feature4Title ?? "Direct Nutritionist Support";
        this.feature4Description = data.feature4Description ?? "Connect directly with certified nutritionists for expert advice and personalized guidance.";

        // Testimonials Section Content
        this.testimonialsSectionTitle = data.testimonialsSectionTitle ?? "What Our Users Say";
        this.testimonial1Text = data.testimonial1Text ?? "DiaBeater changed my life! Managing my diabetes has never been easier and more effective.";
        this.testimonial1Author = data.testimonial1Author ?? "Sarah M., Happy User";
        this.testimonial2Text = data.testimonial2Text ?? "The personalized meal plans are a game-changer. I've seen significant improvements in my health.";
        this.testimonial2Author = data.testimonial2Author ?? "David P., Premium Member";
        this.testimonial3Text = data.testimonial3Text ?? "Excellent support from nutritionists and a very user-friendly interface. Highly recommend this app!";
        this.testimonial3Author = data.testimonial3Author ?? "Emily R., New Client";

        // Nutritionists Section Content
        this.nutritionistsSectionTitle = data.nutritionistsSectionTitle ?? "Meet Our Expert Nutritionists";
        this.nutritionist1Name = data.nutritionist1Name ?? "Dr. Emily White";
        this.nutritionist1Bio = data.nutritionist1Bio ?? "Specializing in diabetic nutrition with over 10 years of experience helping patients.";
        this.nutritionist2Name = data.nutritionist2Name ?? "Mark Johnson, RD";
        this.nutritionist2Bio = data.nutritionist2Bio ?? "A registered dietitian passionate about holistic health and personalized care plans.";
        this.nutritionist3Name = data.nutritionist3Name ?? "Sophia Chen, MPH";
        this.nutritionist3Bio = data.nutritionist3Bio ?? "Focuses on preventative care and lifestyle modifications for long-term wellness.";

        // Gamification Section Content
        this.gamificationSectionTitle = data.gamificationSectionTitle ?? "Stay Motivated with Gamification";
        this.gamificationDescription = data.gamificationDescription ?? "Earn points, unlock badges, and compete with friends to make managing diabetes fun, engaging, and rewarding!";
        this.gamificationFeature1 = data.gamificationFeature1 ?? "Daily Challenges";
        this.gamificationFeature2 = data.gamificationFeature2 ?? "Achievement Badges";
        this.gamificationFeature3 = data.gamificationFeature3 ?? "Leaderboards";

        // Features Comparison Section Content
        this.featuresComparisonTitle = data.featuresComparisonTitle ?? "Basic vs. Premium Features";
        this.basicHeader = data.basicHeader ?? "Basic Plan";
        this.premiumHeader = data.premiumHeader ?? "Premium Plan";
        // Ensure array fields are always arrays, even if the source is null/undefined
        this.basicFeatureList = Array.isArray(data.basicFeatureList) ? data.basicFeatureList : [
            "Basic Glucose Tracking",
            "Standard Meal Ideas",
            "Community Forum Access"
        ];
        this.premiumFeatureList = Array.isArray(data.premiumFeatureList) ? data.premiumFeatureList : [
            "Advanced Glucose Analytics",
            "Personalized Meal Plans",
            "Direct Nutritionist Chat",
            "Premium Content Library",
            "Exclusive Webinars"
        ];
        this.comparisonCtaText = data.comparisonCtaText ?? "Upgrade Now";

        // Download CTA Section Content
        this.downloadCTATitle = data.downloadCTATitle ?? "Download DiaBeater Today!";
        this.downloadCTASubtitle = data.downloadCTASubtitle ?? "Available on iOS and Android. Start your journey to better health now.";
        this.appStoreLink = data.appStoreLink ?? "#"; // Default to a placeholder link
        this.googlePlayLink = data.googlePlayLink ?? "#"; // Default to a placeholder link

        // Footer Content
        this.footerAboutText = data.footerAboutText ?? "DiaBeater is committed to providing innovative tools for diabetes management.";
        this.footerContactEmail = data.footerContactEmail ?? "info@diabeater.com";
        this.footerContactPhone = data.footerContactPhone ?? "(123) 456-7890";
        this.footerAddress = data.footerAddress ?? "123 Health Ave, Wellness City, DI 54321";
        this.footerCopyright = data.footerCopyright ?? `© ${new Date().getFullYear()} DiaBeater. All rights reserved.`;
        this.footerPrivacyPolicy = data.footerPrivacyPolicy ?? "Privacy Policy";
        this.footerTermsOfService = data.footerTermsOfService ?? "Terms of Service";

        // Add any other specific fields that might be used, for example, a hosting status
        this.isHosted = typeof data.isHosted === 'boolean' ? data.isHosted : true; // Default to true if not specified
    }

    /**
     * Converts the MarketingContentModel instance into a plain JavaScript object
     * suitable for saving to Firestore.
     * @returns {object} A plain object representing the model's data.
     */
    toFirestore() {
        // Using spread syntax ({ ...this }) is concise but be mindful if you have methods
        // or complex non-serializable properties on the instance you don't want in Firestore.
        // For simple data models like this, it's generally fine.
        return { ...this };
    }

    /**
     * Creates a new MarketingContentModel instance from a Firestore document snapshot data.
     * This is a static factory method for convenience.
     * @param {object} firestoreData - The data object retrieved directly from a Firestore document.
     * @returns {MarketingContentModel} A new instance of MarketingContentModel.
     */
    static fromFirestore(firestoreData) {
        return new MarketingContentModel(firestoreData);
    }
}

export default MarketingContentModel;