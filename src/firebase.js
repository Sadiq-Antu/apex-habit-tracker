import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Hardcoded Firebase SDK keys for seamless deployment on Cloudflare and local dev servers
const firebaseConfig = {
  apiKey: "AIzaSyCx6oifKAF7lVGXfnt33KRHYuFYHCVOEfQ",
  authDomain: "apex-habits-antu.firebaseapp.com",
  projectId: "apex-habits-antu",
  storageBucket: "apex-habits-antu.firebasestorage.app",
  messagingSenderId: "959674048245",
  appId: "1:959674048245:web:ffbd1c6a356d7e98f5afbc"
};

let app = null;
let auth = null;
let googleProvider = null;
let db = null;
let isFirebaseConfigured = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  // Initialize Firestore with multi-tab offline persistence enabled
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
  isFirebaseConfigured = true;
} catch (error) {
  console.error("Firebase SDK initialization failed:", error);
}

export { auth, googleProvider, db, isFirebaseConfigured };
