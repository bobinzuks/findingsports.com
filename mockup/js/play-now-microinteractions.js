/**
 * Play Now Microinteractions Enhancement
 * Adds delightful feedback to Play Now functionality
 */

(function() {
  // Wait for microinteractions system to be ready
  const waitForMicrointeractions = setInterval(() => {
    if (window.microinteractions && window.PlayNowPage) {
      clearInterval(waitForMicrointeractions);
      enhancePlayNow();
    }
  }, 100);

  function enhancePlayNow() {
    // Store original methods
    const originalFindGames = window.PlayNowPage.findGames;
    const originalRenderResults = window.PlayNowPage.renderResults;

    // Enhanced findGames with microinteractions
    window.PlayNowPage.findGames = async function() {
      const button = document.querySelector('.play-now-action-btn');
      const sport = document.getElementById('playNowSportSelect')?.value;
      
      // Trigger haptic and sound feedback
      window.microinteractions.triggerHaptic('medium');
      window.microinteractions.sounds.click?.();
      
      // Add loading state to button
      if (button) {
        button.classList.add('loading');
        button.innerHTML = `
          <span class="btn-text">Finding games...</span>
          <span class="loading-spinner">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="32 20" />
            </svg>
          </span>
        `;
      }
      
      try {
        // Call original method
        const result = await originalFindGames.call(this);
        
        // Success feedback
        window.microinteractions.success(button, 'Games found!');
        
        // Create particles at button location
        if (button) {
          const rect = button.getBoundingClientRect();
          window.microinteractions.createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            'success'
          );
        }
        
        return result;
      } catch (error) {
        // Error feedback
        window.microinteractions.error(button, 'Failed to find games');
        throw error;
      } finally {
        // Reset button state
        if (button) {
          button.classList.remove('loading');
          button.innerHTML = `
            <span class="btn-text">Play Now</span>
            <span class="btn-icon">→</span>
          `;
        }
      }
    };

    // Enhanced renderResults with animations
    window.PlayNowPage.renderResults = function(venues) {
      const resultsContainer = document.getElementById('playNowResults');
      if (!resultsContainer) return;
      
      // Add skeleton loading first
      resultsContainer.innerHTML = generateSkeletonCards(3);
      
      // Simulate loading delay for smooth transition
      setTimeout(() => {
        // Call original render method
        originalRenderResults.call(this, venues);
        
        // Animate cards in
        const cards = resultsContainer.querySelectorAll('.venue-card');
        cards.forEach((card, index) => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          card.style.transition = 'all 0.3s ease';
          
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, index * 100);
        });
        
        // Add join button enhancements
        enhanceJoinButtons();
      }, 500);
    };

    // Enhance join/view buttons
    function enhanceJoinButtons() {
      const buttons = document.querySelectorAll('.join-game-btn, .view-venue-btn');
      
      buttons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.stopPropagation();
          
          // Haptic feedback
          window.microinteractions.triggerHaptic('success');
          
          // Sound effect
          window.microinteractions.sounds.join?.();
          
          // Visual feedback
          const card = this.closest('.venue-card');
          if (card) {
            card.style.animation = 'pulse 0.5s ease-out';
            
            // Create celebration particles
            const rect = card.getBoundingClientRect();
            window.microinteractions.createParticles(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              'celebration'
            );
          }
          
          // Show success message
          this.textContent = 'Joined! ✓';
          this.style.backgroundColor = '#27ae60';
          
          // Achievement check
          checkJoinAchievements();
        });
      });
    }

    // Generate skeleton cards for loading state
    function generateSkeletonCards(count) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <div class="venue-card skeleton-card">
            <div class="skeleton skeleton-text" style="width: 60%; height: 24px; margin-bottom: 12px;"></div>
            <div class="skeleton skeleton-text" style="width: 80%; height: 16px; margin-bottom: 8px;"></div>
            <div class="skeleton skeleton-text" style="width: 70%; height: 16px; margin-bottom: 8px;"></div>
            <div class="skeleton skeleton-text" style="width: 50%; height: 16px; margin-bottom: 16px;"></div>
            <div class="skeleton skeleton-button" style="width: 100%; height: 40px;"></div>
          </div>
        `;
      }
      return html;
    }

    // Check for achievements
    function checkJoinAchievements() {
      const joinCount = parseInt(localStorage.getItem('gamesJoined') || '0') + 1;
      localStorage.setItem('gamesJoined', joinCount);
      
      // First game achievement
      if (joinCount === 1) {
        window.microinteractions.achievement(
          'First Game!',
          'You joined your first game. Welcome to the community!'
        );
      }
      
      // Milestone achievements
      if (joinCount === 5) {
        window.microinteractions.achievement(
          'Getting Active!',
          'You\'ve joined 5 games. Keep it up!'
        );
      }
      
      if (joinCount === 10) {
        window.microinteractions.achievement(
          'Sports Enthusiast!',
          'You\'ve joined 10 games. You\'re on fire!'
        );
      }
    }

    // Enhance sport selector
    const sportSelect = document.getElementById('playNowSportSelect');
    if (sportSelect) {
      sportSelect.addEventListener('change', function() {
        window.microinteractions.sounds.swipe?.();
        window.microinteractions.triggerHaptic('light');
        
        // Animate icon change
        const icon = this.parentElement.querySelector('.sport-icon');
        if (icon) {
          icon.style.animation = 'spin 0.5s ease-out';
        }
      });
    }

    // Enhance location detection
    const originalUpdateLocation = window.PlayNowPage.updateLocationDisplay;
    window.PlayNowPage.updateLocationDisplay = function() {
      originalUpdateLocation.call(this);
      
      const locationDisplay = document.getElementById('userLocationDisplay');
      if (locationDisplay && locationDisplay.textContent !== 'Detecting...') {
        // Location detected successfully
        window.microinteractions.notification('Location detected', 'success');
        
        // Add pulse animation to location display
        locationDisplay.style.animation = 'pulse 0.5s ease-out';
      }
    };

    // Add hover effects to venue cards
    document.addEventListener('mouseover', function(e) {
      const card = e.target.closest('.venue-card');
      if (card && !card.classList.contains('skeleton-card')) {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
      }
    });

    document.addEventListener('mouseout', function(e) {
      const card = e.target.closest('.venue-card');
      if (card && !card.classList.contains('skeleton-card')) {
        card.style.transform = '';
        card.style.boxShadow = '';
      }
    });

    // Add pull-to-refresh on mobile
    if ('ontouchstart' in window) {
      let startY = 0;
      let currentY = 0;
      let refreshing = false;
      
      document.addEventListener('touchstart', function(e) {
        if (window.scrollY === 0) {
          startY = e.touches[0].pageY;
        }
      });
      
      document.addEventListener('touchmove', function(e) {
        if (startY > 0) {
          currentY = e.touches[0].pageY;
          const diff = currentY - startY;
          
          if (diff > 50 && !refreshing) {
            refreshing = true;
            window.microinteractions.triggerHaptic('medium');
            window.microinteractions.sounds.swipe?.();
            
            // Refresh games
            if (window.PlayNowPage.findGames) {
              window.PlayNowPage.findGames();
            }
            
            setTimeout(() => {
              refreshing = false;
              startY = 0;
            }, 1000);
          }
        }
      });
      
      document.addEventListener('touchend', function() {
        startY = 0;
        currentY = 0;
      });
    }
  }
})();