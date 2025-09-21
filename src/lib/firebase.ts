// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "studio-7284773949-d9db5",
  appId: "1:109825132451:web:541b257fb1986e1312fc16",
  apiKey: "AIzaSyCIDd6I5yKV1kM6RVWoeoioujLWufibDQA",
  authDomain: "studio-7284773949-d9db5.firebaseapp.com",
  storageBucket: "studio-7284773949-d9db5.appspot.com",
  messagingSenderId: "109825132451"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
