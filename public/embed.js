(function() {
  // Create iframe element
  const iframe = document.createElement('iframe');
  iframe.src = window.location.origin;
  iframe.width = '100%';
  iframe.height = '900px';
  iframe.frameBorder = '0';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '10px';
  iframe.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
  
  // Find the target element and insert the iframe
  const targetElement = document.getElementById('lawn-quote-widget');
  if (targetElement) {
    targetElement.appendChild(iframe);
  }
})();