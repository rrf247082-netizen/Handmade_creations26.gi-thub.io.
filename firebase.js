import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQCGH_AJIFR4nIbHAM2QY3RRU7J3anpOw",
  authDomain: "handmade-creations-26.firebaseapp.com",
  projectId: "handmade-creations-26",
  storageBucket: "handmade-creations-26.firebasestorage.app",
  messagingSenderId: "417729378912",
  appId: "1:417729378912:web:aabbd2813706e7faf8e105",
  measurementId: "G-L124M89TLL"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  serverTimestamp
};
