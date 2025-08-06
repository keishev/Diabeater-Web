// src/Services/FirebaseMarketingContentService.js

// ALL IMPORTS MUST BE AT THE TOP OF THE FILE
import { doc, getDoc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import MarketingContentModel from '../Models/MarketingContentModel'; // Assuming this exists at this path

// Define the default content directly here, as it's specific to this service's domain.
const defaultMarketingContent = {
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
    youtubeVideoLink: "https://www.youtube.com/embed/your_video_id", // New field with a default link

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
    appStoreLink: "#",
    googlePlayLink: "#",

    // Footer Content
    footerAboutText: "DiaBeater is committed to providing innovative tools for diabetes management.",
    footerContactEmail: "info@diabeater.com",
    footerContactPhone: "(123) 456-7890",
    footerAddress: "123 Health Ave, Wellness City, DI 54321",
    footerCopyright: `© ${new Date().getFullYear()} DiaBeater. All rights reserved.`,
    footerPrivacyPolicy: "Privacy Policy",
    footerTermsOfService: "Terms of Service",
};


class FirebaseMarketingContentService {
    // Accept db and auth instances via constructor
    constructor(firestoreInstance, authInstance) {
        if (!firestoreInstance) {
            throw new Error("FirebaseMarketingContentService requires a Firestore instance.");
        }
        this.db = firestoreInstance;
        this.auth = authInstance; // Auth might not be used directly in this service, but good practice to pass if needed.
        this.collectionName = "marketingWebsite";
        this.documentId = "currentContent";
        this.documentRef = doc(this.db, this.collectionName, this.documentId);
        console.log("FirebaseMarketingContentService initialized with Firestore.");
    }

    // Helper to initialize default content if it doesn't exist
    async _initializeContentIfMissing() {
        const docSnap = await getDoc(this.documentRef);
        if (!docSnap.exists()) {
            console.log("Marketing content not found in Firestore. Initializing with default.");
            await setDoc(this.documentRef, defaultMarketingContent);
            console.log("Default marketing content written to Firestore.");
        }
    }

    async fetchContent() {
        try {
            await this._initializeContentIfMissing(); // Ensure default content exists
            const docSnap = await getDoc(this.documentRef);
            if (docSnap.exists()) {
                return new MarketingContentModel(docSnap.data());
            } else {
                console.warn("Marketing content document not found after initialization. Returning default.");
                return new MarketingContentModel(defaultMarketingContent);
            }
        } catch (error) {
            console.error("Error fetching marketing content from Firebase:", error);
            throw error;
        }
    }

    /**
     * Sets up a real-time listener for marketing content changes.
     * @param {function} callback - Function to call with the new data when changes occur.
     * The callback receives (newContent, error)
     * @returns {function} An unsubscribe function to stop listening to updates.
     */
    onContentChange(callback) {
        return onSnapshot(this.documentRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(new MarketingContentModel(docSnap.data()), null); // Pass null for error on success
            } else {
                callback(null, null); // Document deleted or not found, no error
            }
        }, (error) => {
            console.error("Error listening to marketing content changes:", error);
            callback(null, error); // Pass error to callback
        });
    }

    async updateContentField(key, value) {
        try {
            await updateDoc(this.documentRef, { [key]: value });
            console.log(`Firebase: Successfully updated ${key}.`);
        } catch (error) {
            console.error(`Firebase: Error updating ${key}:`, error);
            throw error;
        }
    }

    async updateAllContent(contentObject) {
        try {
            const dataToUpdate = contentObject instanceof MarketingContentModel ? contentObject.toFirestore() : contentObject;
            await setDoc(this.documentRef, dataToUpdate, { merge: true });
            console.log("Firebase: Successfully updated all marketing content.");
        } catch (error) {
            console.error("Firebase: Error updating all marketing content:", error);
            throw error;
        }
    }

    async stopHosting() {
        console.log("Firebase Service: Initiating stop hosting process (simulated).");
        // In a real scenario, you'd call a Cloud Function or another backend endpoint here
        // or update a specific document field that triggers hosting changes.
        // For now, let's update a field to reflect "stopped" status in Firestore.
        try {
            await updateDoc(this.documentRef, { isHosted: false }); // Example field
            console.log("Website hosting status updated to disabled in Firestore.");
            return true;
        } catch (error) {
            console.error("Error updating hosting status in Firestore:", error);
            throw error;
        }
    }
}

export default FirebaseMarketingContentService;