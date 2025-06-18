import React, { useState, useEffect } from 'react';

// This component is reusable for different sections (hero, features, about, etc.)
function MarketingEditorSection({ title, initialContent, contentType = 'text', onSave }) {
    const [content, setContent] = useState(initialContent);
    const [isEditing, setIsEditing] = useState(false);

    // Update internal state if initialContent prop changes (e.g., when loading different sections)
    useEffect(() => {
        setContent(initialContent);
    }, [initialContent]);

    const handleSave = () => {
        onSave(title, content); // Pass section title and new content to parent
        setIsEditing(false);
    };

    return (
        <div className="editor-section">
            <h3 className="editor-section-title">{title}</h3>
            {isEditing ? (
                <>
                    {contentType === 'textarea' ? (
                        <textarea
                            className="editor-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="5"
                        />
                    ) : (
                        <input
                            type="text"
                            className="editor-input"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    )}
                    <div className="editor-actions">
                        <button className="save-button" onClick={handleSave}>Save</button>
                        <button className="cancel-button" onClick={() => { setContent(initialContent); setIsEditing(false); }}>Cancel</button>
                    </div>
                </>
            ) : (
                <>
                    <p className="display-content">{content}</p>
                    <button className="edit-button" onClick={() => setIsEditing(true)}>Edit</button>
                </>
            )}
        </div>
    );
}

export default MarketingEditorSection;