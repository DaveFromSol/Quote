// Vercel serverless function for storing booking quotes
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { customer, service, timestamp } = req.body;

    // Create quote object
    const quote = {
      customer,
      service,
      timestamp: timestamp || new Date().toISOString(),
      status: 'new',
      createdAt: serverTimestamp()
    };

    // Add quote to Firestore
    const docRef = await addDoc(collection(db, 'quotes'), quote);
    
    console.log('Quote stored successfully in Firestore:', docRef.id);
    res.json({ 
      success: true, 
      message: 'Quote submitted successfully',
      quoteId: docRef.id 
    });
    
  } catch (error) {
    console.error('Error storing quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}