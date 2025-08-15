

const admin = require('firebase-admin'); 



const serviceAccount = require('../serviceAccountKey.json'); 



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const targetEmail = 'liviamanda95@gmail.com'; 

async function grantAdminRights() {
  try {
    
    const user = await admin.auth().getUserByEmail(targetEmail);
    console.log(`Found user: ${user.email} with UID: ${user.uid}`);

    
    
    
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Successfully set 'admin: true' custom claim for ${targetEmail}`);

    
    
    
    
    
    await admin.auth().revokeRefreshTokens(user.uid);
    console.log(`Revoked refresh tokens for ${targetEmail}.`);
    console.log(`*** To activate admin rights, this user must log out and then log back in. ***`);

  } catch (error) {
    console.error('Error granting admin rights:', error);
    if (error.code === 'auth/user-not-found') {
      console.error(`User with email ${targetEmail} not found in Firebase Authentication.`);
      console.error(`Please make sure this email is already registered in your Firebase project's Authentication section.`);
    } else {
      console.error(`An unexpected error occurred: ${error.message}`);
    }
  }
  
  process.exit(); 
}


grantAdminRights();