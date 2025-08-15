// Improved Delete Dummy Data Component
import React, { useState } from 'react';
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    getFirestore
} from 'firebase/firestore';

const ImprovedDeleteDummyData = () => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);

    const db = getFirestore();

    const addLog = (message) => {
        console.log(message);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const deleteDummyData = async () => {
        setIsDeleting(true);
        setLogs([]);
        setShowLogs(true);

        try {
            addLog('🗑Starting comprehensive dummy data deletion...');

            let totalDeleted = 0;

            // Check user_accounts collection
            addLog('Scanning user_accounts collection...');
            const userAccountsRef = collection(db, 'user_accounts');
            const userAccountsSnapshot = await getDocs(userAccountsRef);

            addLog(`Found ${userAccountsSnapshot.size} total documents in user_accounts`);

            let deletedUsers = 0;
            const userDeletePromises = [];

            userAccountsSnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const docId = docSnapshot.id;

                // More comprehensive patterns for dummy data detection
                const isDummyUser = (
                    // Document ID patterns
                    docId.startsWith('user_') ||
                    docId.startsWith('test_') ||
                    docId.includes('test') ||

                    // Name patterns
                    data.firstName === 'TestUser' ||
                    data.firstName === 'Test' ||
                    data.lastName === 'TestUser' ||
                    data.firstName?.startsWith('User') ||

                    // Email patterns
                    data.email?.includes('test@') ||
                    data.email?.includes('@example.com') ||
                    data.email?.includes('@test.com') ||
                    data.email?.includes('test') ||

                    // Our specific dummy names with email pattern
                    (data.firstName && ['Miranda', 'Jorren', 'Ashley', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Elijah', 'Sophia', 'Lucas', 'Isabella', 'Mason', 'Mia', 'Logan', 'Charlotte', 'Benjamin', 'Amelia', 'Jacob', 'Harper', 'Michael', 'Evelyn', 'Ethan', 'Abigail', 'Alexander', 'Emily', 'William', 'Elizabeth', 'Daniel', 'Sofia'].includes(data.firstName) &&
                        data.lastName && ['Miraz', 'Teo', 'Lim', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'].includes(data.lastName) &&
                        data.email?.match(/[a-z]+[a-z]+\d+@/)) || // Pattern: firstnamelastname + number

                    // Pet names that are obviously dummy
                    data.petName?.startsWith('Pet') ||

                    // Username patterns
                    data.username?.includes('test') ||
                    data.username?.match(/^[a-z]+\d+$/) // Like miranda123
                );

                if (isDummyUser) {
                    addLog(`Found dummy user: ${data.firstName} ${data.lastName} (${data.email})`);
                    userDeletePromises.push(deleteDoc(docSnapshot.ref));
                    deletedUsers++;
                }
            });

            if (userDeletePromises.length > 0) {
                await Promise.all(userDeletePromises);
                addLog(`Deleted ${deletedUsers} dummy users from user_accounts`);
                totalDeleted += deletedUsers;
            } else {
                addLog('ℹNo dummy users found in user_accounts');
            }

            // Check nutritionist_application collection
            addLog('Scanning nutritionist_application collection...');
            const appsRef = collection(db, 'nutritionist_application');
            const appsSnapshot = await getDocs(appsRef);

            addLog(`Found ${appsSnapshot.size} total documents in nutritionist_application`);

            let deletedApps = 0;
            const appDeletePromises = [];

            appsSnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const docId = docSnapshot.id;

                // Comprehensive patterns for nutritionist applications
                const isDummyApp = (
                    // Document ID patterns
                    docId.startsWith('app_') ||
                    docId.startsWith('test_') ||
                    docId.startsWith('nutritionist_') ||
                    docId.includes('test') ||

                    // Name patterns
                    data.firstName === 'TestNutritionist' ||
                    data.firstName?.startsWith('Dr. ') ||
                    data.firstName?.includes('Test') ||

                    // Email patterns
                    data.email?.includes('@nutrition.org') ||
                    data.email?.includes('nutritionist') ||
                    data.email?.includes('test') ||
                    data.email?.includes('@example.com') ||

                    // Certificate URL patterns
                    data.certificateUrl?.includes('example.com') ||
                    data.certificateUrl?.includes('test') ||
                    data.certificateFileName?.includes('test') ||
                    data.certificateFileName?.includes('certificate')
                );

                if (isDummyApp) {
                    addLog(`Found dummy application: ${data.firstName} ${data.lastName} (${data.email})`);
                    appDeletePromises.push(deleteDoc(docSnapshot.ref));
                    deletedApps++;
                }
            });

            if (appDeletePromises.length > 0) {
                await Promise.all(appDeletePromises);
                addLog(`Deleted ${deletedApps} dummy applications from nutritionist_application`);
                totalDeleted += deletedApps;
            } else {
                addLog('ℹNo dummy applications found in nutritionist_application');
            }

            // Check other possible collections
            const otherCollections = ['users', 'user-accounts', 'nutritionist-applications'];

            for (const collectionName of otherCollections) {
                try {
                    addLog(`Scanning ${collectionName} collection...`);
                    const ref = collection(db, collectionName);
                    const snapshot = await getDocs(ref);

                    addLog(`Found ${snapshot.size} total documents in ${collectionName}`);

                    let deletedFromCollection = 0;
                    const deletePromises = [];

                    snapshot.forEach((docSnapshot) => {
                        const data = docSnapshot.data();
                        const docId = docSnapshot.id;

                        // Any test/dummy patterns
                        const isDummy = (
                            docId.startsWith('user_') ||
                            docId.startsWith('test_') ||
                            docId.startsWith('app_') ||
                            docId.startsWith('nutritionist_') ||
                            docId.includes('test') ||
                            data.firstName === 'TestUser' ||
                            data.firstName === 'Test' ||
                            data.firstName === 'TestNutritionist' ||
                            data.firstName?.startsWith('User') ||
                            data.firstName?.startsWith('Dr. ') ||
                            data.email?.includes('test@') ||
                            data.email?.includes('@example.com') ||
                            data.email?.includes('@nutrition.org') ||
                            data.email?.includes('test')
                        );

                        if (isDummy) {
                            addLog(`Found dummy record in ${collectionName}: ${data.firstName || 'Unknown'} ${data.lastName || ''}`);
                            deletePromises.push(deleteDoc(docSnapshot.ref));
                            deletedFromCollection++;
                        }
                    });

                    if (deletePromises.length > 0) {
                        await Promise.all(deletePromises);
                        addLog(`Deleted ${deletedFromCollection} dummy records from ${collectionName}`);
                        totalDeleted += deletedFromCollection;
                    } else {
                        addLog(`ℹNo dummy records found in ${collectionName}`);
                    }

                } catch (error) {
                    addLog(`⏭Collection ${collectionName} doesn't exist or can't be accessed, skipping...`);
                }
            }

            // Check subscription collection and delete non-simulated payments
            try {
                addLog('Scanning subscription collection...');
                const subscriptionRef = collection(db, 'subscriptions');
                const subscriptionSnapshot = await getDocs(subscriptionRef);

                addLog(`Found ${subscriptionSnapshot.size} total documents in subscription`);

                let deletedSubscriptions = 0;
                const subscriptionDeletePromises = [];

                subscriptionSnapshot.forEach((docSnapshot) => {
                    const data = docSnapshot.data();
                    const docId = docSnapshot.id;

                    // Delete subscriptions where:
                    // 1. paymentMethod is NOT "simulated" OR
                    // 2. has nextBillingDate field (regardless of value - dummy data indicator) OR
                    // 3. subscriptionId starts with "sub_" (dummy data indicator)
                    // Keep only subscriptions with simulated payments AND no nextBillingDate field AND no sub_ prefix (real ones)
                    const shouldDelete = (data.paymentMethod && data.paymentMethod !== 'simulated') ||
                        data.hasOwnProperty('nextBillingDate') ||
                        (data.subscriptionId && data.subscriptionId.startsWith('sub_'));

                    if (shouldDelete) {
                        let reasons = [];
                        if (data.paymentMethod !== 'simulated') {
                            reasons.push(`paymentMethod: ${data.paymentMethod}`);
                        }
                        if (data.hasOwnProperty('nextBillingDate')) {
                            reasons.push('has nextBillingDate field');
                        }
                        if (data.subscriptionId && data.subscriptionId.startsWith('sub_')) {
                            reasons.push(`subscriptionId starts with sub_: ${data.subscriptionId}`);
                        }

                        const reason = reasons.join(' AND ');
                        addLog(`Found dummy subscription: ${docId} (${reason})`);
                        subscriptionDeletePromises.push(deleteDoc(docSnapshot.ref));
                        deletedSubscriptions++;
                    }
                });

                if (subscriptionDeletePromises.length > 0) {
                    await Promise.all(subscriptionDeletePromises);
                    addLog(`Deleted ${deletedSubscriptions} non-simulated subscriptions`);
                    totalDeleted += deletedSubscriptions;
                } else {
                    addLog('ℹNo non-simulated subscriptions found to delete');
                }

            } catch (error) {
                addLog(`Subscription collection doesn't exist or can't be accessed, skipping...`);
            }

            addLog('Dummy data deletion completed!');
            addLog(`Total deleted: ${totalDeleted} records`);

            if (totalDeleted > 0) {
                alert(`Successfully deleted ${totalDeleted} dummy records!\n\n🔄 Refresh your page to see the updated data.`);
            } else {
                alert('No dummy data found to delete.\n\nEither there was no dummy data, or the patterns didn\'t match.');
            }

        } catch (error) {
            console.error('Error deleting dummy data:', error);
            addLog(`Error: ${error.message}`);
            alert(`Error deleting data: ${error.message}`);
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    const handleDeleteClick = () => {
        setShowConfirm(true);
    };

    const handleConfirmDelete = () => {
        deleteDummyData();
    };

    const handleCancelDelete = () => {
        setShowConfirm(false);
    };

    const closeLogs = () => {
        setShowLogs(false);
        setLogs([]);
    };

    return (
        <div>
            {/*<button*/}
            {/*    onClick={handleDeleteClick}*/}
            {/*    disabled={isDeleting}*/}
            {/*    style={{*/}
            {/*        backgroundColor: isDeleting ? '#9ca3af' : '#dc2626',*/}
            {/*        color: 'white',*/}
            {/*        border: 'none',*/}
            {/*        padding: '10px 18px',*/}
            {/*        borderRadius: '6px',*/}
            {/*        fontSize: '13px',*/}
            {/*        fontWeight: '600',*/}
            {/*        cursor: isDeleting ? 'not-allowed' : 'pointer',*/}
            {/*        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',*/}
            {/*        whiteSpace: 'nowrap'*/}
            {/*    }}*/}
            {/*>*/}
            {/*    {isDeleting ? '🗑Deleting...' : 'Delete Dummy Data'}*/}
            {/*</button>*/}
            {/* Confirmation Modal */}
            {showConfirm && (
                <div style={{
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: '9999'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '15px',
                        textAlign: 'center',
                        minWidth: '400px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ color: '#dc2626', marginBottom: '20px', fontSize: '20px' }}>
                            ⚠️ Confirm Deletion
                        </h3>

                        <p style={{ marginBottom: '25px', color: '#374151', lineHeight: '1.5' }}>
                            This will scan ALL collections and permanently delete:
                            <br />• Test users and dummy accounts
                            <br />• Dummy nutritionist applications
                            <br />• Any records with test/example patterns
                            <br />• Records with dummy names and emails
                        </p>

                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button
                                onClick={handleCancelDelete}
                                style={{
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirmDelete}
                                style={{
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Yes, Scan & Delete All Dummy Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logs Modal */}
            {showLogs && (
                <div style={{
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: '9999'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '15px',
                        minWidth: '600px',
                        maxWidth: '800px',
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <h3 style={{ color: '#dc2626', marginBottom: '15px', textAlign: 'center' }}>
                            🗑️ Deletion Progress
                        </h3>

                        <div style={{
                            backgroundColor: '#1a1a1a',
                            color: '#00ff00',
                            padding: '15px',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            marginBottom: '15px'
                        }}>
                            {logs.map((log, index) => (
                                <div key={index} style={{ marginBottom: '3px' }}>{log}</div>
                            ))}
                        </div>

                        <button
                            onClick={closeLogs}
                            disabled={isDeleting}
                            style={{
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                alignSelf: 'center'
                            }}
                        >
                            {isDeleting ? 'Deleting...' : 'Close'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImprovedDeleteDummyData;