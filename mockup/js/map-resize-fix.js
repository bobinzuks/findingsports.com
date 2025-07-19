// Map Container Resize Fix
// Prevents continuous resizing of the map container

(function() {
  'use strict';

  console.log('Map Resize Fix Loading...');

  // Disable all CSS animations temporarily during map load
  function disableAnimations() {
    const style = document.createElement('style');
    style.id = 'map-resize-fix-style';
    style.textContent = `
            * {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }
        `;
    document.head.appendChild(style);
  }

  // Re-enable animations after map is stable
  function enableAnimations() {
    const style = document.getElementById('map-resize-fix-style');
    if (style) {
      style.remove();
    }
  }

  // Fix resize observer loops
  function fixResizeObserverLoop() {
    const originalResizeObserver = window.ResizeObserver;

    window.ResizeObserver = class extends originalResizeObserver {
      constructor(callback) {
        super((entries, observer) => {
          // Debounce resize observations for map containers
          const mapEntries = entries.filter(entry => {
            const target = entry.target;
            return target.id === 'map' ||
                               target.id === 'playNowMap' ||
                               target.classList.contains('map-container') ||
                               target.classList.contains('gm-style');
          });

          if (mapEntries.length > 0) {
            // Throttle map resize callbacks
            if (!this._resizeTimeout) {
              this._resizeTimeout = setTimeout(() => {
                callback(mapEntries, observer);
                this._resizeTimeout = null;
              }, 100);
            }

            // Process non-map entries immediately
            const otherEntries = entries.filter(entry => !mapEntries.includes(entry));
            if (otherEntries.length > 0) {
              callback(otherEntries, observer);
            }
          } else {
            callback(entries, observer);
          }
        });
      }
    };
  }

  // Stabilize map containers
  function stabilizeMapContainers() {
    const mapContainers = document.querySelectorAll('#map, #playNowMap, .map-container');

    mapContainers.forEach(container => {
      // Lock dimensions
      const rect = container.getBoundingClientRect();
      if (rect.height > 0) {
        container.style.height = `${rect.height}px`;
        container.style.minHeight = `${rect.height}px`;
        container.style.maxHeight = `${rect.height}px`;
      }

      // Disable problematic CSS properties
      container.style.contain = 'layout size';
      container.style.willChange = 'auto';

      // Prevent parent flex/grid from affecting size
      if (container.parentElement) {
        container.parentElement.style.display = 'block';
      }
    });
  }

  // Monitor and fix any dimension changes
  function monitorMapDimensions() {
    const maps = document.querySelectorAll('#map, #playNowMap');

    maps.forEach(map => {
      let lastHeight = map.offsetHeight;
      let lastWidth = map.offsetWidth;
      let stabilityCount = 0;

      const checkInterval = setInterval(() => {
        const currentHeight = map.offsetHeight;
        const currentWidth = map.offsetWidth;

        // If dimensions changed unexpectedly
        if (Math.abs(currentHeight - lastHeight) > 2 || Math.abs(currentWidth - lastWidth) > 2) {
          console.log('Map dimension change detected, stabilizing...');

          // Force stable dimensions
          map.style.height = `${lastHeight}px`;
          map.style.width = `${lastWidth}px`;

          stabilityCount = 0;
        } else {
          stabilityCount++;

          // If stable for 10 checks, stop monitoring
          if (stabilityCount > 10) {
            clearInterval(checkInterval);
            console.log('Map dimensions stable');
          }
        }

        lastHeight = currentHeight;
        lastWidth = currentWidth;
      }, 100);

      // Stop monitoring after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
    });
  }

  // Apply fixes when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixes);
  } else {
    applyFixes();
  }

  function applyFixes() {
    console.log('Applying map resize fixes...');

    // Disable animations during initial load
    disableAnimations();

    // Fix resize observer
    fixResizeObserverLoop();

    // Stabilize containers after a short delay
    setTimeout(() => {
      stabilizeMapContainers();
      monitorMapDimensions();

      // Re-enable animations after stabilization
      setTimeout(enableAnimations, 2000);
    }, 500);

    // Also apply fixes when maps are initialized
    const originalInitMap = window.initializeGoogleMap;
    window.initializeGoogleMap = function() {
      const result = originalInitMap && originalInitMap.apply(this, arguments);
      setTimeout(() => {
        stabilizeMapContainers();
        monitorMapDimensions();
      }, 1000);
      return result;
    };

    const originalInitPlayNow = window.initializePlayNowMap;
    window.initializePlayNowMap = function() {
      const result = originalInitPlayNow && originalInitPlayNow.apply(this, arguments);
      setTimeout(() => {
        stabilizeMapContainers();
        monitorMapDimensions();
      }, 1000);
      return result;
    };
  }

  // Emergency fallback - if still resizing after 5 seconds, force fix
  setTimeout(() => {
    const maps = document.querySelectorAll('#map, #playNowMap');
    maps.forEach(map => {
      if (map.offsetHeight !== 400 && map.offsetHeight !== 300) {
        console.log('Emergency map fix applied');
        map.style.cssText = 'height: 400px !important; min-height: 400px !important; max-height: 400px !important; width: 100% !important;';
      }
    });
  }, 5000);

  console.log('Map Resize Fix Applied');
})();
