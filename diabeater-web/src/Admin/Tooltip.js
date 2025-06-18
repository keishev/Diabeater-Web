// src/Admin/Tooltip.js
import React, { useState } from 'react';
import './Tooltip.css'; // We'll create this CSS file next

const Tooltip = ({ children, content }) => {
    const [show, setShow] = useState(false);

    return (
        <div
            className="tooltip-container"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && (
                <div className="tooltip-content">
                    {content}
                </div>
            )}
        </div>
    );
};

export default Tooltip;