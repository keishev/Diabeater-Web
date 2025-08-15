// src/ViewModels/MarketingWebsiteEditorViewModel.js
import { useState, useEffect } from 'react';
import MarketingContentRepository from '../Repositories/MarketingContentRepository';
import { db } from '../firebase'; 


const repository = new MarketingContentRepository(db);

/**
 * @returns {object}
 */
export function useWebsiteContent() {
    const [websiteContent, setWebsiteContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true; 

        const fetchContent = async () => {
            try {
                setLoading(true); 
                const content = await repository.getMarketingContent();
                if (isMounted) {
                    setWebsiteContent(content);
                    setError(null); 
                }
            } catch (err) {
                console.error("MarketingWebsiteEditorViewModel: Error fetching marketing content:", err);
                if (isMounted) {
                    setError("Failed to load marketing content. Please try again.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false); 
                }
            }
        };

        fetchContent();

        
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

        
        return () => {
            isMounted = false; 
            if (unsubscribe) {
                unsubscribe(); 
            }
        };
    }, []); 

    
    return { websiteContent, loading, error, setWebsiteContent };
}

/**

 * @param {string} key 
 * @param {any} value
 * @returns {Promise<boolean>} 
 * @throws {Error} 
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

 * @throws {Error}
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