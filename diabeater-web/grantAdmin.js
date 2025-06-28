// grantAdmin.js

const admin = require('firebase-admin'); // Import the Firebase Admin SDK

// This line tells the script where to find your downloaded service account key.
// Make sure 'serviceAccountKey.json' is in the same directory as grantAdmin.js
const serviceAccount = require('../serviceAccountKey.json'); 

// Initialize the Firebase Admin SDK using your service account key.
// This allows the script to securely interact with your Firebase project.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// !!! IMPORTANT: Replace 'YOUR_ADMIN_EMAIL@example.com' with the actual email
//     address of the user you want to make an administrator in Firebase.
const targetEmail = 'liviamanda95@gmail.com'; 

async function grantAdminRights() {
  try {
    // 1. Find the user in Firebase Authentication by their email address.
    const user = await admin.auth().getUserByEmail(targetEmail);
    console.log(`Found user: ${user.email} with UID: ${user.uid}`);

    // 2. Set a custom claim on this user's account.
    //    We're setting 'admin: true'. This is the "tag" that your LoginPage.js
    //    will look for to determine if a user is an admin.
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Successfully set 'admin: true' custom claim for ${targetEmail}`);

    // 3. Revoke (invalidate) any existing login sessions (refresh tokens) for this user.
    //    This is crucial! If the user is currently logged in, their existing
    //    session won't have the new 'admin' claim. Revoking tokens forces them
    //    to log out and then log back in, which will give them a new session
    //    with the updated 'admin' claim in their ID token.
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
  // Exit the Node.js script when done (or if an error occurs)
  process.exit(); 
}

// Call the function to execute it
grantAdminRights();