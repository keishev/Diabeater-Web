# Firebase Functions Gen 2 Deployment Guide

## Changes Made
We've successfully updated your Firebase Functions from Gen 1 to Gen 2. Here's what was changed:

1. Updated imports to use the modular syntax
2. Updated function declarations to use the new Gen 2 format
3. Added region specifications to all functions
4. Updated memory specifications from '256MB' to '256MiB'
5. Updated parameter handling to use the new approach
6. Updated error handling to use the new HttpsError format

## Next Steps for Deployment

### 1. Deploy Your Updated Functions

```bash
cd diabeater-web
firebase deploy --only functions
```

### 2. Update Environment Configuration

Since we're now using the new parameters approach, you need to set your environment variables:

```bash
firebase functions:config:set gmail.email="your-email@gmail.com" gmail.password="your-app-password"
```

### 3. Check Firebase Plan

If you're using the Spark (free) plan, some features might require upgrading to the Blaze (pay-as-you-go) plan. Check your Firebase console to ensure you have the appropriate plan for your needs.

### 4. Test Your Functions

After deployment, test your functions to ensure they're working correctly. You can use the Firebase console to test callable functions directly.

### 5. Update Client Code (if necessary)

The client interface should remain the same, but if you encounter any issues, you might need to update your client code that calls these functions.

## Troubleshooting

If you encounter any issues during deployment:

1. Check the Firebase deployment logs for specific errors
2. Ensure your Firebase CLI is up to date
3. Verify that your firebase.json configuration is correct
4. Check that your service account has the necessary permissions

For more information on Firebase Functions Gen 2, refer to the [official documentation](https://firebase.google.com/docs/functions/beta/get-started).