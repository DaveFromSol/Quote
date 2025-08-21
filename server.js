const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// For development, we'll use the Vercel API endpoints
// The React app will connect directly to Firestore client-side for development

// Middleware
app.use(cors());
app.use(express.json());

// Store booking endpoint
app.post('/api/send-booking', async (req, res) => {
  try {
    const { customer, service, timestamp } = req.body;

    // Create quote object
    const quote = {
      customer,
      service,
      timestamp: timestamp || new Date().toISOString(),
      status: 'new',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add quote to Firestore
    const docRef = await db.collection('quotes').add(quote);
    
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
});

// Get quotes endpoint
app.get('/api/get-quotes', async (req, res) => {
  try {
    // Get quotes from Firestore, ordered by creation time (newest first)
    const snapshot = await db.collection('quotes')
      .orderBy('createdAt', 'desc')
      .get();

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
});

// Delete quote endpoint
app.post('/api/delete-quote', async (req, res) => {
  try {
    const { quoteId } = req.body;

    if (!quoteId) {
      return res.status(400).json({ success: false, error: 'Quote ID required' });
    }

    // Delete quote from Firestore
    await db.collection('quotes').doc(quoteId).delete();

    console.log(`Quote ${quoteId} deleted successfully from Firestore`);
    res.json({ 
      success: true, 
      message: 'Quote deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});