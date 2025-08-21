// Vercel serverless function for deleting quotes
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

    // Retrieve existing quotes
    let quotes = [];
    try {
      const quotesData = process.env.QUOTES_DATA || '[]';
      quotes = JSON.parse(quotesData);
    } catch (error) {
      quotes = [];
    }

    // Find and remove the quote
    const initialLength = quotes.length;
    quotes = quotes.filter(quote => quote.id !== quoteId);

    if (quotes.length === initialLength) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    // Update storage
    process.env.QUOTES_DATA = JSON.stringify(quotes);

    console.log(`Quote ${quoteId} deleted successfully`);
    res.json({ 
      success: true, 
      message: 'Quote deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}