
import React from 'react';
import './TermsAndConditionsModal.css';

const TermsAndConditionsModal = ({ isOpen, onClose, onAccept }) => {
    if (!isOpen) return null;

    const handleAccept = () => {
        onAccept();
        onClose();
    };

    return (
        <div className="terms-modal-overlay">
            <div className="terms-modal-content">
                <div className="terms-modal-header">
                    <h2>Nutritionist Terms and Conditions</h2>
                    <button className="terms-modal-close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="terms-modal-body">
                    <div className="terms-section">
                        <h3>1. Application and Certification Requirements</h3>
                        <p>By applying to become a nutritionist on DiaBeater, you acknowledge that:</p>
                        <ul>
                            <li>You possess valid, current nutritionist certification or relevant professional qualifications</li>
                            <li>All information provided in your application is accurate and truthful</li>
                            <li>You will promptly notify us of any changes to your certification status</li>
                            <li>False or misleading information may result in immediate rejection or termination</li>
                        </ul>
                    </div>

                    <div className="terms-section">
                        <h3>2. Professional Responsibilities</h3>
                        <p>As a DiaBeater nutritionist, you agree to:</p>
                        <ul>
                            <li>Provide evidence-based nutritional advice and meal planning services</li>
                            <li>Maintain the highest standards of professional conduct and ethics</li>
                            <li>Respect client confidentiality and privacy at all times</li>
                            <li>Stay current with nutritional science and continuing education requirements</li>
                            <li>Clearly communicate the scope and limitations of your services</li>
                        </ul>
                    </div>

                    <div className="terms-section">
                        <h3>3. Platform Guidelines</h3>
                        <p>You must adhere to the following platform rules:</p>
                        <ul>
                            <li>Provide timely, professional responses to client inquiries</li>
                            <li>Use the platform's communication tools appropriately</li>
                            <li>Maintain accurate availability and scheduling information</li>
                            <li>Follow all content guidelines for meal plans and educational materials</li>
                            <li>Report any technical issues or concerns promptly</li>
                        </ul>
                    </div>

                    <div className="terms-section">
                        <h3>4. Medical Limitations and Referrals</h3>
                        <p>You acknowledge that:</p>
                        <ul>
                            <li>You will not provide medical diagnosis or treatment</li>
                            <li>You will refer clients to appropriate healthcare providers when necessary</li>
                            <li>You understand the distinction between nutritional counseling and medical advice</li>
                            <li>You will work within your scope of practice at all times</li>
                        </ul>
                    </div>

                    <div className="terms-section">
                        <h3>5. Compensation and Payments</h3>
                        <p>Regarding financial arrangements:</p>
                        <ul>
                            <li>Payment structures and rates will be clearly defined upon approval</li>
                            <li>All transactions must be processed through the DiaBeater platform</li>
                            <li>You agree to the platform's commission structure and payment terms</li>
                            <li>Tax responsibilities are your own obligation</li>
                        </ul>
                    </div>

                    <div className="terms-section">
                        <h3>6. Intellectual Property</h3>
                        <p>You agree that:</p>
                        <ul>
                            <li>Original meal plans and content created on the platform remain your intellectual property</li>
                            <li>DiaBeater may use aggregated, anonymized data for platform improvement</li>
                            <li>You will respect the intellectual property rights of others</li>
                            <li>Any violation of copyright or trademark will result in immediate termination</li>
                        </ul>
                    </div>

                    <div className="terms-section">
                        <h3>7. Data Privacy and Security</h3>
                        <p>You commit to:</p>
                        <ul>
                            <li>Protecting all client information according to applicable privacy laws</li>
                            <li>Using strong passwords and secure practices for platform access</li>
                            <li>Immediately reporting any suspected data breaches</li>
                            <li>Complying with GDPR, HIPAA, and other relevant privacy regulations</li>
                        </ul>
                    </div>

                    <div className="terms-section">
                        <h3>8. Quality Standards and Reviews</h3>
                        <p>You understand that:</p>
                        <ul>
                            <li>Your services will be subject to client reviews and ratings</li>
                            <li>DiaBeater reserves the right to monitor service quality</li>
                            <li>Consistent poor performance may result in account suspension</li>
                            <li>You have the right to respond professionally to feedback</li>
                        </ul>
                    </div>

                    <div className="terms-section">
                        <h3>9. Termination and Suspension</h3>
                        <p>DiaBeater may suspend or terminate your account for:</p>
                        <ul>
                            <li>Violation of these terms and conditions</li>
                            <li>Unethical or unprofessional conduct</li>
                            <li>Failure to maintain required certifications</li>
                            <li>Client complaints or safety concerns</li>
                            <li>Extended periods of inactivity</li>
                        </ul>
                    </div>

                    <div className="terms-section">
                        <h3>10. Liability and Insurance</h3>
                        <p>Important liability considerations:</p>
                        <ul>
                            <li>You are responsible for maintaining appropriate professional liability insurance</li>
                            <li>DiaBeater is not liable for the outcomes of your professional advice</li>
                            <li>You agree to indemnify DiaBeater against claims arising from your services</li>
                            <li>All services are provided "as is" without warranties</li>
                        </ul>
                    </div>

                    <div className="terms-section">
                        <h3>11. Updates and Modifications</h3>
                        <p>These terms may be updated periodically. You will be notified of significant changes and continued use of the platform constitutes acceptance of updated terms.</p>
                    </div>

                    <div className="terms-section">
                        <h3>12. Governing Law</h3>
                        <p>These terms are governed by the laws of Singapore. Any disputes will be resolved through binding arbitration in Singapore.</p>
                    </div>

                    <div className="terms-footer">
                        <p><strong>Last Updated:</strong> August 11, 2025</p>
                        <p><strong>Contact:</strong> For questions about these terms, contact support@diabeater.com</p>
                    </div>
                </div>

                <div className="terms-modal-actions">
                    <button className="terms-btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="terms-btn-primary" onClick={handleAccept}>
                        I Accept These Terms
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditionsModal;