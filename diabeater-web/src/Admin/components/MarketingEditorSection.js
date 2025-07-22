import React, { useState, useEffect } from 'react';

function MarketingEditorSection({ title, initialContent, contentType = 'text', onSave, contentKey }) {
    const [content, setContent] = useState(initialContent);
    const [isEditing, setIsEditing] = useState(false);
    const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'

    // Update internal state if initialContent prop changes
    useEffect(() => {
        setContent(initialContent);
        setSaveStatus(''); // Reset status when content changes externally
    }, [initialContent]);

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            // Pass the contentKey, not the title, to the parent's onSave handler
            const success = await onSave(contentKey, content);
            if (success) {
                setSaveStatus('saved');
                setIsEditing(false);
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            console.error("Error saving content:", error);
            setSaveStatus('error');
            // Optionally, handle error state more visibly
        }
    };

    const handleCancel = () => {
        setContent(initialContent); // Revert to original content
        setIsEditing(false);
        setSaveStatus('');
    };

    const inputElement = contentType === 'textarea' ?
        <textarea
            className="editor-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="5"
        /> :
        <input
            type="text"
            className="editor-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
        />;

    return (
        <div className="editor-section">
            <h3 className="editor-section-title">{title}</h3>
            {isEditing ? (
                <>
                    {inputElement}
                    <div className="editor-actions">
                        <button className="save-button" onClick={handleSave} disabled={saveStatus === 'saving'}>
                            {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                        </button>
                        <button className="cancel-button" onClick={handleCancel} disabled={saveStatus === 'saving'}>Cancel</button>
                    </div>
                    {saveStatus === 'saved' && <span className="save-message success">Saved!</span>}
                    {saveStatus === 'error' && <span className="save-message error">Error saving.</span>}
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