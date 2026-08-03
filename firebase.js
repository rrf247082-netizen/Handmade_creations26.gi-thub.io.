// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQCGH_AJIFR4nIbHAM2QY3RRU7J3anpOw",
  authDomain: "handmade-creations-26.firebaseapp.com",
  projectId: "handmade-creations-26",
  storageBucket: "handmade-creations-26.firebasestorage.app",
  messagingSenderId: "417729378912",
  appId: "1:417729378912:web:aabbd2813706e7faf8e105",
  measurementId: "G-L124M89TLL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const auth = getAuth(app);
const db = getFirestore(app);

// Export
export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
