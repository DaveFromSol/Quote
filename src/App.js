import React, { useState } from 'react';
import './App.css';
import InstantQuoteForm from './components/InstantQuoteForm';

function App() {
  const [, setShowQuote] = useState(false);

  const handleQuoteGenerated = () => {
    setShowQuote(true);
  };

  return (
    <div className="lawn-quote-app">
      <InstantQuoteForm onQuoteGenerated={handleQuoteGenerated} />
    </div>
  );
}

export default App;
