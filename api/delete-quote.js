// Vercel serverless function for deleting quotes
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';

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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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
    const { quoteId } = req.body;

    if (!quoteId) {
      return res.status(400).json({ success: false, error: 'Quote ID required' });
    }

    // Delete quote from Firestore
    await deleteDoc(doc(db, 'quotes', quoteId));

    console.log(`Quote ${quoteId} deleted successfully from Firestore`);
    res.json({ 
      success: true, 
      message: 'Quote deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}