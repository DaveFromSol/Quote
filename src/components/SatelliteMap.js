import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import AutoLotDetection from './AutoLotDetection';

const SatelliteMap = ({ address, onAreaCalculated }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [calculatedArea, setCalculatedArea] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detectionMode, setDetectionMode] = useState('auto'); // 'auto' or 'manual'
  const [autoDetectionComplete, setAutoDetectionComplete] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setError('Google Maps API key is missing. Please check your .env file.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await loadGoogleMaps();
        
        // Geocode the address
        const geocoder = new window.google.maps.Geocoder();
        const results = await new Promise((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK') resolve(results);
            else reject(status);
          });
        });

        const location = results[0].geometry.location;
        
        // Create map
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: location,
          zoom: 20,
          mapTypeId: 'satellite',
          tilt: 0
        });

        // Create drawing manager
        const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
          drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [window.google.maps.drawing.OverlayType.POLYGON]
          },
          polygonOptions: {
            fillColor: '#00FF00',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#00FF00',
            clickable: false,
            editable: true,
            zIndex: 1
          }
        });

        drawingManagerInstance.setMap(mapInstance);

        // Handle polygon completion
        drawingManagerInstance.addListener('polygoncomplete', (polygon) => {
          // Remove previous polygon
          if (selectedArea) {
            selectedArea.setMap(null);
          }

          setSelectedArea(polygon);
          
          // Calculate area
          const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
          const areaInSqFt = area * 10.764; // Convert m² to ft²
          setCalculatedArea(areaInSqFt);
          onAreaCalculated(areaInSqFt);

          // Stop drawing
          drawingManagerInstance.setDrawingMode(null);

          // Allow editing
          polygon.addListener('click', () => {
            polygon.setEditable(true);
          });

          // Recalculate on edit
          polygon.getPath().addListener('set_at', () => {
            const newArea = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
            const newAreaInSqFt = newArea * 10.764;
            setCalculatedArea(newAreaInSqFt);
            onAreaCalculated(newAreaInSqFt);
          });

          polygon.getPath().addListener('insert_at', () => {
            const newArea = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
            const newAreaInSqFt = newArea * 10.764;
            setCalculatedArea(newAreaInSqFt);
            onAreaCalculated(newAreaInSqFt);
          });
        });

        setMap(mapInstance);
        setDrawingManager(drawingManagerInstance);
        setLoading(false);

      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError(`Failed to load Google Maps: ${error.message || error}`);
        setLoading(false);
      }
    };

    if (address) {
      initMap();
    }
  }, [address, onAreaCalculated, selectedArea]);

  const handleAutoDetection = (detectionResults) => {
    setCalculatedArea(detectionResults.estimatedLawnArea);
    setAutoDetectionComplete(true);
    onAreaCalculated(detectionResults.estimatedLawnArea);
  };

  const handleManualMode = () => {
    setDetectionMode('manual');
    setAutoDetectionComplete(false);
  };

  const clearSelection = () => {
    if (selectedArea) {
      selectedArea.setMap(null);
      setSelectedArea(null);
      setCalculatedArea(0);
      onAreaCalculated(0);
    }
    if (drawingManager) {
      drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
    }
  };

  if (error) {
    return (
      <div className="satellite-map-container">
        <div className="error-display">
          <h3>⚠️ Google Maps Error</h3>
          <p>{error}</p>
          <div className="error-solutions">
            <h4>Possible solutions:</h4>
            <ul>
              <li>Verify your Google Maps API key is correct</li>
              <li>Enable these APIs in Google Cloud Console:
                <ul>
                  <li>Maps JavaScript API</li>
                  <li>Places API</li>
                  <li>Geocoding API</li>
                </ul>
              </li>
              <li>Check API key restrictions (HTTP referrers, IP addresses)</li>
              <li>Ensure billing is enabled for your Google Cloud project</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="satellite-map-container">
      {/* Auto Detection Section */}
      {detectionMode === 'auto' && !autoDetectionComplete && !loading && (
        <AutoLotDetection 
          address={address}
          onLotDetected={handleAutoDetection}
          onManualMode={handleManualMode}
        />
      )}

      {/* Manual Drawing Section */}
      {(detectionMode === 'manual' || autoDetectionComplete) && (
        <div className="map-controls">
          {autoDetectionComplete ? (
            <div>
              <h3>✅ Auto-detection Complete</h3>
              <p>Want to refine the measurement? Use the drawing tools below.</p>
            </div>
          ) : (
            <h3>Draw the lawn area on the map</h3>
          )}
          
          {loading && (
            <div className="loading-display">
              <p>🗺️ Loading satellite map...</p>
            </div>
          )}
          
          <div className="area-display">
            {calculatedArea > 0 && (
              <p>Selected Area: {Math.round(calculatedArea).toLocaleString()} sq ft</p>
            )}
          </div>
          
          {!loading && (
            <div className="control-buttons">
              <button onClick={clearSelection} className="clear-btn">
                Clear Selection
              </button>
              {autoDetectionComplete && (
                <button 
                  onClick={() => {
                    setDetectionMode('auto');
                    setAutoDetectionComplete(false);
                    setCalculatedArea(0);
                    onAreaCalculated(0);
                  }} 
                  className="auto-detect-btn"
                >
                  🛰️ Try Auto-Detect Again
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map Display */}
      {(detectionMode === 'manual' || autoDetectionComplete || loading) && (
        <div ref={mapRef} className="map" style={{ height: '400px', width: '100%' }} />
      )}
    </div>
  );
};

export default SatelliteMap;