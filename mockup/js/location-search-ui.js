// Location search UI handler
class LocationSearchUI {
    constructor() {
        this.currentSearch = null;
        this.modal = null;
    }

    async checkUserLocation() {
        // Get user's location
        const location = await this.detectLocation();

        // Check if we have data for this location
        const response = await fetch('/api/location/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
            },
            body: JSON.stringify(location)
        });

        const data = await response.json();
        console.log('Location check response:', data);

        if (data.status === 'searching') {
            this.showSearchProgress(data);
            this.trackSearch(data.searchId);
        } else if (data.status === 'ready') {
            // Location has games, show them
            console.log(`Found ${data.games.length} games for ${location.city}`);
        }

        return data;
    }

    async detectLocation() {
        // Try HTML5 geolocation first
        if ('geolocation' in navigator) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        enableHighAccuracy: false
                    });
                });

                // Reverse geocode to get city name
                const { latitude, longitude } = position.coords;

                // For demo, use approximate city based on coords
                const city = this.getCityFromCoords(latitude, longitude);

                return {
                    lat: latitude,
                    lng: longitude,
                    ...city
                };
            } catch (error) {
                console.log('Geolocation failed:', error);
            }
        }

        // Fall back to IP-based or ask user
        return this.askUserLocation();
    }

    getCityFromCoords(lat, lng) {
        // Simple approximation for demo
        // In production, use reverse geocoding API

        // Canadian cities
        if (lat > 48 && lat < 50 && lng > -124 && lng < -122) {
            return { city: 'Vancouver', region: 'BC', country: 'CA' };
        } else if (lat > 50 && lat < 52 && lng > -115 && lng < -113) {
            return { city: 'Calgary', region: 'AB', country: 'CA' };
        } else if (lat > 42 && lat < 44 && lng > -80 && lng < -78) {
            return { city: 'Toronto', region: 'ON', country: 'CA' };
        } else if (lat > 46 && lat < 48 && lng > -123 && lng < -121) {
            // US cities
            return { city: 'Seattle', region: 'WA', country: 'US' };
        } else if (lat > 36 && lat < 38 && lng > -123 && lng < -121) {
            return { city: 'San Francisco', region: 'CA', country: 'US' };
        }

        // Default
        return { city: 'Unknown', region: 'Unknown', country: 'Unknown' };
    }

    askUserLocation() {
        // Show location prompt
        const modal = document.createElement('div');
        modal.className = 'location-prompt-modal';
        modal.innerHTML = `
            <div class="location-prompt">
                <h2>Where are you looking for sports?</h2>
                <p>Help us find drop-in games in your area</p>
                
                <div class="location-form">
                    <input type="text" id="cityInput" placeholder="City" required>
                    <input type="text" id="regionInput" placeholder="Province/State" required>
                    <select id="countryInput">
                        <option value="CA">Canada</option>
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="AU">Australia</option>
                        <option value="OTHER">Other</option>
                    </select>
                    <button onclick="locationSearchUI.submitLocation()">Search This Location</button>
                </div>
                
                <div class="popular-locations">
                    <p>Popular locations:</p>
                    <div class="location-buttons">
                        <button onclick="locationSearchUI.selectLocation('Calgary', 'AB', 'CA')">Calgary, AB</button>
                        <button onclick="locationSearchUI.selectLocation('Toronto', 'ON', 'CA')">Toronto, ON</button>
                        <button onclick="locationSearchUI.selectLocation('Montreal', 'QC', 'CA')">Montreal, QC</button>
                        <button onclick="locationSearchUI.selectLocation('Seattle', 'WA', 'US')">Seattle, WA</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        return new Promise(resolve => {
            window.locationResolve = resolve;
        });
    }

    selectLocation(city, region, country) {
        const location = { city, region, country };
        document.querySelector('.location-prompt-modal')?.remove();

        if (window.locationResolve) {
            window.locationResolve(location);
        }

        // Trigger search
        this.checkLocationWithData(location);
    }

    submitLocation() {
        const city = document.getElementById('cityInput').value;
        const region = document.getElementById('regionInput').value;
        const country = document.getElementById('countryInput').value;

        if (city && region) {
            this.selectLocation(city, region, country);
        }
    }

    async checkLocationWithData(location) {
        const response = await fetch('/api/location/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
            },
            body: JSON.stringify(location)
        });

        const data = await response.json();

        if (data.status === 'searching') {
            this.showSearchProgress(data);
            this.trackSearch(data.searchId);
        }
    }

    showSearchProgress(searchData) {
        // Remove any existing modal
        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'search-progress-modal';
        this.modal.innerHTML = `
            <div class="search-content">
                <div class="search-header">
                    <h2>Searching for Drop-in Sports</h2>
                    <h3>${searchData.location.city}, ${searchData.location.region}</h3>
                </div>
                
                <div class="ai-agents-visual">
                    <div class="agent-icon agent-1">A1</div>
                    <div class="agent-icon agent-2">A2</div>
                    <div class="agent-icon agent-3">A3</div>
                    <div class="central-hub">HUB</div>
                </div>
                
                <p class="search-message">Our AI agents are searching multiple sources for drop-in games...</p>
                
                <div class="progress-stages">
                    <div class="stage" data-stage="agents">
                        <div class="stage-header">
                            <span class="stage-icon">•</span>
                            <span class="stage-name">Deploying Agents</span>
                            <span class="stage-status">0%</span>
                        </div>
                        <div class="stage-progress-bar">
                            <div class="stage-progress-fill"></div>
                        </div>
                    </div>
                    
                    <div class="stage" data-stage="search">
                        <div class="stage-header">
                            <span class="stage-icon">•</span>
                            <span class="stage-name">Searching Sources</span>
                            <span class="stage-status">0%</span>
                        </div>
                        <div class="stage-progress-bar">
                            <div class="stage-progress-fill"></div>
                        </div>
                    </div>
                    
                    <div class="stage" data-stage="analysis">
                        <div class="stage-header">
                            <span class="stage-icon">•</span>
                            <span class="stage-name">Analyzing Results</span>
                            <span class="stage-status">0%</span>
                        </div>
                        <div class="stage-progress-bar">
                            <div class="stage-progress-fill"></div>
                        </div>
                    </div>
                    
                    <div class="stage" data-stage="validation">
                        <div class="stage-header">
                            <span class="stage-icon">•</span>
                            <span class="stage-name">Validating Drop-ins</span>
                            <span class="stage-status">0%</span>
                        </div>
                        <div class="stage-progress-bar">
                            <div class="stage-progress-fill"></div>
                        </div>
                    </div>
                    
                    <div class="stage" data-stage="storage">
                        <div class="stage-header">
                            <span class="stage-icon">•</span>
                            <span class="stage-name">Saving Results</span>
                            <span class="stage-status">0%</span>
                        </div>
                        <div class="stage-progress-bar">
                            <div class="stage-progress-fill"></div>
                        </div>
                    </div>
                </div>
                
                <div class="overall-progress">
                    <div class="overall-progress-bar">
                        <div class="overall-progress-fill" style="width: 0%"></div>
                    </div>
                    <p class="progress-text">Starting search...</p>
                </div>
                
                <div class="venues-found">
                    <h4>Venues discovered: <span class="venue-count">0</span></h4>
                    <ul class="venue-list"></ul>
                </div>
                
                <div class="search-tips">
                    <p>💡 Tip: We're looking for community centers, YMCAs, recreation complexes, 
                       and public facilities with drop-in sports.</p>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Animate agent icons
        this.animateAgents();

        // Listen for progress updates
        this.currentSearch = searchData.searchId;
        if (window.wsClient) {
            window.wsClient.on('location_search_progress', data => {
                if (data.searchId === this.currentSearch) {
                    this.updateProgress(data);
                }
            });

            window.wsClient.on('location_search_complete', data => {
                if (data.searchId === this.currentSearch) {
                    this.showSearchComplete(data);
                }
            });
        }
    }

    animateAgents() {
        const agents = this.modal.querySelectorAll('.agent-icon');
        agents.forEach((agent, index) => {
            agent.style.animationDelay = `${index * 0.2}s`;
        });
    }

    updateProgress(progressData) {
        if (!this.modal) {
            return;
        }

        // Update each stage
        Object.entries(progressData.stages).forEach(([stageName, stageData]) => {
            const stageEl = this.modal.querySelector(`[data-stage="${stageName}"]`);
            if (stageEl) {
                const progressFill = stageEl.querySelector('.stage-progress-fill');
                const statusText = stageEl.querySelector('.stage-status');

                progressFill.style.width = `${stageData.progress}%`;
                statusText.textContent = `${stageData.progress}%`;

                if (stageData.status === 'completed') {
                    stageEl.classList.add('completed');
                    statusText.textContent = '✓';
                } else if (stageData.status === 'in_progress') {
                    stageEl.classList.add('active');
                }

                // Update message if available
                if (stageData.message && stageData.message.includes('Found')) {
                    const match = stageData.message.match(/Found (\d+)/);
                    if (match) {
                        this.modal.querySelector('.venue-count').textContent = match[1];
                    }
                }
            }
        });

        // Update overall progress
        const overallFill = this.modal.querySelector('.overall-progress-fill');
        const progressText = this.modal.querySelector('.progress-text');

        overallFill.style.width = `${progressData.progress}%`;

        if (progressData.progress < 100) {
            progressText.textContent = `${Math.round(progressData.progress)}% complete...`;
        } else {
            progressText.textContent = 'Search complete! Loading results...';
        }
    }

    async trackSearch(searchId) {
        // Poll for updates if WebSocket not available
        if (!window.wsClient || !window.wsClient.connected) {
            const pollInterval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/location/search/${searchId}`);
                    const data = await response.json();

                    if (data.search) {
                        this.updateProgress({
                            progress: data.search.progress || 0,
                            stages: data.search.stages
                        });

                        if (data.search.progress >= 100) {
                            clearInterval(pollInterval);
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        }
                    }
                } catch (error) {
                    console.error('Poll error:', error);
                }
            }, 2000);
        }
    }

    showSearchComplete(data) {
        if (!this.modal) {
            return;
        }

        const content = this.modal.querySelector('.search-content');
        content.innerHTML = `
            <div class="search-complete">
                <div class="success-icon" style="font-size: 3rem; color: #4CAF50; margin-bottom: 1rem;">COMPLETE</div>
                <h2>Search Complete!</h2>
                <h3>Found ${data.gamesFound} drop-in games in ${data.location.city}</h3>
                <p>The page will refresh to show your results...</p>
                <button onclick="location.reload()">View Games</button>
            </div>
        `;

        setTimeout(() => {
            location.reload();
        }, 3000);
    }
}

// Create global instance
window.locationSearchUI = new LocationSearchUI();

// Auto-check on page load - DISABLED to prevent popup on page load
// document.addEventListener('DOMContentLoaded', () => {
//     // Only check for new locations if on main page
//     if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
//         setTimeout(() => {
//             locationSearchUI.checkUserLocation();
//         }, 1000);
//     }
// });
