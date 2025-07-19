// Moderation module for handling moderation actions, reports, and real-time updates
(function() {
  'use strict';

  // Moderation state
  window.moderation = {
    reports: [],
    moderationLogs: [],
    bannedWords: [],
    activeWarnings: new Map(),
    mutedUsers: new Map(),
    currentUserRole: 'user', // Will be updated from auth
    permissions: [],
    wsConnected: false
  };

  // Permission check helper
  window.hasPermission = function(permission, resource = null) {
    return window.moderation.permissions.some(p =>
      p.permission === permission && (!resource || p.resource === resource)
    );
  };

  // Initialize moderation module
  window.initModeration = function() {
    console.log('Initializing moderation module...');

    // Load user role and permissions
    loadUserModerationInfo();

    // Setup WebSocket handlers for moderation
    setupModerationWebSocket();

    // Load banned words list
    loadBannedWords();
  };

  // Load user moderation info
  async function loadUserModerationInfo() {
    if (!window.authState || !window.authState.isAuthenticated) {
      return;
    }

    try {
      const response = await fetch('/api/moderation/user-info', {
        headers: {
          'Authorization': `Bearer ${window.authState.token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        window.moderation.currentUserRole = data.role;
        window.moderation.permissions = data.permissions || [];

        // Update UI based on role
        updateModerationUI();
      }
    } catch (error) {
      console.error('Error loading moderation info:', error);
    }
  }

  // Update UI based on user role
  function updateModerationUI() {
    const role = window.moderation.currentUserRole;

    // Show/hide moderation buttons in messages
    document.querySelectorAll('.moderation-controls').forEach(controls => {
      controls.style.display = (role === 'moderator' || role === 'admin') ? 'block' : 'none';
    });

    // Show/hide moderator dashboard link
    const modDashLink = document.getElementById('mod-dashboard-link');
    if (modDashLink) {
      modDashLink.style.display = (role === 'moderator' || role === 'admin') ? 'inline-block' : 'none';
    }

    // Add moderator badge to user info
    if (role === 'moderator' || role === 'admin') {
      const userInfo = document.querySelector('.user-info');
      if (userInfo && !userInfo.querySelector('.mod-badge')) {
        const badge = document.createElement('span');
        badge.className = 'mod-badge';
        badge.textContent = role === 'admin' ? 'Admin' : 'Mod';
        badge.style.cssText = 'background: #ff6b35; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-left: 8px;';
        userInfo.appendChild(badge);
      }
    }
  }

  // Setup WebSocket handlers for moderation
  function setupModerationWebSocket() {
    if (!window.wsClient) return;

    // Message deleted
    window.wsClient.on('message-deleted', data => {
      console.log('Message deleted:', data);
      removeMessageFromUI(data.messageId);
    });

    // User muted
    window.wsClient.on('user-muted', data => {
      console.log('User muted:', data);
      if (data.userId === window.authState.user.id) {
        showMutedNotification(data.duration);
      }
      updateUserStatusInUI(data.userId, 'muted', data.duration);
    });

    // User banned
    window.wsClient.on('user-banned', data => {
      console.log('User banned:', data);
      if (data.userId === window.authState.user.id) {
        showBannedNotification(data.reason, data.duration);
      }
      updateUserStatusInUI(data.userId, 'banned', data.duration);
    });

    // New report
    window.wsClient.on('new-report', data => {
      console.log('New report:', data);
      if (window.hasPermission('review', 'report')) {
        showNewReportNotification(data);
      }
    });

    // Moderation action
    window.wsClient.on('moderation-action', data => {
      console.log('Moderation action:', data);
      updateModerationLog(data);
    });
  }

  // Load banned words
  async function loadBannedWords() {
    try {
      const response = await fetch('/api/moderation/banned-words');
      const data = await response.json();

      if (data.success) {
        window.moderation.bannedWords = data.words || [];
      }
    } catch (error) {
      console.error('Error loading banned words:', error);
    }
  }

  // Check message for banned words
  window.checkMessageContent = function(content) {
    const lowercaseContent = content.toLowerCase();

    for (const word of window.moderation.bannedWords) {
      if (lowercaseContent.includes(word.toLowerCase())) {
        return {
          valid: false,
          reason: 'Your message contains inappropriate language',
          word: word
        };
      }
    }

    return { valid: true };
  };

  // Report a message
  window.reportMessage = async function(messageId, reportType, description) {
    if (!window.authState.isAuthenticated) {
      window.showLoginModal();
      return;
    }

    try {
      const response = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reported_message_id: messageId,
          report_type: reportType,
          description: description
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Report submitted successfully', 'success');
      } else {
        showNotification(data.message || 'Failed to submit report', 'error');
      }
    } catch (error) {
      console.error('Error reporting message:', error);
      showNotification('Failed to submit report', 'error');
    }
  };

  // Delete a message (moderator action)
  window.deleteMessage = async function(messageId, reason) {
    if (!window.hasPermission('delete', 'message')) {
      showNotification('You do not have permission to delete messages', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/moderation/message/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${window.authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (data.success) {
        removeMessageFromUI(messageId);
        showNotification('Message deleted', 'success');
      } else {
        showNotification(data.message || 'Failed to delete message', 'error');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showNotification('Failed to delete message', 'error');
    }
  };

  // Mute a user (moderator action)
  window.muteUser = async function(userId, duration, reason) {
    if (!window.hasPermission('mute', 'user')) {
      showNotification('You do not have permission to mute users', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/mute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_user_id: userId,
          duration_minutes: duration,
          reason: reason
        })
      });

      const data = await response.json();

      if (data.success) {
        window.moderation.mutedUsers.set(userId, {
          until: Date.now() + (duration * 60000),
          reason: reason
        });
        updateUserStatusInUI(userId, 'muted', duration);
        showNotification(`User muted for ${duration} minutes`, 'success');
      } else {
        showNotification(data.message || 'Failed to mute user', 'error');
      }
    } catch (error) {
      console.error('Error muting user:', error);
      showNotification('Failed to mute user', 'error');
    }
  };

  // Warn a user (moderator action)
  window.warnUser = async function(userId, reason) {
    if (!window.hasPermission('warn', 'user')) {
      showNotification('You do not have permission to warn users', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/warn', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_user_id: userId,
          reason: reason
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('User warned', 'success');
      } else {
        showNotification(data.message || 'Failed to warn user', 'error');
      }
    } catch (error) {
      console.error('Error warning user:', error);
      showNotification('Failed to warn user', 'error');
    }
  };

  // Ban a user (admin action)
  window.banUser = async function(userId, duration, reason) {
    if (!window.hasPermission('ban', 'user')) {
      showNotification('You do not have permission to ban users', 'error');
      return;
    }

    try {
      const response = await fetch('/api/moderation/ban', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_user_id: userId,
          duration_minutes: duration,
          reason: reason
        })
      });

      const data = await response.json();

      if (data.success) {
        updateUserStatusInUI(userId, 'banned', duration);
        showNotification(`User banned for ${duration} minutes`, 'success');
      } else {
        showNotification(data.message || 'Failed to ban user', 'error');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      showNotification('Failed to ban user', 'error');
    }
  };

  // Load moderation reports
  window.loadModerationReports = async function(status = 'pending') {
    if (!window.hasPermission('review', 'report')) {
      return [];
    }

    try {
      const response = await fetch(`/api/moderation/reports?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${window.authState.token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        window.moderation.reports = data.reports || [];
        return window.moderation.reports;
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }

    return [];
  };

  // Resolve a report
  window.resolveReport = async function(reportId, resolution) {
    if (!window.hasPermission('resolve', 'report')) {
      showNotification('You do not have permission to resolve reports', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/moderation/report/${reportId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${window.authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolution })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Report resolved', 'success');
        // Remove from local reports list
        window.moderation.reports = window.moderation.reports.filter(r => r.id !== reportId);
      } else {
        showNotification(data.message || 'Failed to resolve report', 'error');
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      showNotification('Failed to resolve report', 'error');
    }
  };

  // Load moderation logs
  window.loadModerationLogs = async function(limit = 50) {
    if (!window.hasPermission('review', 'report')) {
      return [];
    }

    try {
      const response = await fetch(`/api/moderation/logs?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${window.authState.token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        window.moderation.moderationLogs = data.logs || [];
        return window.moderation.moderationLogs;
      }
    } catch (error) {
      console.error('Error loading moderation logs:', error);
    }

    return [];
  };

  // UI Helper functions
  function removeMessageFromUI(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
      messageEl.style.opacity = '0.5';
      messageEl.innerHTML = '<em>This message has been deleted by a moderator</em>';
    }
  }

  function updateUserStatusInUI(userId, status, duration) {
    const userElements = document.querySelectorAll(`[data-user-id="${userId}"]`);
    userElements.forEach(el => {
      el.classList.add(`user-${status}`);

      // Add status indicator
      const statusIndicator = el.querySelector('.user-status') || document.createElement('span');
      statusIndicator.className = 'user-status';
      statusIndicator.textContent = status === 'muted' ? '🔇' : '🚫';
      statusIndicator.title = `${status} for ${duration} minutes`;

      if (!el.querySelector('.user-status')) {
        el.appendChild(statusIndicator);
      }
    });
  }

  function showMutedNotification(duration) {
    showNotification(
      `You have been muted for ${duration} minutes. You cannot send messages during this time.`,
      'warning',
      duration * 60000
    );
  }

  function showBannedNotification(reason, duration) {
    showNotification(
      `You have been banned for ${duration} minutes. Reason: ${reason}`,
      'error',
      duration * 60000
    );

    // Redirect to home page after 5 seconds
    setTimeout(() => {
      window.location.href = '/';
    }, 5000);
  }

  function showNewReportNotification(report) {
    showNotification(
      `New report: ${report.report_type} - ${report.description.substring(0, 50)}...`,
      'info'
    );
  }

  function updateModerationLog(action) {
    window.moderation.moderationLogs.unshift(action);

    // Update UI if moderation dashboard is open
    const logContainer = document.getElementById('moderation-logs');
    if (logContainer) {
      renderModerationLog(action, logContainer);
    }
  }

  function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            transition: opacity 0.3s;
        `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.style.opacity = '1', 10);

    // Remove after duration
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  // Initialize when auth is ready
  if (window.authState && window.authState.isAuthenticated) {
    window.initModeration();
  } else {
    // Wait for auth
    window.addEventListener('authenticated', window.initModeration);
  }

  // Re-initialize when user logs in
  window.addEventListener('authStateChanged', function(e) {
    if (e.detail && e.detail.isAuthenticated) {
      window.initModeration();
    }
  });

  console.log('Moderation module loaded');
})();
