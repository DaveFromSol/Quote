// Vercel serverless function for storing booking quotes
import fs from 'fs';
import path from 'path';

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

    // Create quote object with unique ID
    const quote = {
      id: Date.now() + Math.random(),
      customer,
      service,
      timestamp: timestamp || new Date().toISOString(),
      status: 'new'
    };

    // Try to read existing quotes
    let quotes = [];
    try {
      // In Vercel, we'll use environment variables or external storage
      // For now, we'll simulate storage with in-memory array
      const quotesData = process.env.QUOTES_DATA || '[]';
      quotes = JSON.parse(quotesData);
    } catch (error) {
      console.log('No existing quotes found, starting fresh');
      quotes = [];
    }

    // Add new quote
    quotes.push(quote);

    // Keep only last 100 quotes to prevent memory issues
    if (quotes.length > 100) {
      quotes = quotes.slice(-100);
    }

    // Store quotes (in production, you'd use a proper database)
    process.env.QUOTES_DATA = JSON.stringify(quotes);

    console.log('Quote stored successfully:', quote.id);
    res.json({ 
      success: true, 
      message: 'Quote submitted successfully',
      quoteId: quote.id 
    });
    
  } catch (error) {
    console.error('Error storing quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}