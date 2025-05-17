import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { auth } from './firebaseConfig.js';

const googleProvider = new GoogleAuthProvider();

// Function to start login
export async function loginWithGoogle(handleLogin) {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  try {
    if (isMobile) {
      // Mobile: Use redirect
      await signInWithRedirect(auth, googleProvider);
    } else {
      // Desktop: Use popup
      const result = await signInWithPopup(auth, googleProvider);
      handleLogin(result.user);
    }
  } catch (error) {
    console.error("Google login error:", error);
    alert("Google login failed: " + error.message);
  }
}

// Function to check redirect result on page load
export async function handleRedirectResult(handleLogin) {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      handleLogin(result.user);
    }
  } catch (error) {
    console.error("Redirect error:", error);
  }
}
