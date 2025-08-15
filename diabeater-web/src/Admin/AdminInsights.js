
import React from 'react';
import './AdminInsights.css'; 

const AdminInsights = ({ data }) => {
    return (
        <section className="admin-insights-section">
            <h2 className="section-title">Insights</h2>
            <div className="insights-grid">
                {data.map((insight, index) => (
                    <div key={index} className="insight-card">
                        <div className="insight-value">{insight.value}</div>
                        <div className="insight-label">{insight.label}</div>
                        <div className={`insight-change ${insight.type}`}>
                            <i className={`fas fa-caret-${insight.type === 'increase' ? 'up' : 'down'}`}></i> {insight.change}% {insight.period}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AdminInsights;