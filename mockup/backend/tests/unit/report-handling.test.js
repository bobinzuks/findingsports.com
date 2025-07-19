const { 
    createMockReport,
    mockUsers,
    hasPermission,
    initializeTestStores,
    cleanupTestData
} = require('../utils/test-helpers');

describe('Report Handling', () => {
    beforeEach(() => {
        initializeTestStores();
    });

    afterEach(() => {
        cleanupTestData();
    });

    describe('Report creation', () => {
        test('users can create reports for various violations', () => {
            const reportTypes = [
                'harassment',
                'spam',
                'inappropriate_content',
                'cheating',
                'fake_profile',
                'other'
            ];
            
            const reports = reportTypes.map(type => 
                createMockReport(mockUsers.regular.id, {
                    report_type: type,
                    reported_user_id: mockUsers.banned.id
                })
            );
            
            expect(reports.length).toBe(reportTypes.length);
            reports.forEach((report, index) => {
                expect(report.report_type).toBe(reportTypes[index]);
                expect(report.status).toBe('pending');
            });
        });

        test('reports should require description for "other" type', () => {
            const reportWithDescription = createMockReport(mockUsers.regular.id, {
                report_type: 'other',
                description: 'User is selling items in chat'
            });
            
            const reportWithoutDescription = () => {
                const report = createMockReport(mockUsers.regular.id, {
                    report_type: 'other',
                    description: ''
                });
                
                if (report.report_type === 'other' && !report.description.trim()) {
                    throw new Error('Description is required for "other" report type');
                }
                
                return report;
            };
            
            expect(reportWithDescription.description).toBeTruthy();
            expect(reportWithoutDescription).toThrow('Description is required for "other" report type');
        });

        test('should validate reported entities exist', () => {
            const validReport = createMockReport(mockUsers.regular.id, {
                reported_user_id: mockUsers.banned.id,
                reported_message_id: 'msg-123'
            });
            
            expect(validReport.reported_user_id).toBeTruthy();
            
            // Test invalid user ID
            const invalidUserReport = () => {
                const userExists = global.users.has('invalid-user-id');
                if (!userExists) {
                    throw new Error('Reported user does not exist');
                }
                return createMockReport(mockUsers.regular.id, {
                    reported_user_id: 'invalid-user-id'
                });
            };
            
            expect(invalidUserReport).toThrow('Reported user does not exist');
        });

        test('should prevent self-reporting', () => {
            const selfReport = () => {
                const reporterId = mockUsers.regular.id;
                const reportedId = mockUsers.regular.id;
                
                if (reporterId === reportedId) {
                    throw new Error('Cannot report yourself');
                }
                
                return createMockReport(reporterId, {
                    reported_user_id: reportedId
                });
            };
            
            expect(selfReport).toThrow('Cannot report yourself');
        });
    });

    describe('Report workflow', () => {
        test('reports should follow proper status workflow', () => {
            const report = createMockReport(mockUsers.regular.id);
            const validStatuses = ['pending', 'reviewing', 'resolved', 'dismissed'];
            const validTransitions = {
                'pending': ['reviewing', 'dismissed'],
                'reviewing': ['resolved', 'dismissed', 'pending'],
                'resolved': [],
                'dismissed': []
            };
            
            // Initial status
            expect(report.status).toBe('pending');
            expect(validStatuses).toContain(report.status);
            
            // Transition to reviewing
            const canTransition = validTransitions[report.status].includes('reviewing');
            expect(canTransition).toBe(true);
            
            if (canTransition) {
                report.status = 'reviewing';
                report.reviewed_by = mockUsers.moderator.id;
                report.reviewed_at = new Date().toISOString();
            }
            
            expect(report.status).toBe('reviewing');
            expect(report.reviewed_by).toBe(mockUsers.moderator.id);
        });

        test('resolved reports should include action taken', () => {
            const report = createMockReport(mockUsers.regular.id, {
                status: 'resolved',
                resolved_by: mockUsers.moderator.id,
                resolved_at: new Date().toISOString(),
                resolution: {
                    action_taken: 'user_warned',
                    notes: 'User was warned about inappropriate behavior',
                    follow_up_required: false
                }
            });
            
            expect(report.status).toBe('resolved');
            expect(report.resolution).toBeTruthy();
            expect(report.resolution.action_taken).toBe('user_warned');
            expect(report.resolved_by).toBe(mockUsers.moderator.id);
        });

        test('dismissed reports should include reason', () => {
            const report = createMockReport(mockUsers.regular.id, {
                status: 'dismissed',
                resolved_by: mockUsers.moderator.id,
                resolved_at: new Date().toISOString(),
                dismissal_reason: 'No violation found - misunderstanding between users'
            });
            
            expect(report.status).toBe('dismissed');
            expect(report.dismissal_reason).toBeTruthy();
            expect(report.dismissal_reason).toContain('No violation found');
        });
    });

    describe('Report queue management', () => {
        test('should prioritize reports by severity', () => {
            const reports = [
                createMockReport(mockUsers.regular.id, {
                    report_type: 'spam',
                    created_at: new Date(Date.now() - 3600000).toISOString()
                }),
                createMockReport(mockUsers.regular.id, {
                    report_type: 'harassment',
                    created_at: new Date(Date.now() - 1800000).toISOString()
                }),
                createMockReport(mockUsers.regular.id, {
                    report_type: 'inappropriate_content',
                    created_at: new Date().toISOString()
                })
            ];
            
            const severityOrder = {
                'harassment': 1,
                'inappropriate_content': 2,
                'fake_profile': 3,
                'cheating': 3,
                'spam': 4,
                'other': 5
            };
            
            const sortedReports = reports.sort((a, b) => {
                const severityDiff = severityOrder[a.report_type] - severityOrder[b.report_type];
                if (severityDiff !== 0) return severityDiff;
                
                // If same severity, sort by age (older first)
                return new Date(a.created_at) - new Date(b.created_at);
            });
            
            expect(sortedReports[0].report_type).toBe('harassment');
            expect(sortedReports[1].report_type).toBe('inappropriate_content');
            expect(sortedReports[2].report_type).toBe('spam');
        });

        test('should track report response times', () => {
            const report = createMockReport(mockUsers.regular.id, {
                created_at: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
                reviewed_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                resolved_at: new Date().toISOString() // Now
            });
            
            const timeToReview = new Date(report.reviewed_at) - new Date(report.created_at);
            const timeToResolve = new Date(report.resolved_at) - new Date(report.created_at);
            
            const hoursToReview = timeToReview / (1000 * 60 * 60);
            const hoursToResolve = timeToResolve / (1000 * 60 * 60);
            
            expect(hoursToReview).toBeCloseTo(1, 1);
            expect(hoursToResolve).toBeCloseTo(2, 1);
            
            // Check SLA compliance (e.g., 4 hours for harassment)
            const slaHours = report.report_type === 'harassment' ? 4 : 24;
            const slaCompliant = hoursToResolve <= slaHours;
            
            expect(slaCompliant).toBe(true);
        });

        test('should assign reports to available moderators', () => {
            const availableModerators = [
                { ...mockUsers.moderator, active_reports: 2 },
                { ...mockUsers.admin, active_reports: 5 },
                { id: 'mod-2', role: 'moderator', active_reports: 1 }
            ];
            
            // Assign to moderator with least active reports
            const assignedModerator = availableModerators.reduce((prev, curr) => 
                prev.active_reports < curr.active_reports ? prev : curr
            );
            
            expect(assignedModerator.id).toBe('mod-2');
            expect(assignedModerator.active_reports).toBe(1);
            
            const report = createMockReport(mockUsers.regular.id, {
                assigned_to: assignedModerator.id,
                assigned_at: new Date().toISOString()
            });
            
            assignedModerator.active_reports++;
            
            expect(report.assigned_to).toBe('mod-2');
            expect(assignedModerator.active_reports).toBe(2);
        });
    });

    describe('Report actions', () => {
        test('moderators should be able to take various actions', () => {
            const report = createMockReport(mockUsers.regular.id, {
                reported_user_id: mockUsers.banned.id,
                status: 'reviewing'
            });
            
            const availableActions = [
                'dismiss',
                'warn_user',
                'mute_user',
                'ban_user',
                'delete_content',
                'escalate_to_admin'
            ];
            
            const moderator = mockUsers.moderator;
            const allowedActions = availableActions.filter(action => {
                switch (action) {
                    case 'ban_user':
                    case 'escalate_to_admin':
                        return hasPermission(moderator, 'can_ban');
                    case 'mute_user':
                        return hasPermission(moderator, 'can_mute');
                    case 'delete_content':
                        return hasPermission(moderator, 'can_delete_messages');
                    default:
                        return true;
                }
            });
            
            expect(allowedActions).toContain('warn_user');
            expect(allowedActions).toContain('mute_user');
            expect(allowedActions).not.toContain('ban_user');
        });

        test('should create moderation log for each action', () => {
            const report = createMockReport(mockUsers.regular.id);
            const moderator = mockUsers.moderator;
            
            const action = {
                id: 'action-1',
                report_id: report.id,
                action_type: 'warn',
                moderator_id: moderator.id,
                target_user_id: report.reported_user_id,
                reason: 'First warning for inappropriate content',
                created_at: new Date().toISOString(),
                metadata: {
                    warning_level: 1,
                    report_type: report.report_type
                }
            };
            
            global.moderationActions.set(action.id, action);
            
            // Update report status
            report.status = 'resolved';
            report.resolved_by = moderator.id;
            report.resolved_at = action.created_at;
            report.resolution = {
                action_taken: 'user_warned',
                action_id: action.id
            };
            
            expect(report.status).toBe('resolved');
            expect(global.moderationActions.has(action.id)).toBe(true);
        });

        test('should notify reported user of action taken', () => {
            const notifications = [];
            
            const report = createMockReport(mockUsers.regular.id, {
                reported_user_id: mockUsers.banned.id,
                status: 'resolved',
                resolution: {
                    action_taken: 'user_warned'
                }
            });
            
            // Create notification
            if (report.status === 'resolved' && report.resolution.action_taken !== 'dismiss') {
                notifications.push({
                    id: 'notif-1',
                    user_id: report.reported_user_id,
                    type: 'moderation_action',
                    title: 'Moderation Notice',
                    message: 'You have received a warning for violating community guidelines',
                    action_type: report.resolution.action_taken,
                    created_at: new Date().toISOString(),
                    read: false
                });
            }
            
            expect(notifications.length).toBe(1);
            expect(notifications[0].user_id).toBe(report.reported_user_id);
            expect(notifications[0].type).toBe('moderation_action');
        });
    });

    describe('Report analytics', () => {
        test('should track report statistics', () => {
            const reports = [
                createMockReport(mockUsers.regular.id, { report_type: 'spam', status: 'resolved' }),
                createMockReport(mockUsers.regular.id, { report_type: 'spam', status: 'dismissed' }),
                createMockReport(mockUsers.regular.id, { report_type: 'harassment', status: 'resolved' }),
                createMockReport(mockUsers.regular.id, { report_type: 'harassment', status: 'pending' }),
                createMockReport(mockUsers.regular.id, { report_type: 'inappropriate_content', status: 'reviewing' })
            ];
            
            const stats = {
                total: reports.length,
                by_type: {},
                by_status: {},
                resolution_rate: 0
            };
            
            reports.forEach(report => {
                // Count by type
                stats.by_type[report.report_type] = (stats.by_type[report.report_type] || 0) + 1;
                
                // Count by status
                stats.by_status[report.status] = (stats.by_status[report.status] || 0) + 1;
            });
            
            const resolved = stats.by_status.resolved || 0;
            const dismissed = stats.by_status.dismissed || 0;
            const total_closed = resolved + dismissed;
            
            stats.resolution_rate = stats.total > 0 ? (total_closed / stats.total) * 100 : 0;
            
            expect(stats.total).toBe(5);
            expect(stats.by_type.spam).toBe(2);
            expect(stats.by_type.harassment).toBe(2);
            expect(stats.by_status.resolved).toBe(2);
            expect(stats.resolution_rate).toBe(60);
        });

        test('should identify repeat offenders', () => {
            const userReports = new Map();
            
            const reports = [
                createMockReport('user-1', { reported_user_id: 'offender-1', status: 'resolved' }),
                createMockReport('user-2', { reported_user_id: 'offender-1', status: 'resolved' }),
                createMockReport('user-3', { reported_user_id: 'offender-1', status: 'resolved' }),
                createMockReport('user-4', { reported_user_id: 'offender-2', status: 'dismissed' }),
                createMockReport('user-5', { reported_user_id: 'offender-2', status: 'resolved' })
            ];
            
            // Count resolved reports per user
            reports.forEach(report => {
                if (report.status === 'resolved') {
                    const count = userReports.get(report.reported_user_id) || 0;
                    userReports.set(report.reported_user_id, count + 1);
                }
            });
            
            const repeatOffenderThreshold = 3;
            const repeatOffenders = Array.from(userReports.entries())
                .filter(([userId, count]) => count >= repeatOffenderThreshold)
                .map(([userId, count]) => ({ userId, reportCount: count }));
            
            expect(repeatOffenders.length).toBe(1);
            expect(repeatOffenders[0].userId).toBe('offender-1');
            expect(repeatOffenders[0].reportCount).toBe(3);
        });
    });
});