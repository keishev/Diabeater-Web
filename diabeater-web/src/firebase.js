import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9eCJVgUEzCi_5rD7EjYAwQQYrYH4j4_E",
  authDomain: "diabeaters-4cf9e.firebaseapp.com",
  projectId: "diabeaters-4cf9e",
  storageBucket: "diabeaters-4cf9e.firebasestorage.app",
  messagingSenderId: "670973866835",
  appId: "1:670973866835:web:2a41f442c1abbe12bd67a6",
  measurementId: "G-877JJXG197" // You can remove this if not using Analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
export { firebaseConfig };