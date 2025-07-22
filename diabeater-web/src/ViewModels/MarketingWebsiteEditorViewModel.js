// src/ViewModels/MarketingWebsiteEditorViewModel.js
import { useState, useEffect } from 'react';
import MarketingContentRepository from '../Repositories/MarketingContentRepository';
import { db } from '../firebase'; // <-- Changed from '../firebaseConfig' to '../firebase'

// Instantiate the repository once outside of any function or hook.
// Pass the Firestore instance to the repository.
const repository = new MarketingContentRepository(db);

/**
 * Custom React Hook for managing marketing website content.
 * This hook handles fetching, loading state, error handling, and real-time updates.
 *
 * @returns {object} An object containing:
 * - websiteContent: The marketing content data.
 * - loading: A boolean indicating if content is currently being loaded.
 * - error: Any error message encountered during loading or updates.
 * - setWebsiteContent: A state setter function to manually update content (if needed).
 */
export function useWebsiteContent() {
    const [websiteContent, setWebsiteContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true; // Flag to prevent state updates on unmounted components

        const fetchContent = async () => {
            try {
                setLoading(true); // Indicate loading has started
                const content = await repository.getMarketingContent();
                if (isMounted) {
                    setWebsiteContent(content);
                    setError(null); // Clear any previous errors on successful fetch
                }
            } catch (err) {
                console.error("MarketingWebsiteEditorViewModel: Error fetching marketing content:", err);
                if (isMounted) {
                    setError("Failed to load marketing content. Please try again.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false); // Ensure loading state is reset
                }
            }
        };

        fetchContent();

        // Setup real-time listener for immediate updates from the backend (e.g., Firestore).
        const unsubscribe = repository.subscribeToMarketingContent((newContent, err) => {
            if (isMounted) {
                if (err) {
                    console.error("MarketingWebsiteEditorViewModel: Real-time update error:", err);
                    setError("Real-time content updates failed.");
                } else {
                    setWebsiteContent(newContent);
                    setLoading(false); // Content is now loaded or updated
                    setError(null);
                }
            }
        });

        // Cleanup function for useEffect: runs when the component using this hook unmounts.
        return () => {
            isMounted = false; // Set flag to false to prevent state updates after unmount
            if (unsubscribe) {
                unsubscribe(); // Clean up real-time listener to prevent memory leaks
            }
        };
    }, []); // Empty dependency array means this effect runs once on mount

    // Return the reactive state and setter that the consuming React component needs.
    return { websiteContent, loading, error, setWebsiteContent };
}

/**
 * Saves a specific field of the marketing content.
 * This is a standalone async function, not a React Hook.
 *
 * @param {string} key - The key of the content field to update (e.g., 'heroTitle').
 * @param {any} value - The new value for the content field.
 * @returns {Promise<boolean>} True if save was successful, false otherwise.
 * @throws {Error} If the save operation fails.
 */
export async function saveContentField(key, value) {
    try {
        await repository.updateMarketingContentField(key, value);
        console.log(`MarketingWebsiteEditorViewModel: Saved ${key}: ${value}`);
        return true;
    } catch (error) {
        console.error(`MarketingWebsiteEditorViewModel: Failed to save ${key}:`, error);
        throw error;
    }
}

/**
 * Disables the public hosting of the marketing website.
 * This is a standalone async function, not a React Hook.
 *
 * @throws {Error} If the operation to stop hosting fails.
 */
export async function stopHostingWebsite() {
    try {
        await repository.stopMarketingWebsiteHosting();
        console.log("MarketingWebsiteEditorViewModel: Marketing website hosting stopped.");
    } catch (error) {
        console.error("MarketingWebsiteEditorViewModel: Failed to stop hosting:", error);
        throw error;
    }
}