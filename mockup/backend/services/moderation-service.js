const { v4: uuidv4 } = require('uuid');

// In-memory stores (replace with database in production)
const moderationActions = global.moderationActions || new Map();
const userReports = global.userReports || new Map();
const rolePermissions = global.rolePermissions || new Map();

// Initialize globals
global.moderationActions = moderationActions;
global.userReports = userReports;
global.rolePermissions = rolePermissions;

// Initialize default role permissions
if (rolePermissions.size === 0) {
  // User permissions
  rolePermissions.set('user:read:chat', true);
  rolePermissions.set('user:write:chat', true);
  rolePermissions.set('user:report:user', true);
  rolePermissions.set('user:report:message', true);

  // Moderator permissions (includes all user permissions)
  rolePermissions.set('moderator:read:chat', true);
  rolePermissions.set('moderator:write:chat', true);
  rolePermissions.set('moderator:report:user', true);
  rolePermissions.set('moderator:report:message', true);
  rolePermissions.set('moderator:delete:message', true);
  rolePermissions.set('moderator:mute:user', true);
  rolePermissions.set('moderator:kick:user', true);
  rolePermissions.set('moderator:warn:user', true);
  rolePermissions.set('moderator:review:report', true);
  rolePermissions.set('moderator:resolve:report', true);

  // Admin permissions (all permissions)
  rolePermissions.set('admin:*', true);
}

class ModerationService {
  constructor() {
    this.users = global.users || new Map();
  }

  // List all moderators
  listModerators() {
    const moderators = [];
    for (const [id, user] of this.users) {
      if (user.role === 'moderator' || user.role === 'admin') {
        // Don't send password hash
        const { passwordHash, ...safeUser } = user;
        moderators.push(safeUser);
      }
    }
    return moderators.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Promote user to moderator
  promoteToModerator(adminId, userId, permissions = []) {
    const admin = this.users.get(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user role
    user.role = 'moderator';
    user.permissions = user.permissions || {};

    // Add custom permissions if provided
    permissions.forEach(perm => {
      user.permissions[perm] = true;
    });

    // Log the action
    const actionId = uuidv4();
    const action = {
      id: actionId,
      actionType: 'promote_moderator',
      moderatorId: adminId,
      targetUserId: userId,
      reason: 'User promoted to moderator',
      metadata: { permissions },
      createdAt: new Date().toISOString()
    };
    moderationActions.set(actionId, action);

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // Demote moderator to regular user
  demoteModerator(adminId, userId, reason) {
    const admin = this.users.get(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const user = this.users.get(userId);
    if (!user || user.role !== 'moderator') {
      throw new Error('Moderator not found');
    }

    // Update user role
    user.role = 'user';
    user.permissions = {};

    // Log the action
    const actionId = uuidv4();
    const action = {
      id: actionId,
      actionType: 'demote_moderator',
      moderatorId: adminId,
      targetUserId: userId,
      reason,
      metadata: {},
      createdAt: new Date().toISOString()
    };
    moderationActions.set(actionId, action);

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // Get moderation reports
  getReports(filter = {}) {
    const reports = [];
    for (const [id, report] of userReports) {
      let include = true;

      if (filter.status && report.status !== filter.status) {
        include = false;
      }
      if (filter.reportType && report.reportType !== filter.reportType) {
        include = false;
      }
      if (filter.reporterId && report.reporterId !== filter.reporterId) {
        include = false;
      }
      if (filter.reportedUserId && report.reportedUserId !== filter.reportedUserId) {
        include = false;
      }

      if (include) {
        reports.push(report);
      }
    }
    return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Create a new report
  createReport(reporterId, reportData) {
    const reportId = uuidv4();
    const report = {
      id: reportId,
      reporterId,
      reportedUserId: reportData.reportedUserId || null,
      reportedMessageId: reportData.reportedMessageId || null,
      reportType: reportData.reportType || 'other',
      description: reportData.description,
      status: 'pending',
      resolution: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    userReports.set(reportId, report);
    return report;
  }

  // Perform moderation action
  performAction(moderatorId, actionData) {
    const moderator = this.users.get(moderatorId);
    if (!moderator || (moderator.role !== 'moderator' && moderator.role !== 'admin')) {
      throw new Error('Unauthorized: Moderator access required');
    }

    // Perform the action based on type
    switch (actionData.actionType) {
    case 'ban':
      if (actionData.targetUserId) {
        const user = this.users.get(actionData.targetUserId);
        if (user) {
          const durationMinutes = actionData.durationMinutes || 10080; // Default 7 days
          user.bannedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
          user.banReason = actionData.reason;
        }
      }
      break;

    case 'unban':
      if (actionData.targetUserId) {
        const user = this.users.get(actionData.targetUserId);
        if (user) {
          user.bannedUntil = null;
          user.banReason = null;
        }
      }
      break;

    case 'warn':
      if (actionData.targetUserId) {
        const user = this.users.get(actionData.targetUserId);
        if (user) {
          user.warningCount = (user.warningCount || 0) + 1;
        }
      }
      break;

            // Add more action types as needed
    }

    // Log the moderation action
    const actionId = uuidv4();
    const action = {
      id: actionId,
      actionType: actionData.actionType,
      moderatorId,
      targetUserId: actionData.targetUserId || null,
      targetMessageId: actionData.targetMessageId || null,
      targetRoomId: actionData.targetRoomId || null,
      reason: actionData.reason,
      durationMinutes: actionData.durationMinutes || null,
      metadata: actionData.metadata || {},
      createdAt: new Date().toISOString()
    };

    moderationActions.set(actionId, action);
    return action;
  }

  // Get moderation logs
  getModerationLogs(filter = {}) {
    const logs = [];
    for (const [id, action] of moderationActions) {
      let include = true;

      if (filter.moderatorId && action.moderatorId !== filter.moderatorId) {
        include = false;
      }
      if (filter.targetUserId && action.targetUserId !== filter.targetUserId) {
        include = false;
      }
      if (filter.actionType && action.actionType !== filter.actionType) {
        include = false;
      }
      if (filter.fromDate && new Date(action.createdAt) < new Date(filter.fromDate)) {
        include = false;
      }
      if (filter.toDate && new Date(action.createdAt) > new Date(filter.toDate)) {
        include = false;
      }

      if (include) {
        logs.push(action);
      }
    }
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Resolve a report
  resolveReport(moderatorId, reportId, resolution, actionTaken = null) {
    const moderator = this.users.get(moderatorId);
    if (!moderator || (moderator.role !== 'moderator' && moderator.role !== 'admin')) {
      throw new Error('Unauthorized: Moderator access required');
    }

    const report = userReports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Update the report
    report.status = 'resolved';
    report.resolution = resolution;
    report.resolvedBy = moderatorId;
    report.resolvedAt = new Date().toISOString();
    report.updatedAt = new Date().toISOString();

    // If action was taken, perform it
    if (actionTaken && report.reportedUserId) {
      this.performAction(moderatorId, {
        actionType: actionTaken,
        targetUserId: report.reportedUserId,
        targetMessageId: report.reportedMessageId,
        reason: `Action taken for report: ${resolution}`,
        durationMinutes: null
      });
    }

    return report;
  }
}

module.exports = new ModerationService();
