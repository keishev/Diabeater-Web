// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9eCJVgUEzCi_5rD7EjYAwQQYrYH4j4_E",
  authDomain: "diabeaters-4cf9e.firebaseapp.com",
  projectId: "diabeaters-4cf9e",
  storageBucket: "diabeaters-4cf9e.firebasestorage.app",
  messagingSenderId: "670973866835",
  appId: "1:670973866835:web:2a41f442c1abbe12bd67a6",
  measurementId: "G-877JJXG197"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);