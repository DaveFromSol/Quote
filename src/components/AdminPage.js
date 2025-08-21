import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';

const AdminPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      // Get quotes directly from Firestore
      const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const quotesData = [];
      snapshot.forEach(doc => {
        quotesData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setQuotes(quotesData);
      console.log(`Retrieved ${quotesData.length} quotes from Firestore`);
    } catch (err) {
      console.error('Error loading quotes:', err);
      setError('Error loading quotes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) {
      return;
    }

    try {
      // Delete quote directly from Firestore
      await deleteDoc(doc(db, 'quotes', quoteId));
      
      // Update local state
      setQuotes(quotes.filter(quote => quote.id !== quoteId));
      console.log(`Quote ${quoteId} deleted successfully from Firestore`);
    } catch (err) {
      console.error('Error deleting quote:', err);
      alert('Error deleting quote: ' + err.message);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>🏢 GD Landscaping - Quote Admin</h1>
        </div>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading quotes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>🏢 GD Landscaping - Quote Admin</h1>
        </div>
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={fetchQuotes} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🏢 GD Landscaping - Quote Admin</h1>
        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-number">{quotes.length}</span>
            <span className="stat-label">Total Quotes</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{quotes.filter(q => new Date(q.timestamp) > new Date(Date.now() - 24*60*60*1000)).length}</span>
            <span className="stat-label">Last 24 Hours</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{formatCurrency(quotes.reduce((sum, q) => sum + q.service.pricePerVisit, 0))}</span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
        <button onClick={fetchQuotes} className="refresh-btn">🔄 Refresh</button>
      </div>

      <div className="quotes-container">
        {quotes.length === 0 ? (
          <div className="no-quotes">
            <h3>No quotes yet</h3>
            <p>Customer quotes will appear here when submitted through the quote form.</p>
          </div>
        ) : (
          <div className="quotes-grid">
            {quotes.map((quote) => (
              <div key={quote.id} className="quote-card">
                <div className="quote-header">
                  <div className="customer-name">
                    <h3>{quote.customer.firstName} {quote.customer.lastName}</h3>
                    <span className="quote-date">{formatDate(quote.timestamp)}</span>
                  </div>
                  <button 
                    onClick={() => deleteQuote(quote.id)} 
                    className="delete-btn"
                    title="Delete Quote"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="quote-details">
                  <div className="customer-info">
                    <h4>📞 Contact Information</h4>
                    <p><strong>Email:</strong> {quote.customer.email}</p>
                    <p><strong>Phone:</strong> {quote.customer.phone}</p>
                    <p><strong>Preferred Date:</strong> {quote.customer.preferredDate}</p>
                    <p><strong>Preferred Time:</strong> {quote.customer.preferredTime || 'Any time'}</p>
                  </div>

                  <div className="service-info">
                    <h4>🏠 Service Details</h4>
                    <p><strong>Address:</strong> {quote.service.address}</p>
                    <p><strong>Lawn Area:</strong> {quote.service.lawnArea.toLocaleString()} sq ft ({(quote.service.lawnArea / 43560).toFixed(3)} acres)</p>
                    <p><strong>Frequency:</strong> {quote.service.frequency}</p>
                    <p><strong>Areas Selected:</strong> {quote.service.selectionCount || 1}</p>
                  </div>

                  <div className="pricing-info">
                    <h4>💰 Pricing</h4>
                    <p><strong>Price per Visit:</strong> {formatCurrency(quote.service.pricePerVisit)}</p>
                    <p><strong>Annual Total:</strong> {formatCurrency(quote.service.annualTotal)}</p>
                  </div>

                  {quote.customer.notes && (
                    <div className="notes-info">
                      <h4>📝 Special Instructions</h4>
                      <p>{quote.customer.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;