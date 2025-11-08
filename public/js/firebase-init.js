// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config for Agreement project
const firebaseConfig = {
  apiKey: "AIzaSyDi2i-z4uH3fcrsQBJv0rkeSWRbfgh9s3s",
  authDomain: "agreement-fc451.firebaseapp.com",
  projectId: "agreement-fc451",
  storageBucket: "agreement-fc451.firebasestorage.app",
  messagingSenderId: "511030921645",
  appId: "1:511030921645:web:5eea92366fbfea00ab3924",
  measurementId: "G-R29CPD56Z7"
};

// Init
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, addDoc, serverTimestamp };
