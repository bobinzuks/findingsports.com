// Enhanced Location Auto-Detection Service
// Works globally, not just in Vancouver/BC

(function() {
  'use strict';

  console.log('Location Auto-Detection Loading...');

  // Store original location service
  const originalLocationService = window.locationService;

  // Enhanced location service with global support
  class GlobalLocationService {
    constructor() {
      this.userLocation = null;
      this.currentCity = null;
      this.locationName = null;
      this.detectionAttempted = false;
      this.permissionStatus = null;
    }

    // Auto-detect user's location using browser geolocation
    async detectUserLocation() {
      console.log('Attempting to auto-detect user location...');

      if (!navigator.geolocation) {
        console.error('Geolocation not supported by browser');
        this.showLocationPrompt('Geolocation is not supported by your browser.');
        return false;
      }

      return new Promise((resolve) => {
        // Check permission status first
        if (navigator.permissions && navigator.permissions.query) {
          navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            this.permissionStatus = result.state;
            console.log('Geolocation permission status:', result.state);

            if (result.state === 'denied') {
              this.showLocationPrompt('Location access was denied. Please enable it in your browser settings.');
              resolve(false);
              return;
            }
          });
        }

        // Options for high accuracy
        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        };

        // Success callback
        const success = (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          console.log(`Location detected: ${lat}, ${lng}`);

          this.userLocation = [lat, lng];
          this.currentCity = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

          // Try to get city name via reverse geocoding
          this.reverseGeocode(lat, lng);

          // Update any existing location displays
          this.updateLocationDisplays();

          // Store in localStorage for next visit
          localStorage.setItem('userLocation', JSON.stringify({
            lat: lat,
            lng: lng,
            timestamp: Date.now()
          }));

          resolve(true);
        };

        // Error callback
        const error = (err) => {
          console.error('Geolocation error:', err);

          let message = 'Unable to detect your location. ';
          switch (err.code) {
          case err.PERMISSION_DENIED:
            message += 'Please allow location access when prompted.';
            break;
          case err.POSITION_UNAVAILABLE:
            message += 'Location information is unavailable.';
            break;
          case err.TIMEOUT:
            message += 'Location request timed out.';
            break;
          default:
            message += 'An unknown error occurred.';
          }

          this.showLocationPrompt(message);
          resolve(false);
        };

        // Request location
        navigator.geolocation.getCurrentPosition(success, error, options);
      });
    }

    // Reverse geocode to get city name
    async reverseGeocode(lat, lng) {
      try {
        // Using OpenStreetMap's Nominatim API (free, no API key required)
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
        const data = await response.json();

        if (data && data.address) {
          const city = data.address.city || data.address.town || data.address.village || data.address.municipality;
          const state = data.address.state || data.address.province;
          const country = data.address.country;

          this.locationName = city ? `${city}, ${state || country}` : `${state || country}`;
          console.log('Location name:', this.locationName);

          // Update displays with city name
          this.updateLocationDisplays();
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        // Fall back to coordinates
        this.locationName = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
      }
    }

    // Show location permission prompt
    showLocationPrompt(message) {
      // Remove any existing prompt
      const existingPrompt = document.getElementById('locationPrompt');
      if (existingPrompt) {
        existingPrompt.remove();
      }

      const prompt = document.createElement('div');
      prompt.id = 'locationPrompt';
      prompt.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #fff;
                border: 2px solid #ff6b35;
                border-radius: 8px;
                padding: 15px 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 15px;
                max-width: 90%;
                width: 500px;
            `;

      prompt.innerHTML = `
                <div style="flex: 1;">
                    <strong style="display: block; margin-bottom: 5px;">📍 Enable Location Services</strong>
                    <span style="font-size: 14px; color: #666;">${message}</span>
                </div>
                <button onclick="window.globalLocationService.detectUserLocation()" style="
                    background: #ff6b35;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                ">Enable GPS</button>
                <button onclick="document.getElementById('locationPrompt').remove()" style="
                    background: #ccc;
                    color: #333;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Cancel</button>
            `;

      document.body.appendChild(prompt);

      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (document.getElementById('locationPrompt')) {
          prompt.remove();
        }
      }, 10000);
    }

    // Update location displays on the page
    updateLocationDisplays() {
      // Update custom location text if it exists
      const customLocationText = document.getElementById('customLocationText');
      if (customLocationText && this.locationName) {
        customLocationText.textContent = this.locationName;
      }

      // Update any location badges
      const locationBadges = document.querySelectorAll('.location-badge, .current-location');
      locationBadges.forEach(badge => {
        if (this.locationName) {
          badge.textContent = `📍 ${this.locationName}`;
        }
      });

      console.log('Location displays updated');
    }

    // Get location for API calls
    getLocation() {
      return this.userLocation || null;
    }

    // Check if we have a stored location
    checkStoredLocation() {
      const stored = localStorage.getItem('userLocation');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          // Use stored location if less than 24 hours old
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            this.userLocation = [data.lat, data.lng];
            this.reverseGeocode(data.lat, data.lng);
            return true;
          }
        } catch (e) {
          console.error('Error parsing stored location:', e);
        }
      }
      return false;
    }
  }

  // Create global instance
  window.globalLocationService = new GlobalLocationService();

  // Override window.locationService if it exists
  if (window.locationService) {
    // Copy any existing properties
    Object.keys(window.locationService).forEach(key => {
      if (window.globalLocationService[key] === undefined) {
        window.globalLocationService[key] = window.locationService[key];
      }
    });
    window.locationService = window.globalLocationService;
  } else {
    window.locationService = window.globalLocationService;
  }

  // Auto-detect on page load
  window.addEventListener('DOMContentLoaded', async () => {
    console.log('Checking for location on page load...');

    // Check for stored location first
    if (!window.globalLocationService.checkStoredLocation()) {
      // Wait a bit for page to settle, then attempt detection
      setTimeout(() => {
        if (!window.globalLocationService.detectionAttempted) {
          window.globalLocationService.detectionAttempted = true;
          window.globalLocationService.detectUserLocation();
        }
      }, 2000);
    }
  });

  // Override Play Now to use detected location
  const originalPlayNow = window.playNow;
  window.playNow = function() {
    console.log('Play Now with auto-detected location');

    // If no location detected yet, detect it first
    if (!window.globalLocationService.userLocation) {
      window.globalLocationService.detectUserLocation().then((success) => {
        if (success && originalPlayNow) {
          originalPlayNow();
        } else {
          // Show manual location selection
          alert('Please enable location services or select your location manually.');
        }
      });
    } else if (originalPlayNow) {
      originalPlayNow();
    }
  };

  // Update location when user clicks on custom location
  const originalOpenCustomLocation = window.openCustomLocationModal;
  window.openCustomLocationModal = function() {
    // First try to detect current location
    window.globalLocationService.detectUserLocation().then(() => {
      if (originalOpenCustomLocation) {
        originalOpenCustomLocation();
      }
    });
  };

  console.log('Location Auto-Detection Ready - will detect your location globally!');
})();
