const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateModerator, authenticateAdmin, hasPermission } = require('../middleware/auth');

// Mock data stores (replace with database queries in production)
const reports = [];
const moderationLogs = [];
const bannedWords = [
  { id: '1', word: 'spam', severity: 'medium', category: 'general' },
  { id: '2', word: 'badword', severity: 'high', category: 'offensive' },
  { id: '3', word: 'inappropriate', severity: 'medium', category: 'general' }
];

// Get user moderation info
router.get('/moderation/user-info', authenticateToken, (req, res) => {
  const userRole = req.user.role || 'user';
  const permissions = [];

  // Define permissions based on role
  switch (userRole) {
  case 'admin':
    permissions.push(
      { permission: 'delete', resource: 'message' },
      { permission: 'mute', resource: 'user' },
      { permission: 'ban', resource: 'user' },
      { permission: 'warn', resource: 'user' },
      { permission: 'review', resource: 'report' },
      { permission: 'resolve', resource: 'report' },
      { permission: 'manage', resource: 'moderator' },
      { permission: 'manage', resource: 'rules' }
    );
    break;
  case 'moderator':
    permissions.push(
      { permission: 'delete', resource: 'message' },
      { permission: 'mute', resource: 'user' },
      { permission: 'warn', resource: 'user' },
      { permission: 'review', resource: 'report' },
      { permission: 'resolve', resource: 'report' }
    );
    break;
  default:
    permissions.push(
      { permission: 'read', resource: 'chat' },
      { permission: 'write', resource: 'chat' },
      { permission: 'report', resource: 'user' },
      { permission: 'report', resource: 'message' }
    );
  }

  res.json({
    success: true,
    role: userRole,
    permissions: permissions
  });
});

