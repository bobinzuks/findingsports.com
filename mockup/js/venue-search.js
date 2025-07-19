// Venue search and request functionality

class VenueSearch {
  constructor() {
    this.searchTimeout = null;
    this.selectedVenue = null;
    this.isCustomVenue = false;
  }

  // Initialize venue search in a select element
  initializeSelect(selectElement) {
    // Add search functionality to select
    const wrapper = document.createElement('div');
    wrapper.className = 'venue-search-wrapper';
    selectElement.parentNode.insertBefore(wrapper, selectElement);
    wrapper.appendChild(selectElement);

    // Add "Other/Not Listed" option
    const otherOption = document.createElement('option');
    otherOption.value = 'other';
    otherOption.textContent = '🔍 Other venue (search or add new)';
    selectElement.appendChild(otherOption);

    // Create search input (hidden initially)
    const searchContainer = document.createElement('div');
    searchContainer.className = 'venue-search-container';
    searchContainer.style.display = 'none';
    searchContainer.innerHTML = `
            <input type="text" 
                   class="venue-search-input" 
                   placeholder="Search for a venue or enter new one..."
                   autocomplete="off">
            <div class="venue-search-results"></div>
            <div class="venue-not-found" style="display: none;">
                <p>Venue not found. Would you like to request it?</p>
                <div class="venue-request-form">
                    <input type="text" class="venue-address" placeholder="Full address">
                    <textarea class="venue-info" placeholder="Additional info (optional)"></textarea>
                    <button class="venue-request-btn">Request Venue</button>
                    <p class="venue-request-note">We'll research and add it within 24 hours</p>
                </div>
            </div>
        `;
    wrapper.appendChild(searchContainer);

    // Handle select change
    selectElement.addEventListener('change', e => {
      if (e.target.value === 'other') {
        searchContainer.style.display = 'block';
        searchContainer.querySelector('.venue-search-input').focus();
        this.isCustomVenue = true;
      } else {
        searchContainer.style.display = 'none';
        this.isCustomVenue = false;
        this.selectedVenue = {
          name: e.target.options[e.target.selectedIndex].text,
          id: e.target.value
        };
      }
    });

    // Handle search input
    const searchInput = searchContainer.querySelector('.venue-search-input');
    searchInput.addEventListener('input', e => {
      this.handleSearch(e.target.value, searchContainer);
    });

    // Handle request button
    const requestBtn = searchContainer.querySelector('.venue-request-btn');
    requestBtn.addEventListener('click', () => {
      this.handleVenueRequest(searchContainer, selectElement);
    });
  }

  // Handle venue search
  async handleSearch(query, container) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    const resultsDiv = container.querySelector('.venue-search-results');
    const notFoundDiv = container.querySelector('.venue-not-found');

    if (query.length < 2) {
      resultsDiv.innerHTML = '';
      resultsDiv.style.display = 'none';
      notFoundDiv.style.display = 'none';
      return;
    }

    // Show loading state
    resultsDiv.innerHTML = '<div class="venue-search-loading">Searching...</div>';
    resultsDiv.style.display = 'block';

    this.searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/venue-requests/search/${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.venues && data.venues.length > 0) {
          this.displaySearchResults(data.venues, resultsDiv, container);
          notFoundDiv.style.display = 'none';
        } else {
          resultsDiv.innerHTML = '';
          resultsDiv.style.display = 'none';
          notFoundDiv.style.display = 'block';
          // Pre-fill venue name
          container.querySelector('.venue-request-form input[type="text"]').value = query;
        }
      } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = '<div class="venue-search-error">Search failed</div>';
      }
    }, 300); // Debounce 300ms
  }

  // Display search results
  displaySearchResults(venues, resultsDiv, container) {
    resultsDiv.innerHTML = venues
      .map(
        venue => `
            <div class="venue-search-result" data-venue-id="${venue.id}">
                <div class="venue-name">${venue.name}</div>
                <div class="venue-address">${venue.address || ''}</div>
                ${venue.features ? `<div class="venue-features">${venue.features.join(', ')}</div>` : ''}
            </div>
        `
      )
      .join('');

    // Handle result click
    resultsDiv.querySelectorAll('.venue-search-result').forEach(result => {
      result.addEventListener('click', () => {
        const { venueId } = result.dataset;
        const venueName = result.querySelector('.venue-name').textContent;
        const venueAddress = result.querySelector('.venue-address').textContent;

        this.selectedVenue = {
          id: venueId,
          name: venueName,
          address: venueAddress
        };

        // Update search input
        container.querySelector('.venue-search-input').value = venueName;
        resultsDiv.style.display = 'none';
      });
    });

    resultsDiv.style.display = 'block';
  }

  // Handle venue request
  async handleVenueRequest(container, selectElement) {
    const venueName = container.querySelector('.venue-search-input').value;
    const address = container.querySelector('.venue-address').value;
    const additionalInfo = container.querySelector('.venue-info').value;
    const sport = document.getElementById('sportSelect')?.value || 'various';

    if (!venueName || !address) {
      alert('Please provide venue name and address');
      return;
    }

    // Check if user is logged in
    if (!window.api || !localStorage.getItem('authToken')) {
      alert('Please sign in to request a new venue');
      window.location.href = '/login-google.html';
      return;
    }

    try {
      const response = await fetch('/api/venue-requests/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          venueName,
          address,
          sport,
          additionalInfo
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        container.innerHTML = `
                    <div class="venue-request-success">
                        <h4>✅ Venue Request Submitted!</h4>
                        <p>${data.request.message}</p>
                        <p>Request ID: ${data.request.id}</p>
                        <button onclick="location.reload()">Continue</button>
                    </div>
                `;

        // Store as pending venue
        this.selectedVenue = {
          name: venueName,
          address,
          isPending: true,
          requestId: data.request.id
        };
      } else {
        alert(`Failed to submit venue request: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Request error:', error);
      alert('Failed to submit venue request');
    }
  }

  // Get selected venue data
  getSelectedVenue() {
    return this.selectedVenue;
  }

  // Check if custom venue is selected
  isCustom() {
    return this.isCustomVenue;
  }
}

// Create global instance
window.venueSearch = new VenueSearch();
