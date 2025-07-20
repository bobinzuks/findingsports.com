/**
 * Microinteractions System for Finding Sports
 * Adds delightful feedback mechanisms including haptic feedback, sound effects,
 * particle effects, smooth transitions, and loading animations
 */

class MicrointeractionsSystem {
  constructor() {
    this.hapticEnabled = this.checkHapticSupport();
    this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.audioContext = null;
    this.sounds = {};
    this.particleContainer = null;
    
    this.init();
  }

  init() {
    this.createParticleContainer();
    this.initializeAudio();
    this.attachEventListeners();
    this.initializeLoadingStates();
    this.setupStateTransitions();
  }

  // Check if device supports haptic feedback
  checkHapticSupport() {
    return 'vibrate' in navigator || 'mozVibrate' in navigator || 'webkitVibrate' in navigator;
  }

  // Initialize Web Audio API for sound effects
  initializeAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Create sound presets
      this.sounds = {
        click: () => this.playTone(800, 0.05, 'sine'),
        success: () => this.playTone(1200, 0.1, 'square', true),
        error: () => this.playTone(300, 0.2, 'sawtooth'),
        notification: () => this.playTone(600, 0.15, 'triangle', true),
        swipe: () => this.playSwipeSound(),
        join: () => this.playJoinSound(),
        achievement: () => this.playAchievementSound()
      };
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }

  // Play a tone with Web Audio API
  playTone(frequency, duration, type = 'sine', ascending = false) {
    if (!this.soundEnabled || !this.audioContext || this.reducedMotion) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    if (ascending) {
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 1.5, 
        this.audioContext.currentTime + duration
      );
    }
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Special sound effects
  playSwipeSound() {
    if (!this.soundEnabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(2000, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  playJoinSound() {
    if (!this.soundEnabled || !this.audioContext) return;
    
    // Play three ascending tones
    [400, 600, 800].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.1, 'sine'), i * 50);
    });
  }

  playAchievementSound() {
    if (!this.soundEnabled || !this.audioContext) return;
    
    // Play triumphant chord
    [523.25, 659.25, 783.99, 1046.50].forEach(freq => {
      this.playTone(freq, 0.5, 'sine');
    });
  }

  // Haptic feedback patterns
  triggerHaptic(pattern = 'light') {
    if (!this.hapticEnabled || this.reducedMotion) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      double: [20, 50, 20],
      success: [10, 30, 10, 30, 10],
      error: [50, 100, 50],
      notification: [25, 50, 25, 50, 25, 50]
    };
    
    const vibrationPattern = patterns[pattern] || patterns.light;
    
    if (navigator.vibrate) {
      navigator.vibrate(vibrationPattern);
    } else if (navigator.mozVibrate) {
      navigator.mozVibrate(vibrationPattern);
    } else if (navigator.webkitVibrate) {
      navigator.webkitVibrate(vibrationPattern);
    }
  }

  // Create container for particle effects
  createParticleContainer() {
    this.particleContainer = document.createElement('div');
    this.particleContainer.className = 'particle-container';
    this.particleContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
    `;
    document.body.appendChild(this.particleContainer);
  }

  // Create particle effects
  createParticles(x, y, type = 'celebration') {
    if (this.reducedMotion) return;
    
    const configs = {
      celebration: {
        count: 30,
        colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#32CD32'],
        shapes: ['circle', 'square', 'triangle'],
        size: [4, 8],
        duration: 2000,
        spread: 100
      },
      success: {
        count: 20,
        colors: ['#32CD32', '#00FF00', '#228B22'],
        shapes: ['circle', 'star'],
        size: [3, 6],
        duration: 1500,
        spread: 80
      },
      click: {
        count: 8,
        colors: ['#007bff', '#0056b3'],
        shapes: ['circle'],
        size: [2, 4],
        duration: 800,
        spread: 40
      },
      error: {
        count: 15,
        colors: ['#dc3545', '#c82333'],
        shapes: ['x'],
        size: [4, 6],
        duration: 1000,
        spread: 60
      }
    };
    
    const config = configs[type] || configs.celebration;
    
    for (let i = 0; i < config.count; i++) {
      const particle = document.createElement('div');
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
      const size = Math.random() * (config.size[1] - config.size[0]) + config.size[0];
      const angle = (Math.PI * 2 * i) / config.count;
      const velocity = Math.random() * config.spread + config.spread / 2;
      
      particle.className = `particle particle-${shape}`;
      particle.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        pointer-events: none;
      `;
      
      if (shape === 'circle') {
        particle.style.borderRadius = '50%';
      } else if (shape === 'triangle') {
        particle.style.width = '0';
        particle.style.height = '0';
        particle.style.borderLeft = `${size/2}px solid transparent`;
        particle.style.borderRight = `${size/2}px solid transparent`;
        particle.style.borderBottom = `${size}px solid ${color}`;
        particle.style.backgroundColor = 'transparent';
      } else if (shape === 'star') {
        particle.innerHTML = '★';
        particle.style.fontSize = `${size * 2}px`;
        particle.style.color = color;
        particle.style.backgroundColor = 'transparent';
      } else if (shape === 'x') {
        particle.innerHTML = '✕';
        particle.style.fontSize = `${size * 2}px`;
        particle.style.color = color;
        particle.style.backgroundColor = 'transparent';
      }
      
      this.particleContainer.appendChild(particle);
      
      // Animate particle
      const animation = particle.animate([
        {
          transform: 'translate(0, 0) scale(1) rotate(0deg)',
          opacity: 1
        },
        {
          transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity - 50}px) scale(0) rotate(${Math.random() * 360}deg)`,
          opacity: 0
        }
      ], {
        duration: config.duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
      
      animation.onfinish = () => particle.remove();
    }
  }

  // Attach event listeners for interactions
  attachEventListeners() {
    // Button clicks
    document.addEventListener('click', (e) => {
      const button = e.target.closest('button, .btn, .clickable');
      if (button) {
        this.handleButtonClick(button, e);
      }
    });
    
    // Form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      this.handleFormSubmit(form, e);
    });
    
    // Tab switches
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab-button, .nav-tab');
      if (tab) {
        this.handleTabSwitch(tab, e);
      }
    });
    
    // Game card interactions
    document.addEventListener('click', (e) => {
      const gameCard = e.target.closest('.game-card');
      const joinButton = e.target.closest('.join-button');
      
      if (joinButton && gameCard) {
        this.handleGameJoin(gameCard, e);
      } else if (gameCard) {
        this.handleGameCardClick(gameCard, e);
      }
    });
    
    // Touch events for mobile
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', (e) => {
        const interactive = e.target.closest('button, .btn, .clickable, .game-card');
        if (interactive) {
          this.triggerHaptic('light');
        }
      });
    }
  }

  // Handle button clicks
  handleButtonClick(button, event) {
    // Add ripple effect
    this.createRipple(button, event);
    
    // Play sound and haptic
    this.sounds.click?.();
    this.triggerHaptic('light');
    
    // Add micro animation
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = '';
    }, 100);
    
    // Special handling for specific buttons
    if (button.classList.contains('success-button')) {
      setTimeout(() => {
        this.createParticles(
          event.clientX,
          event.clientY,
          'success'
        );
        this.sounds.success?.();
        this.triggerHaptic('success');
      }, 200);
    }
  }

  // Create ripple effect
  createRipple(element, event) {
    if (this.reducedMotion) return;
    
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.className = 'ripple';
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out;
      pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  // Handle form submissions
  handleFormSubmit(form, event) {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.classList.add('loading');
      this.addLoadingSpinner(submitButton);
    }
  }

  // Handle tab switches
  handleTabSwitch(tab, event) {
    this.sounds.swipe?.();
    this.triggerHaptic('light');
    
    // Add slide animation
    const content = document.querySelector('.tab-content');
    if (content && !this.reducedMotion) {
      content.style.animation = 'slide-in 0.3s ease-out';
    }
  }

  // Handle game join
  handleGameJoin(gameCard, event) {
    const rect = gameCard.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    this.createParticles(centerX, centerY, 'celebration');
    this.sounds.join?.();
    this.triggerHaptic('success');
    
    // Animate the card
    gameCard.style.animation = 'pulse 0.5s ease-out';
    setTimeout(() => {
      gameCard.style.animation = '';
    }, 500);
  }

  // Handle game card clicks
  handleGameCardClick(gameCard, event) {
    if (!event.target.closest('button')) {
      this.triggerHaptic('light');
      gameCard.style.transform = 'scale(0.98)';
      setTimeout(() => {
        gameCard.style.transform = '';
      }, 100);
    }
  }

  // Initialize loading states
  initializeLoadingStates() {
    // Add skeleton screens
    this.addSkeletonScreens();
    
    // Add progress indicators
    this.addProgressIndicators();
  }

  // Add loading spinner to element
  addLoadingSpinner(element) {
    const spinner = document.createElement('span');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="32 20" />
      </svg>
    `;
    element.appendChild(spinner);
  }

  // Add skeleton screens for loading states
  addSkeletonScreens() {
    const style = document.createElement('style');
    style.textContent = `
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
      }
      
      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      .skeleton-text {
        height: 12px;
        margin: 8px 0;
        border-radius: 4px;
      }
      
      .skeleton-button {
        height: 36px;
        width: 100px;
        border-radius: 18px;
      }
    `;
    document.head.appendChild(style);
  }

  // Add progress indicators
  addProgressIndicators() {
    const style = document.createElement('style');
    style.textContent = `
      .progress-ring {
        transform: rotate(-90deg);
      }
      
      .progress-ring-circle {
        fill: none;
        stroke: #e0e0e0;
        stroke-width: 2;
      }
      
      .progress-ring-progress {
        fill: none;
        stroke: #007bff;
        stroke-width: 2;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }

  // Setup smooth state transitions
  setupStateTransitions() {
    // Add transition classes
    const style = document.createElement('style');
    style.textContent = `
      /* Ripple animation */
      @keyframes ripple-animation {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      /* Pulse animation */
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      /* Slide animations */
      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Fade animations */
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* Loading spinner */
      .loading-spinner {
        display: inline-block;
        margin-left: 8px;
        animation: spin 1s linear infinite;
      }
      
      .loading-spinner svg {
        vertical-align: middle;
      }
      
      /* Smooth transitions for interactive elements */
      button, .btn, .clickable {
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }
      
      .game-card {
        transition: all 0.3s ease;
      }
      
      .tab-content {
        animation: fade-in 0.3s ease-out;
      }
      
      /* Success state */
      .success-animation {
        animation: success-pulse 0.5s ease-out;
      }
      
      @keyframes success-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      /* Error shake */
      .error-shake {
        animation: shake 0.5s ease-in-out;
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }
    `;
    document.head.appendChild(style);
  }

  // Public API methods
  
  // Trigger success feedback
  success(element, message) {
    if (element) {
      element.classList.add('success-animation');
      setTimeout(() => element.classList.remove('success-animation'), 500);
    }
    
    this.sounds.success?.();
    this.triggerHaptic('success');
    
    if (element) {
      const rect = element.getBoundingClientRect();
      this.createParticles(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        'success'
      );
    }
  }

  // Trigger error feedback
  error(element, message) {
    if (element) {
      element.classList.add('error-shake');
      setTimeout(() => element.classList.remove('error-shake'), 500);
    }
    
    this.sounds.error?.();
    this.triggerHaptic('error');
  }

  // Trigger notification feedback
  notification(message, type = 'info') {
    this.sounds.notification?.();
    this.triggerHaptic('notification');
  }

  // Trigger achievement
  achievement(title, description) {
    this.sounds.achievement?.();
    this.triggerHaptic('success');
    
    // Create achievement popup
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      animation: slide-in-right 0.5s ease-out;
      z-index: 10001;
    `;
    popup.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div style="font-size: 30px; margin-right: 15px;">🏆</div>
        <div>
          <div style="font-weight: bold; font-size: 16px;">${title}</div>
          <div style="font-size: 14px; opacity: 0.9;">${description}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // Create celebration particles
    setTimeout(() => {
      const rect = popup.getBoundingClientRect();
      this.createParticles(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        'celebration'
      );
    }, 300);
    
    // Remove popup after delay
    setTimeout(() => {
      popup.style.animation = 'slide-out-right 0.5s ease-in';
      setTimeout(() => popup.remove(), 500);
    }, 3000);
  }

  // Toggle sound
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('soundEnabled', this.soundEnabled);
    return this.soundEnabled;
  }
}

// Initialize microinteractions system
window.microinteractions = new MicrointeractionsSystem();

// Export for use in other modules
window.MicrointeractionsSystem = MicrointeractionsSystem;