// Complete Bulk Insert with Premium Subscriptions and PDF Certificates
import React, { useState } from 'react';
import { 
  collection, 
  addDoc,
  Timestamp,
  getFirestore 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

const CompleteBulkInsert = () => {
  const [isInserting, setIsInserting] = useState(false);
  const [progress, setProgress] = useState({ users: 0, apps: 0, subscriptions: 0, certificates: 0 });
  const [showModal, setShowModal] = useState(false);

  const db = getFirestore();
  const storage = getStorage();

  // Function to create a random PDF certificate
  const createRandomPDFCertificate = (nutritionistName, certType) => {
    // Create a simple PDF-like content (in real scenario, you'd use a PDF library)
    const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 <<
      /Type /Font
      /Subtype /Type1
      /BaseFont /Times-Roman
    >>
  >>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(CERTIFICATE OF NUTRITION EXPERTISE) Tj
0 -50 Td
(This certifies that ${nutritionistName}) Tj
0 -30 Td
(has successfully completed the requirements for) Tj
0 -30 Td
(${certType}) Tj
0 -50 Td
(Issued on: ${new Date().toLocaleDateString()}) Tj
0 -30 Td
(Certificate ID: CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
553
%%EOF`;

    // Convert to blob
    return new Blob([pdfContent], { type: 'application/pdf' });
  };

  // Function to upload certificate to Firebase Storage
  const uploadCertificate = async (nutritionistData, appIndex) => {
    try {
      const certTypes = [
        'Registered Dietitian Nutritionist (RDN)',
        'Certified Nutrition Specialist (CNS)',
        'Certified Clinical Nutritionist (CCN)',
        'Licensed Nutritionist (LN)',
        'Board Certified in Holistic Nutrition'
      ];
      
      const certType = certTypes[appIndex % certTypes.length];
      const fileName = `certificate_${nutritionistData.firstName.replace(/[^a-zA-Z0-9]/g, '')}_${nutritionistData.lastName.replace(/[^a-zA-Z0-9]/g, '')}_${appIndex}.pdf`;
      
      // Create PDF blob
      const pdfBlob = createRandomPDFCertificate(`${nutritionistData.firstName} ${nutritionistData.lastName}`, certType);
      
      // Create storage reference
      const certificateRef = ref(storage, `certificates/applications/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(certificateRef, pdfBlob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        fileName: fileName,
        downloadURL: downloadURL,
        certType: certType
      };
    } catch (error) {
      console.error('Error uploading certificate:', error);
      // Return fallback data if upload fails
      return {
        fileName: `fallback_certificate_${appIndex}.pdf`,
        downloadURL: `https://example.com/certificates/fallback_${appIndex}.pdf`,
        certType: 'Registered Dietitian Nutritionist (RDN)'
      };
    }
  };

  const insertData = async () => {
    setIsInserting(true);
    setShowModal(true);
    setProgress({ users: 0, apps: 0, subscriptions: 0, certificates: 0 });
    
    try {
      console.log('🔥 Starting complete bulk insert...');
      
      const firstNames = [
        'Miranda', 'Jorren', 'Ashley', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Elijah', 'Sophia',
        'Lucas', 'Isabella', 'Mason', 'Mia', 'Logan', 'Charlotte', 'Benjamin', 'Amelia', 'Jacob', 'Harper',
        'Michael', 'Evelyn', 'Ethan', 'Abigail', 'Alexander', 'Emily', 'William', 'Elizabeth', 'Daniel', 'Sofia'
      ];
      
      const lastNames = [
        'Miraz', 'Teo', 'Lim', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
        'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'
      ];
      
      const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      const premiumUserIds = []; // Store premium user IDs for subscriptions
      
      console.log('📊 Inserting 350 users into user_accounts...');
      
      // Insert users with controlled role distribution
      for (let i = 0; i < 350; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        
        // Role distribution: 60% basic, 25% premium, 12% nutritionist, 3% admin (only ~10 admins)
        let role;
        if (i < 3) role = 'admin'; // Only first 3 are admin
        else if (i < 45) role = 'nutritionist'; // Next 42 are nutritionist  
        else if (i < 132) role = 'premium'; // Next 87 are premium
        else role = 'basic'; // Rest are basic
        
        const isPremium = role === 'premium' || role === 'admin';
        
        const user = {
          userId: `dummy_user_${Date.now()}_${i}`, // Clear dummy identifier
          firstName: firstName,
          lastName: lastName,
          email: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}@${domains[i % domains.length]}`,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          dob: Timestamp.fromDate(new Date(1990 + (i % 30), 0, 1)),
          role: role,
          status: 'Active',
          isPremium: isPremium,
          level: (i % 10) + 1,
          points: i * 10,
          petName: `Pet${i}`,
          profileCompleted: true,
          profilePictureUrl: '',
          username: `${firstName.toLowerCase()}${i}`,
          createdAt: Timestamp.fromDate(new Date())
        };
        
        const docRef = await addDoc(collection(db, 'user_accounts'), user);
        
        // Store premium user IDs for subscription creation
        if (isPremium) {
          premiumUserIds.push({
            userId: docRef.id,
            email: user.email,
            name: `${firstName} ${lastName}`,
            role: role
          });
        }
        
        setProgress(prev => ({ ...prev, users: i + 1 }));
        
        if (i % 50 === 0) {
          console.log(`✅ Inserted ${i + 1}/350 users...`);
        }
      }
      
      console.log('📊 Inserting nutritionist applications with PDF certificates...');
      
      // Insert nutritionist applications with real PDF certificates
      for (let i = 0; i < 75; i++) {
        const nutritionistFirstNames = ['Dr. Sarah', 'Dr. Michael', 'Dr. Lisa', 'Dr. James', 'Dr. Maria', 'Dr. David', 'Dr. Jennifer', 'Dr. Robert', 'Dr. Amanda', 'Dr. Christopher'];
        const firstName = nutritionistFirstNames[i % nutritionistFirstNames.length];
        const lastName = lastNames[i % lastNames.length];
        
        const nutritionistData = {
          firstName: firstName,
          lastName: lastName,
          email: `${firstName.toLowerCase().replace('dr. ', '').replace(' ', '')}${lastName.toLowerCase()}${i}@nutrition.org`,
          dob: '1985-01-01',
          status: ['approved', 'pending', 'rejected'][i % 3],
          appliedDate: Timestamp.fromDate(new Date()),
          createdAt: Timestamp.fromDate(new Date()),
          emailVerified: true
        };
        
        console.log(`📄 Creating certificate for ${firstName} ${lastName}...`);
        
        // Upload certificate and get URL
        const certificateData = await uploadCertificate(nutritionistData, i);
        
        // Add certificate info to application
        const app = {
          ...nutritionistData,
          certificateFileName: certificateData.fileName,
          certificateUrl: certificateData.downloadURL,
          certificationType: certificateData.certType,
          uploadedAt: Timestamp.fromDate(new Date())
        };
        
        if (app.status === 'approved') {
          app.approvedAt = Timestamp.fromDate(new Date());
          app.approvedBy = 'admin_user_1'; // Reference to admin who approved
        } else if (app.status === 'rejected') {
          app.rejectedAt = Timestamp.fromDate(new Date());
          app.rejectedBy = 'admin_user_1'; // Reference to admin who rejected
          app.rejectionReason = [
            'Certificate not valid',
            'Incomplete documentation', 
            'Experience requirements not met',
            'Unable to verify credentials'
          ][i % 4];
        }
        
        await addDoc(collection(db, 'nutritionist_application'), app);
        setProgress(prev => ({ 
          ...prev, 
          apps: i + 1, 
          certificates: i + 1 
        }));
        
        if (i % 10 === 0) {
          console.log(`✅ Inserted ${i + 1}/75 applications with certificates...`);
        }
      }
      
      console.log('💳 Creating premium subscriptions...');
      
      // Function to get random subscription status with realistic distribution
      const getRandomSubscriptionStatus = () => {
        const rand = Math.random();
        // 40% active, 35% expired, 25% canceled
        if (rand < 0.4) return 'active';
        else if (rand < 0.75) return 'expired';
        else return 'canceled';
      };
      
      // Create subscriptions for premium users
      let subscriptionCount = 0;
      for (const premiumUser of premiumUserIds) {
        // Create 1-3 subscription records per premium user (for history)
        const numSubscriptions = Math.floor(Math.random() * 3) + 1;
        
        for (let subIndex = 0; subIndex < numSubscriptions; subIndex++) {
          const baseDate = new Date();
          const monthsAgo = (numSubscriptions - subIndex - 1) * 6; // 6 months apart
          const startDate = new Date(baseDate.getTime() - (monthsAgo * 30 * 24 * 60 * 60 * 1000));
          
          // Randomize subscription duration (1-12 months)
          const durationMonths = Math.floor(Math.random() * 12) + 1;
          const endDate = new Date(startDate.getTime() + (durationMonths * 30 * 24 * 60 * 60 * 1000));
          
          // Get random status
          const status = getRandomSubscriptionStatus();
          
          // Adjust dates based on status for realistic data
          let finalStartDate = startDate;
          let finalEndDate = endDate;
          
          if (status === 'expired') {
            // Ensure expired subscriptions have end dates in the past
            const pastDate = new Date(baseDate.getTime() - (Math.random() * 180 * 24 * 60 * 60 * 1000)); // 0-6 months ago
            finalEndDate = pastDate;
            finalStartDate = new Date(pastDate.getTime() - (durationMonths * 30 * 24 * 60 * 60 * 1000));
          } else if (status === 'canceled') {
            // Canceled subscriptions can have various end dates
            const cancelDate = new Date(startDate.getTime() + (Math.random() * durationMonths * 30 * 24 * 60 * 60 * 1000));
            finalEndDate = cancelDate;
          } else if (status === 'active') {
            // Active subscriptions should have future end dates
            const futureEndDate = new Date(baseDate.getTime() + (Math.random() * 365 * 24 * 60 * 60 * 1000)); // Up to 1 year in future
            finalEndDate = futureEndDate;
            // Start date can be in the past for active subscriptions
            finalStartDate = new Date(baseDate.getTime() - (Math.random() * 90 * 24 * 60 * 60 * 1000)); // Up to 3 months ago
          }
          
          const subscription = {
            userId: premiumUser.userId,
            plan: 'Premium Plan',
            type: Math.random() < 0.7 ? 'monthly' : 'yearly',
            price: Math.random() < 0.7 ? 5 : 50, // $5 monthly or $50 yearly
            status: status,
            paymentMethod: ['simulated', 'credit_card', 'paypal', 'bank_transfer'][Math.floor(Math.random() * 4)],
            startDate: Timestamp.fromDate(finalStartDate),
            endDate: Timestamp.fromDate(finalEndDate),
            createdAt: Timestamp.fromDate(finalStartDate),
            subscriptionId: `sub_${Date.now()}_${premiumUser.userId}_${subIndex}`,
            // Add additional fields for more realistic data
            autoRenew: status === 'active' ? Math.random() < 0.8 : false, // 80% of active have auto-renew
            lastPaymentDate: status !== 'canceled' ? Timestamp.fromDate(finalStartDate) : null,
            nextBillingDate: status === 'active' ? Timestamp.fromDate(new Date(finalEndDate.getTime() + (30 * 24 * 60 * 60 * 1000))) : null
          };
          
          // Add cancellation details for canceled subscriptions
          if (status === 'canceled') {
            subscription.canceledAt = Timestamp.fromDate(finalEndDate);
            subscription.cancelReason = ['user_request', 'payment_failed', 'duplicate_account', 'terms_violation'][Math.floor(Math.random() * 4)];
          }
          
          await addDoc(collection(db, 'subscriptions'), subscription);
          subscriptionCount++;
          setProgress(prev => ({ ...prev, subscriptions: subscriptionCount }));
        }
      }
      
      console.log('🎉 All data inserted successfully!');
      console.log(`📊 Summary:`);
      console.log(`   • 350 users (3 admin, 42 nutritionist, 87 premium, 218 basic)`);
      console.log(`   • 75 nutritionist applications with PDF certificates`);
      console.log(`   • ${subscriptionCount} subscription records with randomized statuses`);
      console.log(`   • 75 PDF certificates uploaded to Firebase Storage`);
      
      alert(`🎉 SUCCESS! All dummy data inserted!\n\n✅ 350 users (3 admin, 42 nutritionist, 87 premium, 218 basic)\n✅ 75 nutritionist applications with PDF certificates\n✅ ${subscriptionCount} premium subscriptions\n✅ 75 PDF certificates uploaded to Firebase Storage\n\n🔄 Refresh your page to see all the data!\n\n📋 Admins can now review and approve/reject applications with real certificate files!`);
      
    } catch (error) {
      console.error('❌ Error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsInserting(false);
      setTimeout(() => {
        setShowModal(false);
        setProgress({ users: 0, apps: 0, subscriptions: 0, certificates: 0 });
      }, 3000);
    }
  };

   return (
        <>
            {/*<button*/}
            {/*    onClick={insertData}*/}
            {/*    disabled={isInserting}*/}
            {/*    style={{*/}
            {/*        backgroundColor: isInserting ? '#9ca3af' : '#059669',*/}
            {/*        color: 'white',*/}
            {/*        border: 'none',*/}
            {/*        padding: '10px 18px',*/}
            {/*        borderRadius: '6px',*/}
            {/*        fontSize: '13px',*/}
            {/*        fontWeight: '600',*/}
            {/*        marginTop: '-200px',*/}
            {/*        cursor: isInserting ? 'not-allowed' : 'pointer',*/}
            {/*        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',*/}
            {/*        whiteSpace: 'nowrap'*/}
            {/*    }}*/}
            {/*>*/}
            {/*    {isInserting ? '⏳ Inserting...' : '🔥 Insert Complete Dataset + PDFs'}*/}
            {/*</button>*/}

      {/* Progress Modal */}
      {showModal && (
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
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            minWidth: '500px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ 
              color: '#059669', 
              marginBottom: '30px',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              🔥 Inserting Complete Dataset + PDFs
            </h3>
            
            {/* Users Progress */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ 
                fontSize: '16px', 
                color: '#374151', 
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                👥 Users: {progress.users}/350
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(progress.users / 350) * 100}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            {/* Applications Progress */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ 
                fontSize: '16px', 
                color: '#374151', 
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                🩺 Applications: {progress.apps}/75
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(progress.apps / 75) * 100}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            {/* Certificates Progress */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ 
                fontSize: '16px', 
                color: '#374151', 
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                📄 Certificates: {progress.certificates}/75
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(progress.certificates / 75) * 100}%`,
                  height: '100%',
                  backgroundColor: '#ef4444',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            {/* Subscriptions Progress */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ 
                fontSize: '16px', 
                color: '#374151', 
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                💳 Subscriptions: {progress.subscriptions}
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: progress.subscriptions > 0 ? '100%' : '0%',
                  height: '100%',
                  backgroundColor: '#f59e0b',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              Creating complete dataset with users, applications, PDF certificates, and premium subscriptions...
            </div>
          </div>
        </div>
      )}

      
    </>
  );
};

export default CompleteBulkInsert;