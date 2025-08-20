import React, { useState, useRef, useEffect } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';

const InstantQuoteForm = ({ onQuoteGenerated }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [frequency, setFrequency] = useState('biweekly');
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [lawnSelections, setLawnSelections] = useState([]);
  const [totalLawnArea, setTotalLawnArea] = useState(0);
  const [mapCenter, setMapCenter] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Select Lawn, 3: See Price & Frequency, 4: Book
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    notes: ''
  });
  
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const drawingManagerRef = useRef(null);
  const polygonsRef = useRef([]);

  useEffect(() => {
    initAutocomplete();
  }, []);

  const initAutocomplete = async () => {
    try {
      await loadGoogleMaps();
      
      if (inputRef.current) {
        // Use the standard Autocomplete (works reliably)
        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'geometry.location']
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('Google Places selected:', place); // Debug log
          
          if (place.formatted_address && place.geometry) {
            setAddress(place.formatted_address);
            generateInstantQuote(place.formatted_address, place.geometry.location);
          }
        });

        autocompleteRef.current = autocomplete;
      }
    } catch (error) {
      console.error('Error loading Google Places:', error);
      setError('Failed to load address suggestions');
    }
  };

  const generateInstantQuote = async (inputAddress, location) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading satellite map for address:', inputAddress);
      
      if (location) {
        setMapCenter({
          lat: location.lat(),
          lng: location.lng()
        });
        setAddress(inputAddress);
        setShowMap(true);
        setCurrentStep(2); // Move to lawn selection step
        setLoading(false);
      } else {
        // Geocode the address to get coordinates
        await loadGoogleMaps();
        const geocoder = new window.google.maps.Geocoder();
        
        geocoder.geocode({ address: inputAddress }, (results, status) => {
          if (status === 'OK' && results.length > 0) {
            const location = results[0].geometry.location;
            setMapCenter({
              lat: location.lat(),
              lng: location.lng()
            });
            setAddress(results[0].formatted_address);
            setShowMap(true);
            setCurrentStep(2); // Move to lawn selection step
            setLoading(false);
          } else {
            setError('Address not found. Please try a different address.');
            setLoading(false);
          }
        });
      }
    } catch (error) {
      console.error('Error loading map:', error);
      setError('Unable to load satellite map for this address');
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    if (!mapCenter || !mapRef.current) return;
    
    try {
      await loadGoogleMaps();
      
      const map = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 20,
        mapTypeId: 'satellite',
        tilt: 0,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'cooperative', // Better mobile touch handling
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM
        }
      });
      
      // Initialize drawing manager for lawn area selection
      const drawingManager = new window.google.maps.drawing.DrawingManager({
        drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: ['polygon']
        },
        polygonOptions: {
          fillColor: '#32CD32',
          fillOpacity: 0.5,
          strokeWeight: 2,
          strokeColor: '#228B22',
          clickable: false,
          editable: true,
          geodesic: false
        }
      });
      
      drawingManager.setMap(map);
      drawingManagerRef.current = drawingManager;
      
      // Handle polygon completion
      window.google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon) => {
        // Calculate area for this polygon
        const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
        const areaInSqFt = Math.round(area * 10.764); // Convert sq meters to sq feet
        
        // Create selection object
        const selection = {
          id: Date.now() + Math.random(), // Unique ID
          polygon: polygon,
          area: areaInSqFt,
          color: getNextSelectionColor(polygonsRef.current.length)
        };
        
        // Style the polygon
        polygon.setOptions({
          fillColor: selection.color,
          strokeColor: selection.color,
          editable: true
        });
        
        // Add click listener to remove polygon
        window.google.maps.event.addListener(polygon, 'click', () => {
          removeSelection(selection.id);
        });
        
        // Add path change listener to update area when edited
        window.google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
          updateSelectionArea(selection.id);
        });
        window.google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
          updateSelectionArea(selection.id);
        });
        
        // Store polygon reference
        polygonsRef.current.push(selection);
        
        // Update state
        setLawnSelections(prev => [...prev, selection]);
        updateTotalArea([...polygonsRef.current]);
        
        console.log('Lawn selection added:', areaInSqFt, 'sq ft. Total selections:', polygonsRef.current.length);
        
        // Keep drawing mode active for multiple selections
        drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
      });
      
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to load satellite map');
    }
  };
  
  useEffect(() => {
    if (showMap && mapCenter) {
      initializeMap();
    }
  }, [showMap, mapCenter]);

  // Helper functions for multiple selections
  const getNextSelectionColor = (index) => {
    const colors = [
      '#32CD32', // Lime Green
      '#FF6347', // Tomato
      '#4169E1', // Royal Blue
      '#FFD700', // Gold
      '#FF69B4', // Hot Pink
      '#00CED1', // Dark Turquoise
      '#FFA500', // Orange
      '#9370DB'  // Medium Purple
    ];
    return colors[index % colors.length];
  };

  const updateTotalArea = (selections) => {
    const total = selections.reduce((sum, selection) => sum + selection.area, 0);
    setTotalLawnArea(total);
  };

  const updateSelectionArea = (selectionId) => {
    const selection = polygonsRef.current.find(s => s.id === selectionId);
    if (selection) {
      const newArea = window.google.maps.geometry.spherical.computeArea(selection.polygon.getPath());
      const newAreaInSqFt = Math.round(newArea * 10.764);
      selection.area = newAreaInSqFt;
      
      // Update state
      setLawnSelections(prev => prev.map(s => 
        s.id === selectionId ? { ...s, area: newAreaInSqFt } : s
      ));
      updateTotalArea(polygonsRef.current);
    }
  };

  const removeSelection = (selectionId) => {
    const selection = polygonsRef.current.find(s => s.id === selectionId);
    if (selection) {
      // Remove polygon from map
      selection.polygon.setMap(null);
      
      // Remove from arrays
      polygonsRef.current = polygonsRef.current.filter(s => s.id !== selectionId);
      setLawnSelections(prev => prev.filter(s => s.id !== selectionId));
      updateTotalArea(polygonsRef.current);
      
      console.log('Selection removed. Remaining selections:', polygonsRef.current.length);
    }
  };

  const clearAllSelections = () => {
    // Remove all polygons from map
    polygonsRef.current.forEach(selection => {
      selection.polygon.setMap(null);
    });
    
    // Clear arrays
    polygonsRef.current = [];
    setLawnSelections([]);
    setTotalLawnArea(0);
    
    console.log('All selections cleared');
  };
  
  const generateQuoteFromArea = () => {
    if (totalLawnArea > 0) {
      const quoteData = calculateQuote(totalLawnArea, address, null);
      quoteData.confidence = 'High';
      quoteData.dataSource = 'Manual Satellite Selection';
      quoteData.selectionCount = lawnSelections.length;
      setQuote(quoteData);
      setCurrentStep(3); // Move to price & frequency selection step
      onQuoteGenerated();
    }
  };
  
  const resetSelection = () => {
    clearAllSelections();
    setShowMap(false);
    setQuote(null);
    setAddress('');
    setShowBooking(false);
    setCurrentStep(1); // Reset to first step
    setCustomerInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      preferredDate: '',
      preferredTime: '',
      notes: ''
    });
  };

  const handleBookingSubmit = async () => {
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'preferredDate'];
    const missingFields = requiredFields.filter(field => !customerInfo[field]);
    
    if (missingFields.length > 0) {
      alert('Please fill in all required fields: ' + missingFields.join(', '));
      return;
    }

    // Prepare booking data
    const bookingData = {
      customer: customerInfo,
      service: {
        address: quote.address,
        lawnArea: quote.lawnArea,
        frequency: frequency,
        pricePerVisit: quote.perVisit,
        annualTotal: quote.seasonal,
        selectionCount: quote.selectionCount
      },
      timestamp: new Date().toISOString()
    };

    console.log('Booking submitted:', bookingData);

    // Send email notification via backend API
    try {
      // Use environment variable for API endpoint, fallback to relative path or localhost
      const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 
                         (process.env.NODE_ENV === 'production' ? '/api/send-booking' : 'http://localhost:3001/api/send-booking');
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Email sent successfully to david.richter1212@gmail.com');
      } else {
        console.error('Failed to send email:', result.error);
      }
      
    } catch (error) {
      console.error('Error sending booking notification:', error);
      // Don't block the user experience if email fails
    }
    
    // Show confirmation
    alert(`✅ Booking Confirmed!

Thank you ${customerInfo.firstName} ${customerInfo.lastName}!

Your lawn care service has been scheduled for ${quote.address}.

We'll contact you at ${customerInfo.phone} to confirm the exact time for ${customerInfo.preferredDate}.

Service Details:
• ${quote.lawnArea.toLocaleString()} sq ft lawn area
• ${frequency} service at $${quote.perVisit.toFixed(2)} per visit

A confirmation email will be sent to ${customerInfo.email}.
The booking details have been sent to our team for processing.`);

    // Reset form
    resetSelection();
  };

  const calculateQuote = (area, inputAddress, propertyInfo) => {
    return calculateQuoteWithFrequency(area, inputAddress, propertyInfo, frequency);
  };

  const calculateQuoteWithFrequency = (area, inputAddress, propertyInfo, selectedFrequency) => {
    const acres = area / 43560; // Convert sq ft to acres
    
    // Tiered pricing structure - round up to nearest 0.1 acre tier
    const getTieredPrice = (acres) => {
      // Round up to nearest 0.1 acre tier
      const tierLevel = Math.ceil(acres / 0.1);
      
      // Base price starts at $40 for 0.1 acre, then +$5 per tier
      if (tierLevel <= 1) return 40;   // 0.1 acre or less
      if (tierLevel <= 2) return 45;   // 0.2 acre
      if (tierLevel <= 3) return 50;   // 0.3 acre  
      if (tierLevel <= 4) return 55;   // 0.4 acre
      if (tierLevel <= 5) return 60;   // 0.5 acre
      if (tierLevel <= 6) return 65;   // 0.6 acre
      if (tierLevel <= 7) return 70;   // 0.7 acre
      if (tierLevel <= 8) return 75;   // 0.8 acre
      if (tierLevel <= 9) return 80;   // 0.9 acre
      if (tierLevel <= 10) return 85;  // 1.0 acre
      
      // For larger properties, continue the $5 per 0.1 acre pattern
      return 40 + ((tierLevel - 1) * 5);
    };

    const frequencyMultipliers = {
      onetime: 1.0,    // Same as bi-weekly rate
      weekly: 0.8,     // 20% discount for weekly (best rate)
      biweekly: 1.0,   // Base rate for bi-weekly
      monthly: 1.0     // Same as bi-weekly rate
    };

    const sessionsPerYear = {
      onetime: 1,
      weekly: 26,
      biweekly: 13,
      monthly: 6
    };

    // Calculate base price per visit using tiered pricing
    const basePricePerVisit = getTieredPrice(acres) * frequencyMultipliers[selectedFrequency];
    
    // Apply $35 minimum
    const perVisit = Math.max(basePricePerVisit, 35);
    const seasonal = perVisit * sessionsPerYear[selectedFrequency];

    return {
      address: inputAddress,
      lawnArea: area,
      perVisit,
      seasonal,
      frequency: selectedFrequency,
      services: ['Mowing', 'Edging', 'Blowing & Cleanup'],
      propertyInfo: propertyInfo || null
    };
  };

  const handleFrequencyChange = (newFrequency) => {
    setFrequency(newFrequency);
    if (quote) {
      // Recalculate quote with new frequency - need to pass newFrequency to calculateQuote
      const updatedQuote = calculateQuoteWithFrequency(quote.lawnArea, quote.address, quote.propertyInfo, newFrequency);
      updatedQuote.confidence = quote.confidence;
      updatedQuote.dataSource = quote.dataSource;
      updatedQuote.selectionCount = quote.selectionCount;
      setQuote(updatedQuote);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (address.trim()) {
      console.log('Manual address submission:', address); // Debug log
      
      try {
        // Make sure Google Maps is loaded
        await loadGoogleMaps();
        
        // Geocode manually entered address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results.length > 0) {
            console.log('Manual geocoding successful:', results[0]); // Debug log
            generateInstantQuote(address, results[0].geometry.location);
          } else {
            console.log('Manual geocoding failed:', status); // Debug log
            setError('Address not found. Please try a different address.');
          }
        });
      } catch (error) {
        console.error('Error with manual submission:', error);
        setError('Unable to process address. Please try again.');
      }
    }
  };

  return (
    <div className="instant-quote-form">
      <div className="app-title-section">
        <h1>🌿 GD Landscaping Instant Lawn Quote</h1>
        <p className="expert-service-tagline">⚡ Expert lawn service scheduled within 24 hours!</p>
        <p className="app-description">Use satellite imagery to measure your lawn and get an instant quote • Cancel anytime, no commitment • No upfront payment needed</p>
      </div>

      {/* Step Progress Indicator */}
      <div className="step-progress">
        <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Enter Address</span>
        </div>
        <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Select Lawn Area</span>
        </div>
        <div className={`step-item ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Choose Frequency</span>
        </div>
        <div className={`step-item ${currentStep >= 4 ? 'active' : ''}`}>
          <span className="step-number">4</span>
          <span className="step-label">Book Service</span>
        </div>
      </div>
      
      {/* Step 1: Address Input */}
      {currentStep === 1 && (
        <div className="address-section">
        <form onSubmit={handleManualSubmit} className="address-form">
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address to view satellite imagery and select your lawn..."
              className="address-input instant"
              disabled={loading}
            />
            {!loading && (
              <button type="submit" className="quote-btn">
                Get Quote
              </button>
            )}
          </div>
        </form>
        
        <div className="demo-hint">
          🛰️ <strong>Enter your address and use satellite imagery to select your lawn area!</strong> Draw around your grass areas for the most accurate quote.
          <br/><br/>
          ⭐ <strong>Save more with weekly service!</strong> Includes professional mowing, edging & cleanup
        </div>
        
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>🛰️ Loading satellite map...</p>
            <p>📍 Locating your property...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}
        </div>
      )}

      {/* Step 2: Lawn Area Selection */}
      {currentStep === 2 && showMap && (
        <div className="satellite-map-section">
          <div className="map-header">
            <h2>🛰️ Select Your Lawn Area</h2>
            <p className="map-address">📍 {address}</p>
            <div className="map-instructions">
              <p><strong>Instructions:</strong></p>
              <ol>
                <li>📱 <strong>Mobile tip:</strong> Use two fingers to pan and zoom the map</li>
                <li>🔧 Use the polygon tool above the map to draw around your lawn areas</li>
                <li>👆 Tap points around the edges of your grass to create an outline</li>
                <li>✅ Tap the first point again to complete the selection</li>
                <li>🎨 <strong>Draw multiple areas!</strong> Front yard, back yard, side yards - each gets a different color</li>
                <li>❌ Tap any polygon to remove it, or drag corners to adjust</li>
              </ol>
            </div>
          </div>
          
          <div 
            ref={mapRef} 
            className="satellite-map"
            style={{ width: '100%', height: '500px', borderRadius: '12px' }}
          />
          
          {lawnSelections.length > 0 && (
            <div className="area-results">
              <div className="selections-summary">
                <h3>🎯 Lawn Areas Selected ({lawnSelections.length})</h3>
                <div className="selections-list">
                  {lawnSelections.map((selection, index) => (
                    <div key={selection.id} className="selection-item">
                      <div 
                        className="color-indicator" 
                        style={{ backgroundColor: selection.color }}
                      ></div>
                      <span className="selection-text">
                        Area {index + 1}: {selection.area.toLocaleString()} sq ft
                      </span>
                      <button 
                        className="remove-selection-btn"
                        onClick={() => removeSelection(selection.id)}
                        title="Remove this area"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="area-display">
                <h3>✅ Total Lawn Area</h3>
                <p className="area-size">{totalLawnArea.toLocaleString()} sq ft</p>
                <p className="area-acres">({(totalLawnArea / 43560).toFixed(3)} acres)</p>
              </div>
              
              <div className="map-actions">
                <button className="generate-quote-btn" onClick={generateQuoteFromArea}>
                  ➡️ Continue to Pricing
                </button>
                <button className="redraw-btn" onClick={clearAllSelections}>
                  🗑️ Clear All Areas
                </button>
                <button className="new-address-btn" onClick={() => setCurrentStep(1)}>
                  ⬅️ Change Address
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Price Display & Frequency Selection */}
      {currentStep === 3 && quote && (
        <div className="instant-quote-display">
          <div className="quote-header">
            <h2>✅ Your Instant Quote</h2>
            <p className="address-display">📍 {quote.address}</p>
            <p className="lawn-size">🌱 Total lawn area: {quote.lawnArea.toLocaleString()} sq ft ({(quote.lawnArea / 43560).toFixed(3)} acres)</p>
            {quote.selectionCount && (
              <p className="selection-count">🎯 {quote.selectionCount} separate areas selected</p>
            )}
            <div className="data-source">
              <span className={`confidence ${quote.confidence?.toLowerCase()}`}>
                {quote.confidence} Confidence
              </span>
              <span className="source">• {quote.dataSource}</span>
            </div>
            {quote.propertyInfo && quote.propertyInfo.lotSizeSquareFeet && (
              <p className="lot-info">📐 Total lot: {quote.propertyInfo.lotSizeSquareFeet.toLocaleString()} sq ft</p>
            )}
          </div>

          <div className="services-included">
            <h3>Services Included:</h3>
            <div className="service-tags">
              <span className="service-tag">🚜 Mowing</span>
              <span className="service-tag">✂️ Edging</span>
              <span className="service-tag">💨 Blowing & Cleanup</span>
            </div>
          </div>

          <div className="frequency-selector">
            <h3>Choose Your Schedule:</h3>
            <div className="frequency-buttons">
              <button 
                className={`freq-btn ${frequency === 'onetime' ? 'active' : ''}`}
                onClick={() => handleFrequencyChange('onetime')}
              >
                One Time
              </button>
              <button 
                className={`freq-btn ${frequency === 'weekly' ? 'active' : ''}`}
                onClick={() => handleFrequencyChange('weekly')}
              >
                Weekly
              </button>
              <button 
                className={`freq-btn ${frequency === 'biweekly' ? 'active' : ''}`}
                onClick={() => handleFrequencyChange('biweekly')}
              >
                Bi-weekly
              </button>
              <button 
                className={`freq-btn ${frequency === 'monthly' ? 'active' : ''}`}
                onClick={() => handleFrequencyChange('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="pricing-display">
            <div className="price-card">
              <div className="price-line">
                <span>{frequency === 'onetime' ? 'Total Service Price:' : 'Price per cut:'}</span>
                <span className="price">${quote.perVisit.toFixed(2)}</span>
              </div>
              {frequency === 'onetime' && (
                <div className="savings-note" style={{background: 'linear-gradient(135deg, #6f42c1 0%, #9c27b0 100())'}}>
                  ⚡ <span className="savings-text">One-time service - standard rate</span>
                </div>
              )}
              {frequency === 'weekly' && (
                <div className="savings-note">
                  💰 <span className="savings-text">Best rate! You save 20% with weekly service!</span>
                </div>
              )}
              {frequency === 'biweekly' && (
                <div className="savings-note" style={{background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100())'}}>
                  ✅ <span className="savings-text">Standard rate - great value!</span>
                </div>
              )}
              {frequency === 'monthly' && (
                <div className="savings-note" style={{background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100())'}}>
                  📅 <span className="savings-text">Monthly service - standard rate</span>
                </div>
              )}
            </div>
          </div>

          <div className="quote-actions">
            <button className="book-btn" onClick={() => setCurrentStep(4)}>
              ➡️ Book This Service
            </button>
            <button className="modify-btn" onClick={() => setCurrentStep(2)}>
              ⬅️ Adjust Lawn Area
            </button>
            <button className="new-quote-btn" onClick={resetSelection}>
              🔄 Start Over
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Booking Form */}
      {currentStep === 4 && quote && (
        <div className="booking-form-section">
          <div className="booking-header">
            <h2>📅 Schedule Your Lawn Care Service</h2>
            <p className="booking-subtitle">Complete your booking for {quote.address}</p>
          </div>

          <div className="booking-form">
            <div className="customer-info-section">
              <h3>Contact Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, firstName: e.target.value}))}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, lastName: e.target.value}))}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                    className="form-input"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="scheduling-section">
              <h3>Preferred Schedule</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="preferredDate">Preferred Start Date *</label>
                  <input
                    type="date"
                    id="preferredDate"
                    value={customerInfo.preferredDate}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, preferredDate: e.target.value}))}
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="preferredTime">Preferred Time</label>
                  <select
                    id="preferredTime"
                    value={customerInfo.preferredTime}
                    onChange={(e) => setCustomerInfo(prev => ({...prev, preferredTime: e.target.value}))}
                    className="form-input"
                  >
                    <option value="">Any time</option>
                    <option value="morning">Morning (8AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 5PM)</option>
                    <option value="early-morning">Early Morning (7AM - 9AM)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="service-summary">
              <h3>Service Summary</h3>
              <div className="summary-details">
                <div className="summary-item">
                  <span className="label">Property:</span>
                  <span className="value">{quote.address}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Lawn Area:</span>
                  <span className="value">{quote.lawnArea.toLocaleString()} sq ft ({(quote.lawnArea / 43560).toFixed(3)} acres)</span>
                </div>
                <div className="summary-item">
                  <span className="label">Service Frequency:</span>
                  <span className="value">{frequency === 'onetime' ? 'One Time Service' : frequency.charAt(0).toUpperCase() + frequency.slice(1)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">{frequency === 'onetime' ? 'Total Price:' : 'Price per Visit:'}</span>
                  <span className="value">${quote.perVisit.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Service Type:</span>
                  <span className="value">Professional lawn care with mowing, edging & cleanup</span>
                </div>
              </div>
            </div>

            <div className="notes-section">
              <div className="form-group">
                <label htmlFor="notes">Special Instructions (Optional)</label>
                <textarea
                  id="notes"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, notes: e.target.value}))}
                  className="form-textarea"
                  placeholder="Any special instructions, gate codes, pet information, etc."
                  rows="4"
                />
              </div>
            </div>

            <div className="booking-actions">
              <button className="confirm-booking-btn" onClick={handleBookingSubmit}>
                ✅ Confirm Booking
              </button>
              <button className="cancel-booking-btn" onClick={() => setCurrentStep(3)}>
                ⬅️ Back to Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstantQuoteForm;