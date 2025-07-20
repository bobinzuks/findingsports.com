// Quick Setup Wizard for First-Time Users
window.QuickSetupWizard = {
  currentStep: 0,
  preferences: {
    location: null,
    sports: [],
    skillLevel: null,
    availability: [],
    notifications: true
  },
  
  // Wizard steps
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Finding Sports! 🎉',
      content: `
        <div class="wizard-welcome">
          <p>Let's get you set up in just 2 minutes!</p>
          <p>We'll help you:</p>
          <ul>
            <li>Find games in your area</li>
            <li>Connect with local players</li>
            <li>Join the right channels</li>
          </ul>
        </div>
      `,
      action: null
    },
    {
      id: 'location',
      title: 'Where do you play? 📍',
      content: `
        <div class="wizard-location">
          <p>Select your primary location:</p>
          <div class="location-options">
            <button class="location-btn" data-location="vancouver">
              <span class="location-icon">🏙️</span>
              <span class="location-name">Vancouver</span>
            </button>
            <button class="location-btn" data-location="burnaby">
              <span class="location-icon">🌳</span>
              <span class="location-name">Burnaby</span>
            </button>
            <button class="location-btn" data-location="richmond">
              <span class="location-icon">🌊</span>
              <span class="location-name">Richmond</span>
            </button>
            <button class="location-btn" data-location="surrey">
              <span class="location-icon">🏘️</span>
              <span class="location-name">Surrey</span>
            </button>
          </div>
          <div class="auto-detect">
            <button class="auto-detect-btn" onclick="window.QuickSetupWizard.autoDetectLocation()">
              📍 Auto-detect my location
            </button>
          </div>
        </div>
      `,
      action: 'selectLocation'
    },
    {
      id: 'sports',
      title: 'What sports do you play? 🏀',
      content: `
        <div class="wizard-sports">
          <p>Select all that apply:</p>
          <div class="sports-grid">
            <label class="sport-option">
              <input type="checkbox" value="basketball">
              <span class="sport-card">
                <span class="sport-emoji">🏀</span>
                <span class="sport-name">Basketball</span>
              </span>
            </label>
            <label class="sport-option">
              <input type="checkbox" value="soccer">
              <span class="sport-card">
                <span class="sport-emoji">⚽</span>
                <span class="sport-name">Soccer</span>
              </span>
            </label>
            <label class="sport-option">
              <input type="checkbox" value="volleyball">
              <span class="sport-card">
                <span class="sport-emoji">🏐</span>
                <span class="sport-name">Volleyball</span>
              </span>
            </label>
            <label class="sport-option">
              <input type="checkbox" value="tennis">
              <span class="sport-card">
                <span class="sport-emoji">🎾</span>
                <span class="sport-name">Tennis</span>
              </span>
            </label>
            <label class="sport-option">
              <input type="checkbox" value="hockey">
              <span class="sport-card">
                <span class="sport-emoji">🏒</span>
                <span class="sport-name">Hockey</span>
              </span>
            </label>
            <label class="sport-option">
              <input type="checkbox" value="other">
              <span class="sport-card">
                <span class="sport-emoji">🏃</span>
                <span class="sport-name">Other</span>
              </span>
            </label>
          </div>
        </div>
      `,
      action: 'selectSports',
      validation: 'requireSports'
    },
    {
      id: 'availability',
      title: 'When do you usually play? ⏰',
      content: `
        <div class="wizard-availability">
          <p>Select your typical availability:</p>
          <div class="availability-grid">
            <label class="time-option">
              <input type="checkbox" value="weekday-morning">
              <span class="time-card">
                <span class="time-icon">🌅</span>
                <span class="time-name">Weekday Mornings</span>
              </span>
            </label>
            <label class="time-option">
              <input type="checkbox" value="weekday-evening">
              <span class="time-card">
                <span class="time-icon">🌆</span>
                <span class="time-name">Weekday Evenings</span>
              </span>
            </label>
            <label class="time-option">
              <input type="checkbox" value="weekend-morning">
              <span class="time-card">
                <span class="time-icon">☀️</span>
                <span class="time-name">Weekend Mornings</span>
              </span>
            </label>
            <label class="time-option">
              <input type="checkbox" value="weekend-afternoon">
              <span class="time-card">
                <span class="time-icon">🌤️</span>
                <span class="time-name">Weekend Afternoons</span>
              </span>
            </label>
          </div>
        </div>
      `,
      action: 'selectAvailability'
    },
    {
      id: 'complete',
      title: 'All set! 🎊',
      content: `
        <div class="wizard-complete">
          <div class="summary">
            <h4>Your Preferences:</h4>
            <div id="wizardSummary"></div>
          </div>
          <p>Based on your preferences, we'll:</p>
          <ul>
            <li>Show you relevant games</li>
            <li>Connect you with local players</li>
            <li>Join the right channels</li>
          </ul>
          <div class="notifications-opt">
            <label>
              <input type="checkbox" id="notificationsCheck" checked>
              <span>Send me notifications about new games</span>
            </label>
          </div>
        </div>
      `,
      action: 'complete'
    }
  ],
  
  // Show the wizard
  show() {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'quickSetupWizard';
    modal.className = 'setup-wizard-modal';
    modal.innerHTML = `
      <div class="wizard-overlay"></div>
      <div class="wizard-container">
        <div class="wizard-header">
          <div class="wizard-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 0%"></div>
            </div>
          </div>
          <button class="wizard-close" onclick="window.QuickSetupWizard.close()">×</button>
        </div>
        <div class="wizard-content" id="wizardContent">
          <!-- Content will be injected here -->
        </div>
        <div class="wizard-footer">
          <button class="wizard-btn secondary" id="wizardBack" onclick="window.QuickSetupWizard.previousStep()">
            Back
          </button>
          <button class="wizard-btn primary" id="wizardNext" onclick="window.QuickSetupWizard.nextStep()">
            Next
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Start at first step
    this.currentStep = 0;
    this.showStep(0);
    
    // Add styles if not already added
    this.addStyles();
  },
  
  // Show specific step
  showStep(index) {
    const step = this.steps[index];
    if (!step) return;
    
    const content = document.getElementById('wizardContent');
    const backBtn = document.getElementById('wizardBack');
    const nextBtn = document.getElementById('wizardNext');
    const progressBar = document.querySelector('.progress-fill');
    
    // Update content
    content.innerHTML = `
      <h2 class="wizard-title">${step.title}</h2>
      ${step.content}
    `;
    
    // Update buttons
    backBtn.style.display = index === 0 ? 'none' : 'block';
    nextBtn.textContent = index === this.steps.length - 1 ? 'Get Started!' : 'Next';
    
    // Update progress
    const progress = ((index + 1) / this.steps.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Apply any step-specific actions
    if (step.action) {
      this.applyStepAction(step.action);
    }
    
    // Update summary for final step
    if (step.id === 'complete') {
      this.updateSummary();
    }
  },
  
  // Apply step-specific actions
  applyStepAction(action) {
    switch (action) {
      case 'selectLocation':
        // Add click handlers to location buttons
        document.querySelectorAll('.location-btn').forEach(btn => {
          btn.onclick = () => {
            document.querySelectorAll('.location-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            this.preferences.location = btn.dataset.location;
          };
        });
        break;
        
      case 'selectSports':
        // Handle sport selection
        document.querySelectorAll('.sport-option input').forEach(input => {
          input.onchange = () => {
            this.preferences.sports = Array.from(
              document.querySelectorAll('.sport-option input:checked')
            ).map(i => i.value);
          };
        });
        break;
        
      case 'selectAvailability':
        // Handle availability selection
        document.querySelectorAll('.time-option input').forEach(input => {
          input.onchange = () => {
            this.preferences.availability = Array.from(
              document.querySelectorAll('.time-option input:checked')
            ).map(i => i.value);
          };
        });
        break;
    }
  },
  
  // Auto-detect location
  async autoDetectLocation() {
    const btn = document.querySelector('.auto-detect-btn');
    btn.textContent = '📍 Detecting...';
    btn.disabled = true;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simple location mapping
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          let detectedLocation = 'vancouver'; // Default
          
          // Rough boundaries for each area
          if (lat >= 49.2 && lat <= 49.3 && lng >= -123.2 && lng <= -123.0) {
            detectedLocation = 'vancouver';
          } else if (lat >= 49.2 && lat <= 49.3 && lng >= -123.0 && lng <= -122.9) {
            detectedLocation = 'burnaby';
          } else if (lat >= 49.1 && lat <= 49.2 && lng >= -123.2 && lng <= -123.0) {
            detectedLocation = 'richmond';
          } else if (lat >= 49.0 && lat <= 49.2 && lng >= -122.9 && lng <= -122.7) {
            detectedLocation = 'surrey';
          }
          
          // Select the detected location
          const locationBtn = document.querySelector(`[data-location="${detectedLocation}"]`);
          if (locationBtn) {
            locationBtn.click();
            btn.textContent = '✅ Location detected!';
          }
        },
        (error) => {
          btn.textContent = '❌ Detection failed, please select manually';
          btn.disabled = false;
        }
      );
    } else {
      btn.textContent = '❌ Location not supported';
      btn.disabled = false;
    }
  },
  
  // Validate current step
  validateStep() {
    const step = this.steps[this.currentStep];
    
    if (step.validation === 'requireSports' && this.preferences.sports.length === 0) {
      this.showError('Please select at least one sport');
      return false;
    }
    
    return true;
  },
  
  // Show error message
  showError(message) {
    const error = document.createElement('div');
    error.className = 'wizard-error';
    error.textContent = message;
    
    const content = document.getElementById('wizardContent');
    content.appendChild(error);
    
    setTimeout(() => error.remove(), 3000);
  },
  
  // Go to next step
  nextStep() {
    if (!this.validateStep()) return;
    
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.showStep(this.currentStep);
    } else {
      this.complete();
    }
  },
  
  // Go to previous step
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  },
  
  // Update summary
  updateSummary() {
    const summary = document.getElementById('wizardSummary');
    if (!summary) return;
    
    summary.innerHTML = `
      <div class="summary-item">
        <strong>Location:</strong> ${this.preferences.location || 'Not selected'}
      </div>
      <div class="summary-item">
        <strong>Sports:</strong> ${this.preferences.sports.join(', ') || 'None selected'}
      </div>
      <div class="summary-item">
        <strong>Availability:</strong> ${this.formatAvailability()}
      </div>
    `;
  },
  
  // Format availability
  formatAvailability() {
    const labels = {
      'weekday-morning': 'Weekday mornings',
      'weekday-evening': 'Weekday evenings',
      'weekend-morning': 'Weekend mornings',
      'weekend-afternoon': 'Weekend afternoons'
    };
    
    return this.preferences.availability
      .map(a => labels[a])
      .join(', ') || 'Not specified';
  },
  
  // Complete wizard
  complete() {
    // Save preferences
    this.preferences.notifications = document.getElementById('notificationsCheck')?.checked;
    
    // Store in localStorage
    localStorage.setItem('userLocation', this.preferences.location || 'vancouver');
    localStorage.setItem('preferredSports', JSON.stringify(this.preferences.sports));
    localStorage.setItem('userAvailability', JSON.stringify(this.preferences.availability));
    localStorage.setItem('notificationsEnabled', this.preferences.notifications);
    localStorage.setItem('setupCompleted', 'true');
    
    // Update social feed preferences if available
    if (window.SocialFeedPage) {
      window.SocialFeedPage.userLocation = this.preferences.location;
      if (this.preferences.sports.length > 0) {
        window.SocialFeedPage.userSport = this.preferences.sports[0];
        localStorage.setItem('preferredSport', this.preferences.sports[0]);
      }
    }
    
    // Close wizard
    this.close();
    
    // Show success message
    this.showSuccess();
    
    // Trigger any post-setup actions
    if (window.SocialFeedPage && this.preferences.sports.length > 0) {
      // Switch to sport-specific channel
      window.SocialFeedPage.switchChannel(this.preferences.sports[0]);
    }
  },
  
  // Close wizard
  close() {
    const wizard = document.getElementById('quickSetupWizard');
    if (wizard) {
      wizard.classList.add('closing');
      setTimeout(() => wizard.remove(), 300);
    }
  },
  
  // Show success message
  showSuccess() {
    const toast = document.createElement('div');
    toast.className = 'setup-success-toast';
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">✅</span>
        <div class="toast-text">
          <strong>Setup Complete!</strong>
          <p>You're ready to find games and connect with players!</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  },
  
  // Check if should show wizard
  shouldShow() {
    return !localStorage.getItem('setupCompleted') && 
           !localStorage.getItem('userLocation');
  },
  
  // Add styles
  addStyles() {
    if (document.getElementById('quickSetupWizardStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'quickSetupWizardStyles';
    style.textContent = `
      .setup-wizard-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .wizard-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
      }
      
      .wizard-container {
        position: relative;
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease-out;
      }
      
      .wizard-header {
        padding: 20px 20px 0;
        position: relative;
      }
      
      .wizard-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 4px 8px;
      }
      
      .wizard-close:hover {
        color: #333;
      }
      
      .wizard-progress {
        margin-bottom: 20px;
      }
      
      .wizard-content {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
      }
      
      .wizard-title {
        margin: 0 0 20px 0;
        text-align: center;
        color: #333;
      }
      
      .wizard-welcome ul {
        list-style: none;
        padding: 0;
        margin: 20px 0;
      }
      
      .wizard-welcome li {
        padding: 8px 0;
        padding-left: 24px;
        position: relative;
      }
      
      .wizard-welcome li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #4CAF50;
        font-weight: bold;
      }
      
      .location-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin: 20px 0;
      }
      
      .location-btn {
        padding: 20px;
        background: #f8f8f8;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      
      .location-btn:hover {
        border-color: #ff6b35;
        transform: translateY(-2px);
      }
      
      .location-btn.selected {
        background: #fff5f1;
        border-color: #ff6b35;
      }
      
      .location-icon {
        font-size: 32px;
      }
      
      .location-name {
        font-weight: 600;
        color: #333;
      }
      
      .auto-detect {
        text-align: center;
        margin-top: 20px;
      }
      
      .auto-detect-btn {
        padding: 10px 20px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .auto-detect-btn:hover:not(:disabled) {
        background: #2980b9;
      }
      
      .auto-detect-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .sports-grid,
      .availability-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin: 20px 0;
      }
      
      .sport-option,
      .time-option {
        display: block;
        cursor: pointer;
      }
      
      .sport-option input,
      .time-option input {
        display: none;
      }
      
      .sport-card,
      .time-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 20px;
        background: #f8f8f8;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        transition: all 0.2s;
      }
      
      .sport-option input:checked + .sport-card,
      .time-option input:checked + .time-card {
        background: #fff5f1;
        border-color: #ff6b35;
      }
      
      .sport-card:hover,
      .time-card:hover {
        border-color: #ff6b35;
        transform: translateY(-2px);
      }
      
      .sport-emoji,
      .time-icon {
        font-size: 32px;
      }
      
      .sport-name,
      .time-name {
        font-weight: 600;
        color: #333;
        text-align: center;
        font-size: 14px;
      }
      
      .wizard-complete {
        text-align: center;
      }
      
      .summary {
        background: #f8f8f8;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        text-align: left;
      }
      
      .summary h4 {
        margin: 0 0 12px 0;
        color: #333;
      }
      
      .summary-item {
        padding: 8px 0;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .summary-item:last-child {
        border-bottom: none;
      }
      
      .notifications-opt {
        margin: 20px 0;
        padding: 16px;
        background: #f0f8ff;
        border-radius: 8px;
      }
      
      .notifications-opt label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }
      
      .wizard-footer {
        padding: 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      
      .wizard-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .wizard-btn.primary {
        background: #ff6b35;
        color: white;
      }
      
      .wizard-btn.primary:hover {
        background: #e55a2b;
        transform: translateY(-1px);
      }
      
      .wizard-btn.secondary {
        background: #f0f0f0;
        color: #666;
      }
      
      .wizard-btn.secondary:hover {
        background: #e0e0e0;
      }
      
      .wizard-error {
        margin-top: 12px;
        padding: 12px;
        background: #ffebee;
        color: #c62828;
        border-radius: 6px;
        text-align: center;
        animation: shake 0.3s;
      }
      
      .setup-success-toast {
        position: fixed;
        bottom: -100px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        padding: 20px;
        z-index: 10002;
        transition: bottom 0.3s ease-out;
      }
      
      .setup-success-toast.show {
        bottom: 20px;
      }
      
      .toast-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .toast-icon {
        font-size: 32px;
      }
      
      .toast-text strong {
        display: block;
        margin-bottom: 4px;
      }
      
      .toast-text p {
        margin: 0;
        color: #666;
      }
      
      .closing {
        animation: slideDown 0.3s ease-out;
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideDown {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(20px);
          opacity: 0;
        }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      @media (max-width: 600px) {
        .location-options {
          grid-template-columns: 1fr;
        }
        
        .sports-grid,
        .availability-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;
    
    document.head.appendChild(style);
  }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if should show wizard
  if (window.QuickSetupWizard.shouldShow()) {
    // Delay slightly to let page settle
    setTimeout(() => {
      window.QuickSetupWizard.show();
    }, 1000);
  }
});