import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance = null;
let isLoaded = false;

export const getGoogleMapsLoader = () => {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'drawing', 'geometry']
    });
  }
  return loaderInstance;
};

export const loadGoogleMaps = async () => {
  if (isLoaded) {
    return window.google;
  }
  
  const loader = getGoogleMapsLoader();
  await loader.load();
  isLoaded = true;
  return window.google;
};

export const isGoogleMapsLoaded = () => isLoaded;