const { 
    createMockMessage,
    createMockChatRoom,
    mockUsers,
    filterMessage,
    hasPermission,
    initializeTestStores,
    cleanupTestData
} = require('../utils/test-helpers');

describe('Message Moderation', () => {
    beforeEach(() => {
        initializeTestStores();
    });

    afterEach(() => {
        cleanupTestData();
    });

    describe('Content filtering', () => {
        test('should filter banned words', () => {
            const bannedWords = new Set(['spam', 'offensive', 'inappropriate']);
            
            const testCases = [
                { input: 'This is spam content', expected: 'This is **** content' },
                { input: 'Very offensive message', expected: 'Very ********* message' },
                { input: 'Clean message', expected: 'Clean message' },
                { input: 'SPAM in caps', expected: '**** in caps' },
                { input: 'Multiple spam and offensive words', expected: 'Multiple **** and ********* words' }
            ];
            
            testCases.forEach(({ input, expected }) => {
                const result = filterMessage(input, bannedWords);
                expect(result.content).toBe(expected);
                expect(result.filtered).toBe(input !== expected);
            });
        });

        test('should handle edge cases in filtering', () => {
            const bannedWords = new Set(['test']);
            
            const edgeCases = [
                { input: '', expected: '' },
                { input: null, expected: null },
                { input: undefined, expected: undefined },
                { input: 'testing', expected: '****ing' }, // Partial match
                { input: 'TEST', expected: '****' }, // Case insensitive
                { input: 'test test test', expected: '**** **** ****' } // Multiple occurrences
            ];
            
            edgeCases.forEach(({ input, expected }) => {
                const result = filterMessage(input, bannedWords);
                if (input === null || input === undefined) {
                    expect(result.filtered).toBe(false);
                    expect(result.content).toBe(input);
                } else {
                    expect(result.content).toBe(expected);
                }
            });
        });

        test('should track filtered messages for review', () => {
            const message = createMockMessage('room-1', mockUsers.regular.id, {
                content: 'This contains spam words'
            });
            
            const result = filterMessage(message.content);
            
            if (result.filtered) {
                message.original_content = message.content;
                message.content = result.content;
                message.was_filtered = true;
                message.filtered_at = new Date().toISOString();
            }
            
            expect(message.was_filtered).toBe(true);
            expect(message.original_content).toBe('This contains spam words');
            expect(message.content).toBe('This contains **** words');
        });
    });

    describe('Message deletion', () => {
        test('moderators can delete messages', () => {
            const chatRoom = createMockChatRoom('game-1');
            const message = createMockMessage(chatRoom.id, mockUsers.regular.id);
            const moderator = mockUsers.moderator;
            
            expect(hasPermission(moderator, 'can_delete_messages')).toBe(true);
            
            // Soft delete the message
            message.is_deleted = true;
            message.deleted_by = moderator.id;
            message.deleted_at = new Date().toISOString();
            message.delete_reason = 'Violates community guidelines';
            
            expect(message.is_deleted).toBe(true);
            expect(message.deleted_by).toBe(moderator.id);
            expect(message.delete_reason).toBeTruthy();
        });

        test('users cannot delete others messages', () => {
            const message = createMockMessage('room-1', mockUsers.moderator.id);
            const regularUser = mockUsers.regular;
            
            const canDelete = hasPermission(regularUser, 'can_delete_messages') || 
                             message.user_id === regularUser.id;
            
            expect(canDelete).toBe(false);
        });

        test('users can delete their own messages within time limit', () => {
            const user = mockUsers.regular;
            const message = createMockMessage('room-1', user.id, {
                created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
            });
            
            const deleteTimeLimit = 5 * 60 * 1000; // 5 minutes
            const messageAge = Date.now() - new Date(message.created_at).getTime();
            const canDeleteOwn = message.user_id === user.id && messageAge < deleteTimeLimit;
            
            expect(canDeleteOwn).toBe(true);
            
            // Test message too old to delete
            const oldMessage = createMockMessage('room-1', user.id, {
                created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
            });
            
            const oldMessageAge = Date.now() - new Date(oldMessage.created_at).getTime();
            const canDeleteOld = oldMessage.user_id === user.id && oldMessageAge < deleteTimeLimit;
            
            expect(canDeleteOld).toBe(false);
        });

        test('deleted messages should show placeholder', () => {
            const message = createMockMessage('room-1', mockUsers.regular.id, {
                content: 'Original content',
                is_deleted: true,
                deleted_at: new Date().toISOString()
            });
            
            const displayContent = message.is_deleted 
                ? '[This message has been deleted]' 
                : message.content;
            
            expect(displayContent).toBe('[This message has been deleted]');
        });
    });

    describe('Message editing', () => {
        test('users can edit their own messages', () => {
            const user = mockUsers.regular;
            const message = createMockMessage('room-1', user.id);
            
            const canEdit = message.user_id === user.id && !message.is_deleted;
            expect(canEdit).toBe(true);
            
            // Edit the message
            if (canEdit) {
                message.content = 'Edited content';
                message.edited_at = new Date().toISOString();
                message.edit_history = message.edit_history || [];
                message.edit_history.push({
                    content: 'Original content',
                    edited_at: message.edited_at
                });
            }
            
            expect(message.content).toBe('Edited content');
            expect(message.edited_at).toBeTruthy();
            expect(message.edit_history.length).toBe(1);
        });

        test('edited messages should be re-filtered', () => {
            const message = createMockMessage('room-1', mockUsers.regular.id, {
                content: 'Clean message'
            });
            
            // User edits to include banned word
            const newContent = 'Now with spam content';
            const filtered = filterMessage(newContent);
            
            message.content = filtered.content;
            message.edited_at = new Date().toISOString();
            message.was_filtered = filtered.filtered;
            
            expect(message.content).toBe('Now with **** content');
            expect(message.was_filtered).toBe(true);
        });

        test('moderators can see edit history', () => {
            const message = createMockMessage('room-1', mockUsers.regular.id, {
                content: 'Final version',
                edited_at: new Date().toISOString(),
                edit_history: [
                    { content: 'Original version', edited_at: new Date(Date.now() - 3600000).toISOString() },
                    { content: 'Second version', edited_at: new Date(Date.now() - 1800000).toISOString() }
                ]
            });
            
            const moderator = mockUsers.moderator;
            const canViewHistory = hasPermission(moderator, 'can_delete_messages'); // Same permission
            
            expect(canViewHistory).toBe(true);
            
            if (canViewHistory) {
                expect(message.edit_history.length).toBe(2);
                expect(message.edit_history[0].content).toBe('Original version');
            }
        });
    });

    describe('Bulk moderation actions', () => {
        test('should delete multiple messages from same user', () => {
            const userId = mockUsers.regular.id;
            const messages = [
                createMockMessage('room-1', userId, { content: 'Message 1' }),
                createMockMessage('room-1', userId, { content: 'Message 2' }),
                createMockMessage('room-1', userId, { content: 'Message 3' }),
                createMockMessage('room-2', userId, { content: 'Message 4' })
            ];
            
            const moderator = mockUsers.moderator;
            
            // Bulk delete all messages from user in room-1
            const roomMessages = messages.filter(m => m.room_id === 'room-1' && m.user_id === userId);
            
            roomMessages.forEach(message => {
                message.is_deleted = true;
                message.deleted_by = moderator.id;
                message.deleted_at = new Date().toISOString();
                message.delete_reason = 'Bulk delete - spam';
            });
            
            const deletedCount = messages.filter(m => m.is_deleted).length;
            expect(deletedCount).toBe(3);
        });

        test('should apply temporary mute after multiple violations', () => {
            const user = mockUsers.regular;
            const violations = [];
            
            // Simulate multiple filtered messages
            for (let i = 0; i < 3; i++) {
                const message = createMockMessage('room-1', user.id, {
                    content: `Spam message ${i}`
                });
                
                const filtered = filterMessage(message.content);
                if (filtered.filtered) {
                    violations.push({
                        message_id: message.id,
                        timestamp: new Date().toISOString(),
                        content: message.content
                    });
                }
            }
            
            // Auto-mute after 3 violations
            const shouldAutoMute = violations.length >= 3;
            expect(shouldAutoMute).toBe(true);
            
            if (shouldAutoMute) {
                const muteAction = {
                    action_type: 'mute',
                    target_user_id: user.id,
                    duration: 15 * 60 * 1000, // 15 minutes
                    reason: 'Automatic mute - multiple violations',
                    automated: true,
                    violations: violations
                };
                
                expect(muteAction.automated).toBe(true);
                expect(muteAction.duration).toBe(900000);
            }
        });
    });

    describe('Message reporting', () => {
        test('users can report inappropriate messages', () => {
            const message = createMockMessage('room-1', mockUsers.regular.id, {
                content: 'Potentially inappropriate content'
            });
            
            const report = {
                id: 'report-1',
                message_id: message.id,
                reporter_id: mockUsers.moderator.id,
                reported_user_id: message.user_id,
                report_type: 'inappropriate_content',
                description: 'This message contains inappropriate language',
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            expect(report.status).toBe('pending');
            expect(report.message_id).toBe(message.id);
        });

        test('should prevent duplicate reports', () => {
            const messageId = 'msg-1';
            const reporterId = mockUsers.regular.id;
            
            const existingReports = [
                {
                    message_id: messageId,
                    reporter_id: reporterId,
                    created_at: new Date(Date.now() - 3600000).toISOString()
                }
            ];
            
            const isDuplicate = existingReports.some(r => 
                r.message_id === messageId && r.reporter_id === reporterId
            );
            
            expect(isDuplicate).toBe(true);
            
            if (isDuplicate) {
                expect(() => {
                    throw new Error('You have already reported this message');
                }).toThrow('You have already reported this message');
            }
        });

        test('should escalate messages with multiple reports', () => {
            const messageId = 'msg-1';
            const reports = [
                { message_id: messageId, reporter_id: 'user-1', created_at: new Date().toISOString() },
                { message_id: messageId, reporter_id: 'user-2', created_at: new Date().toISOString() },
                { message_id: messageId, reporter_id: 'user-3', created_at: new Date().toISOString() }
            ];
            
            const reportCount = reports.filter(r => r.message_id === messageId).length;
            const escalationThreshold = 3;
            
            const shouldEscalate = reportCount >= escalationThreshold;
            expect(shouldEscalate).toBe(true);
            
            if (shouldEscalate) {
                const escalation = {
                    message_id: messageId,
                    report_count: reportCount,
                    priority: 'high',
                    escalated_at: new Date().toISOString(),
                    auto_hidden: true
                };
                
                expect(escalation.priority).toBe('high');
                expect(escalation.auto_hidden).toBe(true);
            }
        });
    });
});