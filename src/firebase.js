import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBG3Kot5_in0V-FTJqvYZenYmMdPeg1xVg",
  authDomain: "gdlocation-16372.firebaseapp.com",
  projectId: "gdlocation-16372",
  storageBucket: "gdlocation-16372.firebasestorage.app",
  messagingSenderId: "9627340888",
  appId: "1:9627340888:web:fc28cb9908a6362e72fa2d",
  measurementId: "G-2QYH6VCYYQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;