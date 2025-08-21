// Vercel serverless function for retrieving quotes
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
    // Retrieve quotes from storage
    let quotes = [];
    try {
      const quotesData = process.env.QUOTES_DATA || '[]';
      quotes = JSON.parse(quotesData);
    } catch (error) {
      console.log('No quotes found');
      quotes = [];
    }

    // Sort by timestamp (newest first)
    quotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log(`Retrieved ${quotes.length} quotes`);
    res.json({ 
      success: true, 
      quotes: quotes 
    });
    
  } catch (error) {
    console.error('Error retrieving quotes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}