// Submit a report
router.post('/moderation/report', authenticateToken, (req, res) => {
  const { reported_message_id, reported_user_id, report_type, description } = req.body;

  if (!report_type || !description) {
    return res.status(400).json({ success: false, message: 'Report type and description required' });
  }

  const report = {
    id: Date.now().toString(),
    reporter_id: req.user.id,
    reporter_name: req.user.email,
    reported_message_id,
    reported_user_id,
    report_type,
    description,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  reports.unshift(report);

  // In production, send WebSocket notification to moderators

  res.json({ success: true, report_id: report.id });
});

// Get reports (moderator only)
router.get('/moderation/reports', authenticateModerator, (req, res) => {
  const { status } = req.query;

  let filteredReports = reports;
  if (status && status !== 'all') {
    filteredReports = reports.filter(r => r.status === status);
  }

  res.json({
    success: true,
    reports: filteredReports.slice(0, 50) // Limit to 50 most recent
  });
});

// Resolve a report
router.put('/moderation/report/:reportId/resolve', authenticateModerator, (req, res) => {
  const { reportId } = req.params;
  const { resolution } = req.body;

  const report = reports.find(r => r.id === reportId);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  report.status = 'resolved';
  report.resolution = resolution;
  report.resolved_by = req.user.id;
  report.resolved_at = new Date().toISOString();

  res.json({ success: true });
});

// Delete a message
router.delete('/moderation/message/:messageId', authenticateModerator, (req, res) => {
  const { messageId } = req.params;
  const { reason } = req.body;

  // Log the action
  const logEntry = {
    id: Date.now().toString(),
    action_type: 'delete_message',
    moderator_id: req.user.id,
    moderator_name: req.user.email,
    target_message_id: messageId,
    reason,
    created_at: new Date().toISOString()
  };

  moderationLogs.unshift(logEntry);

  // In production, delete from database and send WebSocket notification

  res.json({ success: true });
});

// Mute a user
router.post('/moderation/mute', authenticateModerator, (req, res) => {
  const { target_user_id, duration_minutes, reason } = req.body;

  if (!target_user_id || !duration_minutes || !reason) {
    return res.status(400).json({ success: false, message: 'User ID, duration, and reason required' });
  }

  // Log the action
  const logEntry = {
    id: Date.now().toString(),
    action_type: 'mute',
    moderator_id: req.user.id,
    moderator_name: req.user.email,
    target_user_id,
    target_user_name: 'User ' + target_user_id, // In production, get from database
    duration_minutes,
    reason,
    created_at: new Date().toISOString()
  };

  moderationLogs.unshift(logEntry);

  // In production, update user record and send WebSocket notification

  res.json({ success: true, muted_until: new Date(Date.now() + duration_minutes * 60000).toISOString() });
});

// Warn a user
router.post('/moderation/warn', authenticateModerator, (req, res) => {
  const { target_user_id, reason } = req.body;

  if (!target_user_id || !reason) {
    return res.status(400).json({ success: false, message: 'User ID and reason required' });
  }

  // Log the action
  const logEntry = {
    id: Date.now().toString(),
    action_type: 'warn',
    moderator_id: req.user.id,
    moderator_name: req.user.email,
    target_user_id,
    target_user_name: 'User ' + target_user_id,
    reason,
    created_at: new Date().toISOString()
  };

  moderationLogs.unshift(logEntry);

  // In production, increment warning count and send notification

  res.json({ success: true });
});

// Ban a user (admin only)
router.post('/moderation/ban', authenticateAdmin, (req, res) => {

  const { target_user_id, duration_minutes, reason } = req.body;

  if (!target_user_id || !duration_minutes || !reason) {
    return res.status(400).json({ success: false, message: 'User ID, duration, and reason required' });
  }

  // Log the action
  const logEntry = {
    id: Date.now().toString(),
    action_type: 'ban',
    moderator_id: req.user.id,
    moderator_name: req.user.email,
    target_user_id,
    target_user_name: 'User ' + target_user_id,
    duration_minutes,
    reason,
    created_at: new Date().toISOString()
  };

  moderationLogs.unshift(logEntry);

  // In production, update user record and terminate sessions

  res.json({ success: true, banned_until: new Date(Date.now() + duration_minutes * 60000).toISOString() });
});

// Get moderation logs
router.get('/moderation/logs', authenticateModerator, (req, res) => {
  const { limit = 50 } = req.query;

  res.json({
    success: true,
    logs: moderationLogs.slice(0, parseInt(limit))
  });
});

// Get banned words
router.get('/moderation/banned-words', (req, res) => {
  // Public endpoint - anyone can check banned words
  res.json({
    success: true,
    words: bannedWords
  });
});

// Add banned word (admin only)
router.post('/moderation/banned-words', authenticateAdmin, (req, res) => {

  const { word, severity = 'medium', category = 'general' } = req.body;

  if (!word) {
    return res.status(400).json({ success: false, message: 'Word is required' });
  }

  const newWord = {
    id: Date.now().toString(),
    word: word.toLowerCase(),
    severity,
    category,
    added_by: req.user.id,
    created_at: new Date().toISOString()
  };

  bannedWords.push(newWord);

  res.json({ success: true, word: newWord });
});

// Remove banned word (admin only)
router.delete('/moderation/banned-words/:wordId', authenticateAdmin, (req, res) => {

  const { wordId } = req.params;
  const index = bannedWords.findIndex(w => w.id === wordId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Word not found' });
  }

  bannedWords.splice(index, 1);

  res.json({ success: true });
});

// Search users (moderator only)
router.get('/moderation/users/search', authenticateModerator, (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 3) {
    return res.json({ success: true, users: [] });
  }

  // Mock user search - in production, query database
  const mockUsers = [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      warning_count: 0,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'moderator',
      warning_count: 0,
      created_at: '2024-01-02T00:00:00Z'
    },
    {
      id: 'user-3',
      name: 'Bad User',
      email: 'bad@example.com',
      role: 'user',
      warning_count: 3,
      is_muted: true,
      created_at: '2024-01-03T00:00:00Z'
    }
  ];

  const results = mockUsers.filter(user =>
    user.name.toLowerCase().includes(q.toLowerCase()) ||
        user.email.toLowerCase().includes(q.toLowerCase())
  );

  res.json({ success: true, users: results });
});

module.exports = router;
