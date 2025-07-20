// Social Feed Module - Lazy loaded for code splitting
export default {
  // Advanced features loaded on demand
  
  // Emoji picker functionality
  emojiPicker: {
    categories: ['smileys', 'sports', 'objects', 'symbols'],
    emojis: {
      smileys: ['😊', '😄', '😎', '🤔', '😅', '😂', '🙃', '😉'],
      sports: ['🏀', '⚽', '🏐', '🎾', '🏒', '🏃', '💪', '🏆'],
      objects: ['🔥', '⭐', '💯', '👍', '👏', '🎉', '🎯', '⏰'],
      symbols: ['❤️', '💙', '💚', '💛', '💜', '🖤', '🤍', '💔']
    },
    
    create() {
      const picker = document.createElement('div');
      picker.className = 'emoji-picker-enhanced';
      picker.innerHTML = `
        <div class="emoji-picker-header">
          ${this.categories.map(cat => 
            `<button class="emoji-category-btn" data-category="${cat}">${cat}</button>`
          ).join('')}
        </div>
        <div class="emoji-picker-body">
          ${this.categories.map(cat => `
            <div class="emoji-category" data-category="${cat}">
              ${this.emojis[cat].map(emoji => 
                `<span class="emoji-option" data-emoji="${emoji}">${emoji}</span>`
              ).join('')}
            </div>
          `).join('')}
        </div>
      `;
      
      // Add event listeners
      picker.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji-option')) {
          this.handleEmojiSelect(e.target.dataset.emoji);
        } else if (e.target.classList.contains('emoji-category-btn')) {
          this.switchCategory(e.target.dataset.category);
        }
      });
      
      return picker;
    },
    
    handleEmojiSelect(emoji) {
      const event = new CustomEvent('emoji-selected', { detail: { emoji } });
      document.dispatchEvent(event);
    },
    
    switchCategory(category) {
      document.querySelectorAll('.emoji-category').forEach(cat => {
        cat.style.display = cat.dataset.category === category ? 'grid' : 'none';
      });
      document.querySelectorAll('.emoji-category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
      });
    }
  },
  
  // Advanced marketplace features
  marketplace: {
    filters: {
      priceRange: [0, 1000],
      distance: 50, // km
      condition: ['new', 'like-new', 'good', 'fair'],
      sortBy: 'newest'
    },
    
    createAdvancedFilters() {
      const filterPanel = document.createElement('div');
      filterPanel.className = 'marketplace-advanced-filters';
      filterPanel.innerHTML = `
        <div class="filter-group">
          <label>Price Range</label>
          <input type="range" id="priceMin" min="0" max="1000" value="0">
          <input type="range" id="priceMax" min="0" max="1000" value="1000">
          <span class="price-display">$0 - $1000</span>
        </div>
        
        <div class="filter-group">
          <label>Distance</label>
          <input type="range" id="distance" min="1" max="100" value="50">
          <span class="distance-display">50 km</span>
        </div>
        
        <div class="filter-group">
          <label>Condition</label>
          <select id="condition" multiple>
            <option value="new">New</option>
            <option value="like-new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Sort By</label>
          <select id="sortBy">
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="distance">Distance: Near to Far</option>
          </select>
        </div>
      `;
      
      // Add event listeners
      filterPanel.addEventListener('change', this.handleFilterChange.bind(this));
      
      return filterPanel;
    },
    
    handleFilterChange(event) {
      const filters = {
        priceMin: document.getElementById('priceMin').value,
        priceMax: document.getElementById('priceMax').value,
        distance: document.getElementById('distance').value,
        condition: Array.from(document.getElementById('condition').selectedOptions).map(o => o.value),
        sortBy: document.getElementById('sortBy').value
      };
      
      this.applyFilters(filters);
    },
    
    applyFilters(filters) {
      // Emit filter event
      const event = new CustomEvent('marketplace-filter', { detail: filters });
      document.dispatchEvent(event);
    }
  },
  
  // Voice messages feature
  voiceMessages: {
    recorder: null,
    chunks: [],
    
    async initialize() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Voice messages not supported');
        return false;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recorder = new MediaRecorder(stream);
        
        this.recorder.ondataavailable = (e) => {
          this.chunks.push(e.data);
        };
        
        this.recorder.onstop = () => {
          const blob = new Blob(this.chunks, { type: 'audio/webm' });
          this.handleRecordingComplete(blob);
          this.chunks = [];
        };
        
        return true;
      } catch (error) {
        console.error('Failed to initialize voice recording:', error);
        return false;
      }
    },
    
    startRecording() {
      if (!this.recorder) return;
      
      this.chunks = [];
      this.recorder.start();
      
      // Show recording UI
      this.showRecordingUI();
    },
    
    stopRecording() {
      if (!this.recorder || this.recorder.state !== 'recording') return;
      
      this.recorder.stop();
      this.hideRecordingUI();
    },
    
    handleRecordingComplete(blob) {
      // Create audio URL
      const audioUrl = URL.createObjectURL(blob);
      
      // Emit event with audio data
      const event = new CustomEvent('voice-message-recorded', {
        detail: { blob, audioUrl }
      });
      document.dispatchEvent(event);
    },
    
    showRecordingUI() {
      const ui = document.createElement('div');
      ui.id = 'voice-recording-ui';
      ui.className = 'voice-recording-active';
      ui.innerHTML = `
        <div class="recording-indicator"></div>
        <span class="recording-time">0:00</span>
        <button class="stop-recording-btn">Stop</button>
      `;
      
      document.body.appendChild(ui);
      
      // Start timer
      let seconds = 0;
      this.recordingTimer = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        ui.querySelector('.recording-time').textContent = 
          `${mins}:${secs.toString().padStart(2, '0')}`;
      }, 1000);
      
      // Stop button handler
      ui.querySelector('.stop-recording-btn').addEventListener('click', () => {
        this.stopRecording();
      });
    },
    
    hideRecordingUI() {
      clearInterval(this.recordingTimer);
      const ui = document.getElementById('voice-recording-ui');
      if (ui) ui.remove();
    }
  },
  
  // File sharing feature
  fileSharing: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'application/pdf', 'text/*'],
    
    createDropZone(container) {
      const dropZone = document.createElement('div');
      dropZone.className = 'file-drop-zone';
      dropZone.innerHTML = `
        <div class="drop-zone-content">
          <svg class="drop-icon" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <p>Drop files here or click to browse</p>
          <input type="file" multiple accept="${this.allowedTypes.join(',')}" style="display: none;">
        </div>
      `;
      
      // Event handlers
      dropZone.addEventListener('click', () => {
        dropZone.querySelector('input').click();
      });
      
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });
      
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        this.handleFiles(e.dataTransfer.files);
      });
      
      dropZone.querySelector('input').addEventListener('change', (e) => {
        this.handleFiles(e.target.files);
      });
      
      container.appendChild(dropZone);
    },
    
    handleFiles(files) {
      const validFiles = Array.from(files).filter(file => {
        if (file.size > this.maxSize) {
          console.warn(`File ${file.name} is too large`);
          return false;
        }
        return true;
      });
      
      if (validFiles.length > 0) {
        const event = new CustomEvent('files-selected', {
          detail: { files: validFiles }
        });
        document.dispatchEvent(event);
      }
    }
  },
  
  // Notification system
  notifications: {
    permission: null,
    
    async initialize() {
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return false;
      }
      
      if (Notification.permission === 'default') {
        this.permission = await Notification.requestPermission();
      } else {
        this.permission = Notification.permission;
      }
      
      return this.permission === 'granted';
    },
    
    show(title, options = {}) {
      if (this.permission !== 'granted') return;
      
      const notification = new Notification(title, {
        icon: '/images/icon-192.png',
        badge: '/images/badge-72.png',
        vibrate: [200, 100, 200],
        ...options
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        if (options.data && options.data.url) {
          window.location.href = options.data.url;
        }
      };
      
      return notification;
    }
  },
  
  // Analytics and tracking
  analytics: {
    events: [],
    
    track(event, data = {}) {
      const trackingData = {
        event,
        data,
        timestamp: Date.now(),
        sessionId: this.getSessionId()
      };
      
      this.events.push(trackingData);
      
      // Send to analytics service
      if (this.events.length >= 10) {
        this.flush();
      }
    },
    
    flush() {
      if (this.events.length === 0) return;
      
      // Send events to analytics endpoint
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.events)
      }).catch(console.error);
      
      this.events = [];
    },
    
    getSessionId() {
      let sessionId = sessionStorage.getItem('analytics-session-id');
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics-session-id', sessionId);
      }
      return sessionId;
    }
  }
};