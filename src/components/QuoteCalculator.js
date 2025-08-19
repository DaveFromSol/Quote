import React, { useState, useEffect } from 'react';

const QuoteCalculator = ({ area, address }) => {
  const [frequency, setFrequency] = useState('weekly');
  const [quote, setQuote] = useState(null);

  // Fixed services: Mowing, Edging, Blowing (always included)
  const includedServices = ['mowing', 'edging', 'blowing'];

  // Simplified pricing structure (per sq ft) - combined pricing for all services
  const pricing = {
    weekly: 0.028,   // Combined rate for mowing + edging + blowing
    biweekly: 0.035,
    monthly: 0.045
  };

  // Minimum charges
  const minimums = {
    weekly: 35,
    biweekly: 45,
    monthly: 65
  };

  useEffect(() => {
    if (area > 0) {
      calculateQuote();
    }
  }, [area, frequency]);

  const calculateQuote = () => {
    // Calculate total for all included services
    let total = area * pricing[frequency];

    // Apply minimum charge
    total = Math.max(total, minimums[frequency]);

    // Calculate seasonal pricing
    const sessionsPerYear = {
      weekly: 26, // Roughly 6 months of service
      biweekly: 13,
      monthly: 6
    };

    const seasonalTotal = total * sessionsPerYear[frequency];
    
    setQuote({
      perVisit: total,
      seasonal: seasonalTotal,
      frequency: frequency,
      services: includedServices
    });
  };

  const serviceLabels = {
    mowing: 'Lawn Mowing',
    edging: 'Edging',
    blowing: 'Blowing & Cleanup'
  };

  return (
    <div className="quote-calculator">
      <h3>🌱 Complete Lawn Care Service</h3>
      
      <div className="included-services">
        <h4>✅ Included Services:</h4>
        <div className="service-list">
          {includedServices.map(service => (
            <div key={service} className="service-item">
              <span className="service-icon">
                {service === 'mowing' && '🚜'}
                {service === 'edging' && '✂️'}
                {service === 'blowing' && '💨'}
              </span>
              <span className="service-name">{serviceLabels[service]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="frequency-selection">
        <h4>🗓️ Choose Your Frequency:</h4>
        <div className="frequency-options">
          <label className={`frequency-option ${frequency === 'weekly' ? 'selected' : ''}`}>
            <input
              type="radio"
              value="weekly"
              checked={frequency === 'weekly'}
              onChange={(e) => setFrequency(e.target.value)}
            />
            <div className="option-content">
              <span className="option-title">Weekly</span>
              <span className="option-desc">Best for growing season</span>
            </div>
          </label>
          
          <label className={`frequency-option ${frequency === 'biweekly' ? 'selected' : ''}`}>
            <input
              type="radio"
              value="biweekly"
              checked={frequency === 'biweekly'}
              onChange={(e) => setFrequency(e.target.value)}
            />
            <div className="option-content">
              <span className="option-title">Bi-weekly</span>
              <span className="option-desc">Most popular choice</span>
            </div>
          </label>
          
          <label className={`frequency-option ${frequency === 'monthly' ? 'selected' : ''}`}>
            <input
              type="radio"
              value="monthly"
              checked={frequency === 'monthly'}
              onChange={(e) => setFrequency(e.target.value)}
            />
            <div className="option-content">
              <span className="option-title">Monthly</span>
              <span className="option-desc">Maintenance only</span>
            </div>
          </label>
        </div>
      </div>

      {quote && (
        <div className="quote-display">
          <h3>Your Quote</h3>
          <div className="quote-details">
            <div className="property-info">
              <p><strong>Address:</strong> {address}</p>
              <p><strong>Lawn Area:</strong> {Math.round(area).toLocaleString()} sq ft</p>
              <p><strong>Services:</strong> {quote.services.map(s => serviceLabels[s]).join(', ')}</p>
              <p><strong>Frequency:</strong> {frequency.charAt(0).toUpperCase() + frequency.slice(1)}</p>
            </div>
            
            <div className="pricing-info">
              <div className="price-line">
                <span>Per Visit:</span>
                <span className="price">${quote.perVisit.toFixed(2)}</span>
              </div>
              <div className="price-line total">
                <span>Seasonal Total ({frequency}):</span>
                <span className="price">${quote.seasonal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="quote-actions">
            <button className="accept-quote-btn">
              Accept Quote
            </button>
            <button className="modify-quote-btn">
              Modify Services
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteCalculator;