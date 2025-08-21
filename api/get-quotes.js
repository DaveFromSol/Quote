// Vercel serverless function for retrieving quotes
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get quotes from Firestore, ordered by creation time (newest first)
    const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const quotes = [];
    snapshot.forEach(doc => {
      quotes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`Retrieved ${quotes.length} quotes from Firestore`);
    res.json({ 
      success: true, 
      quotes: quotes 
    });
    
  } catch (error) {
    console.error('Error retrieving quotes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}