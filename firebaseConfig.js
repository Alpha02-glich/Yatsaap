// firebase-config.js

// Import the Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"

// Your Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBt9idZcxcTMmiIYXTJwc74XB6H8xq5QgI",
  authDomain: "yatsaap-6b6fa.firebaseapp.com",
  projectId: "yatsaap-6b6fa",
  storageBucket: "yatsaap-6b6fa.firebasestorage.app",
  messagingSenderId: "64423432893",
  appId: "1:64423432893:web:07ea815db9325e510d1dd4",
  measurementId: "G-VN3J4GJDBR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase authentication and GoogleAuthProvider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
export const db = getFirestore(app);

