import React, { useState, useRef, useEffect } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';

const AddressInput = ({ onAddressSubmit }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        await loadGoogleMaps();
        
        if (inputRef.current) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
              types: ['address'],
              componentRestrictions: { country: 'us' }
            }
          );

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
              setAddress(place.formatted_address);
            }
          });

          autocompleteRef.current = autocomplete;
        }
      } catch (error) {
        console.error('Error loading Google Places:', error);
      }
    };

    initAutocomplete();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    
    setLoading(true);
    try {
      await onAddressSubmit(address);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="address-input-container">
      <h2>Enter Property Address</h2>
      <form onSubmit={handleSubmit} className="address-form">
        <div className="input-group">
          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Start typing address... (e.g., 123 Main St)"
            className="address-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || !address.trim()}
          >
            {loading ? 'Loading...' : 'Get Quote'}
          </button>
        </div>
        <p className="autocomplete-hint">
          💡 Address suggestions will appear as you type
        </p>
      </form>
    </div>
  );
};

export default AddressInput;