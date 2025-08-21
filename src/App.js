import React, { useState } from 'react';
import './App.css';
import InstantQuoteForm from './components/InstantQuoteForm';
import AdminPage from './components/AdminPage';

function App() {
  const [, setShowQuote] = useState(false);
  const [currentView, setCurrentView] = useState('quote'); // 'quote' or 'admin'

  const handleQuoteGenerated = () => {
    setShowQuote(true);
  };

  // Check URL for admin access
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setCurrentView('admin');
    }
  }, []);

  return (
    <div className="lawn-quote-app">
      {currentView === 'admin' ? (
        <AdminPage />
      ) : (
        <InstantQuoteForm onQuoteGenerated={handleQuoteGenerated} />
      )}
      
      {/* Admin access button (hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
          <button 
            onClick={() => setCurrentView(currentView === 'admin' ? 'quote' : 'admin')}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            {currentView === 'admin' ? '📋' : '👤'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
