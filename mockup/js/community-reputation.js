// Community Reputation System
window.CommunityReputation = {
  currentUserId: null,
  reputationCache: new Map(),
  socialGraphData: null,

  // Initialize the reputation system
  async initialize() {
    this.currentUserId = localStorage.getItem('userId');
    if (this.currentUserId) {
      await this.loadUserReputation(this.currentUserId);
    }
  },

  // Load user reputation data
  async loadUserReputation(userId) {
    try {
      const response = await fetch(`/api/community/reputation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.reputationCache.set(userId, data);
        
        if (userId === this.currentUserId) {
          this.updateReputationDisplay(data);
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error loading reputation:', error);
    }
  },

  // Update reputation display in UI
  updateReputationDisplay(reputation) {
    const reputationEl = document.getElementById('user-reputation');
    if (!reputationEl) return;

    const trustBadges = {
      1: { icon: '🌱', label: 'New Member' },
      2: { icon: '⭐', label: 'Active Member' },
      3: { icon: '🏅', label: 'Trusted Member' },
      4: { icon: '🏆', label: 'Community Leader' },
      5: { icon: '👑', label: 'Community Legend' }
    };

    const badge = trustBadges[reputation.trust_level] || trustBadges[1];

    reputationEl.innerHTML = `
      <div class="reputation-summary">
        <div class="reputation-score">
          <span class="score-value">${reputation.reputation_score}</span>
          <span class="score-label">Reputation</span>
        </div>
        <div class="trust-badge">
          <span class="badge-icon">${badge.icon}</span>
          <span class="badge-label">${badge.label}</span>
        </div>
      </div>
      <div class="reputation-breakdown">
        <div class="rep-category">
          <span class="category-icon">🤝</span>
          <span class="category-value">${reputation.helpfulness_score}</span>
          <span class="category-label">Helpfulness</span>
        </div>
        <div class="rep-category">
          <span class="category-icon">⚡</span>
          <span class="category-value">${reputation.reliability_score}</span>
          <span class="category-label">Reliability</span>
        </div>
        <div class="rep-category">
          <span class="category-icon">🌟</span>
          <span class="category-value">${reputation.community_builder_score}</span>
          <span class="category-label">Community</span>
        </div>
        <div class="rep-category">
          <span class="category-icon">🎯</span>
          <span class="category-value">${reputation.sportsmanship_score}</span>
          <span class="category-label">Sportsmanship</span>
        </div>
      </div>
    `;
  },

  // Endorse a user
  async endorseUser(userId, skillType, message = '') {
    try {
      const response = await fetch(`/api/community/endorse/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ skillType, message })
      });

      if (response.ok) {
        this.showNotification('Endorsement sent successfully!', 'success');
        return await response.json();
      }
    } catch (error) {
      console.error('Error endorsing user:', error);
      this.showNotification('Failed to send endorsement', 'error');
    }
  },

  // Display endorsement modal
  showEndorseModal(userId, username) {
    const modal = document.createElement('div');
    modal.className = 'modal endorse-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Endorse ${username}</h3>
        <div class="endorse-skills">
          <button class="skill-btn" data-skill="leadership">
            <span class="skill-icon">👑</span>
            <span>Leadership</span>
          </button>
          <button class="skill-btn" data-skill="teamwork">
            <span class="skill-icon">🤝</span>
            <span>Teamwork</span>
          </button>
          <button class="skill-btn" data-skill="sportsmanship">
            <span class="skill-icon">🏆</span>
            <span>Sportsmanship</span>
          </button>
          <button class="skill-btn" data-skill="organization">
            <span class="skill-icon">📋</span>
            <span>Organization</span>
          </button>
          <button class="skill-btn" data-skill="communication">
            <span class="skill-icon">💬</span>
            <span>Communication</span>
          </button>
          <button class="skill-btn" data-skill="technical">
            <span class="skill-icon">⚽</span>
            <span>Technical Skills</span>
          </button>
        </div>
        <textarea 
          id="endorse-message" 
          placeholder="Add a message (optional)"
          maxlength="500"
        ></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" onclick="this.closest('.modal').remove()">Cancel</button>
          <button class="btn-primary" id="send-endorsement" disabled>Send Endorsement</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let selectedSkill = null;
    modal.querySelectorAll('.skill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.skill-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedSkill = btn.dataset.skill;
        modal.querySelector('#send-endorsement').disabled = false;
      });
    });

    modal.querySelector('#send-endorsement').addEventListener('click', async () => {
      const message = modal.querySelector('#endorse-message').value;
      await this.endorseUser(userId, selectedSkill, message);
      modal.remove();
    });
  },

  // Ice breaker system
  async getIceBreakerPrompts(category = null, sport = null) {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (sport) params.append('sport', sport);

      const response = await fetch(`/api/community/ice-breakers?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error getting ice breakers:', error);
    }
    return [];
  },

  // Display ice breaker interface
  async showIceBreakerInterface() {
    const prompts = await this.getIceBreakerPrompts();
    if (!prompts.length) return;

    const container = document.getElementById('ice-breaker-container');
    if (!container) return;

    container.innerHTML = `
      <div class="ice-breaker-section">
        <h3>🎯 Break the Ice!</h3>
        <p>Answer a fun question to introduce yourself to the community</p>
        <div class="prompts-carousel">
          ${prompts.map((prompt, index) => `
            <div class="prompt-card ${index === 0 ? 'active' : ''}" data-prompt-id="${prompt.id}">
              <div class="prompt-category">${this.formatCategory(prompt.category)}</div>
              <div class="prompt-text">${prompt.prompt}</div>
              <textarea 
                class="prompt-response" 
                placeholder="Share your answer..."
                maxlength="1000"
              ></textarea>
              <div class="prompt-actions">
                <button class="btn-skip">Skip</button>
                <button class="btn-share">Share Answer</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="prompts-dots">
          ${prompts.map((_, index) => `
            <span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
          `).join('')}
        </div>
      </div>
    `;

    // Handle prompt navigation
    let currentIndex = 0;
    const cards = container.querySelectorAll('.prompt-card');
    const dots = container.querySelectorAll('.dot');

    const showPrompt = (index) => {
      cards.forEach(card => card.classList.remove('active'));
      dots.forEach(dot => dot.classList.remove('active'));
      cards[index].classList.add('active');
      dots[index].classList.add('active');
      currentIndex = index;
    };

    // Skip button
    container.querySelectorAll('.btn-skip').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const nextIndex = (index + 1) % prompts.length;
        showPrompt(nextIndex);
      });
    });

    // Share answer button
    container.querySelectorAll('.btn-share').forEach((btn, index) => {
      btn.addEventListener('click', async () => {
        const card = cards[index];
        const response = card.querySelector('.prompt-response').value;
        if (!response.trim()) return;

        await this.saveIceBreakerResponse(
          card.dataset.promptId,
          response
        );

        // Show next prompt or completion message
        if (index < prompts.length - 1) {
          showPrompt(index + 1);
        } else {
          container.innerHTML = `
            <div class="ice-breaker-complete">
              <h3>🎉 Thanks for sharing!</h3>
              <p>You've earned +2 reputation points for engaging with the community</p>
            </div>
          `;
        }
      });
    });
  },

  // Save ice breaker response
  async saveIceBreakerResponse(promptId, response, visibility = 'public') {
    try {
      const res = await fetch('/api/community/ice-breakers/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ promptId, response, visibility })
      });

      if (res.ok) {
        this.showNotification('Response shared!', 'success');
        return await res.json();
      }
    } catch (error) {
      console.error('Error saving response:', error);
    }
  },

  // Team formation features
  async showTeamFormationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal team-formation-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>🏃 Form a Team</h3>
        <form id="team-formation-form">
          <div class="form-group">
            <label>Sport</label>
            <select name="sport" required>
              <option value="">Select a sport</option>
              <option value="basketball">Basketball</option>
              <option value="soccer">Soccer</option>
              <option value="volleyball">Volleyball</option>
              <option value="tennis">Tennis</option>
              <option value="badminton">Badminton</option>
              <option value="baseball">Baseball</option>
              <option value="cricket">Cricket</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Skill Level</label>
            <select name="skillLevel" required>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="mixed">Mixed Levels</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Team Name (optional)</label>
            <input type="text" name="teamName" placeholder="e.g., Weekend Warriors">
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              placeholder="Tell us about your team goals and playing style..."
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Maximum Members</label>
            <input type="number" name="maxMembers" min="2" max="50" value="10">
          </div>
          
          <div class="form-group">
            <label>Preferred Play Times</label>
            <div class="time-slots">
              <label><input type="checkbox" value="weekday-morning"> Weekday Mornings</label>
              <label><input type="checkbox" value="weekday-evening"> Weekday Evenings</label>
              <label><input type="checkbox" value="weekend-morning"> Weekend Mornings</label>
              <label><input type="checkbox" value="weekend-afternoon"> Weekend Afternoons</label>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-cancel" onclick="this.closest('.modal').remove()">Cancel</button>
            <button type="submit" class="btn-primary">Create Team</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#team-formation-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const selectedTimes = [];
      modal.querySelectorAll('.time-slots input:checked').forEach(input => {
        selectedTimes.push(input.value);
      });

      const teamData = {
        sport: formData.get('sport'),
        skillLevel: formData.get('skillLevel'),
        teamName: formData.get('teamName'),
        description: formData.get('description'),
        maxMembers: parseInt(formData.get('maxMembers')),
        preferredPlayTimes: selectedTimes,
        location: await this.getCurrentLocation()
      };

      await this.createTeam(teamData);
      modal.remove();
    });
  },

  // Create team
  async createTeam(teamData) {
    try {
      const response = await fetch('/api/community/teams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(teamData)
      });

      if (response.ok) {
        const team = await response.json();
        this.showNotification('Team created successfully!', 'success');
        this.showTeamDetails(team);
        return team;
      }
    } catch (error) {
      console.error('Error creating team:', error);
      this.showNotification('Failed to create team', 'error');
    }
  },

  // Get team recommendations
  async getTeamRecommendations(sport = null) {
    try {
      const params = sport ? `?sport=${sport}` : '';
      const response = await fetch(`/api/community/teams/recommendations${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error getting team recommendations:', error);
    }
    return [];
  },

  // Display team recommendations
  async showTeamRecommendations() {
    const teams = await this.getTeamRecommendations();
    const container = document.getElementById('team-recommendations');
    if (!container) return;

    container.innerHTML = `
      <div class="team-recommendations">
        <h3>👥 Teams Looking for Players</h3>
        ${teams.length === 0 ? '<p>No teams found. Why not create one?</p>' : ''}
        <div class="teams-grid">
          ${teams.map(team => `
            <div class="team-card">
              <div class="team-header">
                <h4>${team.team_name || `${team.sport} Team`}</h4>
                <span class="team-sport">${team.sport}</span>
              </div>
              <div class="team-info">
                <div class="info-item">
                  <span class="icon">🎯</span>
                  <span>${team.skill_level}</span>
                </div>
                <div class="info-item">
                  <span class="icon">👥</span>
                  <span>${team.current_members}/${team.max_members} members</span>
                </div>
                <div class="info-item">
                  <span class="icon">⭐</span>
                  <span>Captain: ${team.creator_reputation || 0} rep</span>
                </div>
              </div>
              ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
              <div class="team-members-preview">
                ${team.members.slice(0, 3).map(member => `
                  <img src="${member.picture || '/images/default-avatar.png'}" 
                       alt="${member.username}" 
                       title="${member.username}">
                `).join('')}
                ${team.members.length > 3 ? `<span class="more">+${team.members.length - 3}</span>` : ''}
              </div>
              <button class="btn-join-team" data-team-id="${team.id}">
                Request to Join
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Handle join requests
    container.querySelectorAll('.btn-join-team').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.joinTeam(btn.dataset.teamId);
      });
    });
  },

  // Join team
  async joinTeam(teamId, position = null) {
    try {
      const response = await fetch(`/api/community/teams/${teamId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ position })
      });

      if (response.ok) {
        this.showNotification('Join request sent!', 'success');
        await this.showTeamRecommendations(); // Refresh list
      }
    } catch (error) {
      console.error('Error joining team:', error);
      this.showNotification('Failed to join team', 'error');
    }
  },

  // Social graph visualization
  async loadSocialGraph(userId = null) {
    userId = userId || this.currentUserId;
    if (!userId) return;

    try {
      const response = await fetch(`/api/community/social-graph/${userId}?depth=2`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        this.socialGraphData = await response.json();
        this.renderSocialGraph();
      }
    } catch (error) {
      console.error('Error loading social graph:', error);
    }
  },

  // Render social graph using D3.js or Canvas
  renderSocialGraph() {
    const container = document.getElementById('social-graph-container');
    if (!container || !this.socialGraphData) return;

    // Simple SVG visualization
    const width = container.offsetWidth;
    const height = 400;

    container.innerHTML = `
      <svg width="${width}" height="${height}" class="social-graph">
        <defs>
          <pattern id="user-pattern" x="0" y="0" width="1" height="1">
            <image href="/images/default-avatar.png" x="0" y="0" width="40" height="40"/>
          </pattern>
        </defs>
      </svg>
    `;

    const svg = container.querySelector('svg');
    const nodes = this.socialGraphData.nodes;
    const edges = this.socialGraphData.edges;

    // Position nodes using force simulation (simplified)
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    nodes.forEach((node, index) => {
      if (node.level === 0) {
        node.x = centerX;
        node.y = centerY;
      } else {
        const angle = (index / nodes.length) * 2 * Math.PI;
        const r = radius * node.level;
        node.x = centerX + r * Math.cos(angle);
        node.y = centerY + r * Math.sin(angle);
      }
    });

    // Draw edges
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', source.x);
      line.setAttribute('y1', source.y);
      line.setAttribute('x2', target.x);
      line.setAttribute('y2', target.y);
      line.setAttribute('class', `edge ${edge.type}`);
      line.setAttribute('stroke-opacity', edge.strength);
      svg.appendChild(line);
    });

    // Draw nodes
    nodes.forEach(node => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      g.setAttribute('class', `node ${node.type}`);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', node.level === 0 ? 25 : 20);
      circle.setAttribute('fill', node.level === 0 ? '#4CAF50' : '#2196F3');
      g.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '35');
      text.textContent = node.username || 'You';
      g.appendChild(text);

      if (node.reputation) {
        const repText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        repText.setAttribute('text-anchor', 'middle');
        repText.setAttribute('dy', '50');
        repText.setAttribute('class', 'reputation-text');
        repText.textContent = `${node.reputation} rep`;
        g.appendChild(repText);
      }

      svg.appendChild(g);
    });
  },

  // Helper functions
  formatCategory(category) {
    const categoryLabels = {
      'sports_general': '🏃 General Sports',
      'team_building': '👥 Team Building',
      'local_community': '📍 Local Community',
      'sport_specific': '⚽ Sport Specific',
      'fun_casual': '🎉 Fun & Casual'
    };
    return categoryLabels[category] || category;
  },

  async getCurrentLocation() {
    // Get from user preferences or geolocation
    return {
      city: 'Vancouver',
      lat: 49.2827,
      lng: -123.1207
    };
  },

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  showTeamDetails(team) {
    // Implement team details view
    console.log('Team created:', team);
  }
};

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.CommunityReputation.initialize();
  });
} else {
  window.CommunityReputation.initialize();
}