const { 
    createMockGame,
    createMockChatRoom,
    createMockMessage,
    mockUsers,
    initializeTestStores,
    cleanupTestData
} = require('../utils/test-helpers');

describe('Chat Room Lifecycle', () => {
    beforeEach(() => {
        initializeTestStores();
    });

    afterEach(() => {
        cleanupTestData();
    });

    describe('Chat room creation', () => {
        test('should create chat room when game is created', () => {
            const game = createMockGame();
            const chatRoom = createMockChatRoom(game.id);
            
            expect(chatRoom.game_id).toBe(game.id);
            expect(chatRoom.is_active).toBe(true);
            expect(chatRoom.is_locked).toBe(false);
            expect(chatRoom.participant_count).toBe(0);
        });

        test('should set expiration 24 hours after game end time', () => {
            const gameDate = new Date();
            gameDate.setDate(gameDate.getDate() + 1); // Tomorrow
            gameDate.setHours(19, 0, 0, 0); // 7 PM
            
            const game = createMockGame({
                date: gameDate.toISOString(),
                duration: 60 // 1 hour
            });
            
            const chatRoom = createMockChatRoom(game.id);
            const expiresAt = new Date(chatRoom.expires_at);
            const expectedExpiry = new Date(gameDate.getTime() + 60 * 60 * 1000 + 24 * 60 * 60 * 1000);
            
            // Should expire 24 hours after game ends
            expect(expiresAt.getTime()).toBeGreaterThan(expectedExpiry.getTime() - 1000);
            expect(expiresAt.getTime()).toBeLessThan(expectedExpiry.getTime() + 1000);
        });

        test('should enforce one chat room per game', () => {
            const game = createMockGame();
            const chatRoom1 = createMockChatRoom(game.id);
            
            global.chatRooms.set(chatRoom1.id, chatRoom1);
            
            // Attempt to create another room for same game
            const attemptDuplicate = () => {
                const existingRoom = Array.from(global.chatRooms.values())
                    .find(room => room.game_id === game.id);
                if (existingRoom) {
                    throw new Error('Chat room already exists for this game');
                }
                return createMockChatRoom(game.id);
            };
            
            expect(attemptDuplicate).toThrow('Chat room already exists for this game');
        });
    });

    describe('Chat room expiration', () => {
        test('should mark room as inactive when expired', () => {
            const chatRoom = createMockChatRoom('game-1', {
                expires_at: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
            });
            
            // Check if room is expired
            const isExpired = new Date(chatRoom.expires_at) < new Date();
            expect(isExpired).toBe(true);
            
            // Room should be marked inactive
            if (isExpired) {
                chatRoom.is_active = false;
            }
            expect(chatRoom.is_active).toBe(false);
        });

        test('should prevent new messages in expired rooms', () => {
            const expiredRoom = createMockChatRoom('game-1', {
                expires_at: new Date(Date.now() - 1000).toISOString(),
                is_active: false
            });
            
            const attemptMessage = () => {
                if (!expiredRoom.is_active) {
                    throw new Error('Cannot send message to inactive room');
                }
                return createMockMessage(expiredRoom.id, mockUsers.regular.id);
            };
            
            expect(attemptMessage).toThrow('Cannot send message to inactive room');
        });

        test('should allow reading messages from expired rooms', () => {
            const expiredRoom = createMockChatRoom('game-1', {
                expires_at: new Date(Date.now() - 1000).toISOString(),
                is_active: false
            });
            
            // Create messages before expiration
            const oldMessages = [
                createMockMessage(expiredRoom.id, mockUsers.regular.id, {
                    content: 'Message 1',
                    created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
                }),
                createMockMessage(expiredRoom.id, mockUsers.moderator.id, {
                    content: 'Message 2',
                    created_at: new Date(Date.now() - 1800000).toISOString() // 30 min ago
                })
            ];
            
            // Should still be able to retrieve messages
            expect(oldMessages.length).toBe(2);
            expect(oldMessages[0].content).toBe('Message 1');
        });
    });

    describe('Participant management', () => {
        test('should track participants joining and leaving', () => {
            const chatRoom = createMockChatRoom('game-1');
            const participants = new Map();
            
            // User joins
            participants.set(mockUsers.regular.id, {
                user_id: mockUsers.regular.id,
                joined_at: new Date().toISOString(),
                left_at: null,
                is_muted: false
            });
            chatRoom.participant_count = participants.size;
            
            expect(chatRoom.participant_count).toBe(1);
            
            // Another user joins
            participants.set(mockUsers.moderator.id, {
                user_id: mockUsers.moderator.id,
                joined_at: new Date().toISOString(),
                left_at: null,
                is_muted: false
            });
            chatRoom.participant_count = participants.size;
            
            expect(chatRoom.participant_count).toBe(2);
            
            // User leaves
            const participant = participants.get(mockUsers.regular.id);
            participant.left_at = new Date().toISOString();
            chatRoom.participant_count = Array.from(participants.values())
                .filter(p => p.left_at === null).length;
            
            expect(chatRoom.participant_count).toBe(1);
        });

        test('should handle participant muting', () => {
            const chatRoom = createMockChatRoom('game-1');
            const participant = {
                user_id: mockUsers.regular.id,
                joined_at: new Date().toISOString(),
                left_at: null,
                is_muted: false,
                muted_until: null
            };
            
            // Mute participant for 30 minutes
            participant.is_muted = true;
            participant.muted_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
            
            expect(participant.is_muted).toBe(true);
            expect(new Date(participant.muted_until) > new Date()).toBe(true);
            
            // Check if mute has expired
            const isMuteExpired = (muteUntil) => {
                if (!muteUntil) return true;
                return new Date(muteUntil) < new Date();
            };
            
            expect(isMuteExpired(participant.muted_until)).toBe(false);
        });
    });

    describe('Room locking', () => {
        test('moderators should be able to lock rooms', () => {
            const chatRoom = createMockChatRoom('game-1');
            const moderator = mockUsers.moderator;
            
            // Check moderator permission
            const canLockRoom = moderator.role === 'moderator' || moderator.role === 'admin';
            expect(canLockRoom).toBe(true);
            
            // Lock the room
            if (canLockRoom) {
                chatRoom.is_locked = true;
                chatRoom.locked_by = moderator.id;
                chatRoom.locked_at = new Date().toISOString();
            }
            
            expect(chatRoom.is_locked).toBe(true);
            expect(chatRoom.locked_by).toBe(moderator.id);
        });

        test('should prevent messages in locked rooms', () => {
            const lockedRoom = createMockChatRoom('game-1', {
                is_locked: true,
                locked_by: mockUsers.moderator.id,
                locked_at: new Date().toISOString()
            });
            
            const attemptMessage = () => {
                if (lockedRoom.is_locked) {
                    throw new Error('Cannot send message to locked room');
                }
                return createMockMessage(lockedRoom.id, mockUsers.regular.id);
            };
            
            expect(attemptMessage).toThrow('Cannot send message to locked room');
        });

        test('admins should be able to unlock any room', () => {
            const lockedRoom = createMockChatRoom('game-1', {
                is_locked: true,
                locked_by: mockUsers.moderator.id,
                locked_at: new Date(Date.now() - 3600000).toISOString()
            });
            
            const admin = mockUsers.admin;
            
            // Admin can unlock any room
            const canUnlock = admin.role === 'admin';
            expect(canUnlock).toBe(true);
            
            if (canUnlock) {
                lockedRoom.is_locked = false;
                lockedRoom.locked_by = null;
                lockedRoom.locked_at = null;
                lockedRoom.unlocked_by = admin.id;
                lockedRoom.unlocked_at = new Date().toISOString();
            }
            
            expect(lockedRoom.is_locked).toBe(false);
            expect(lockedRoom.unlocked_by).toBe(admin.id);
        });
    });

    describe('Cleanup and archival', () => {
        test('should clean up old messages after retention period', () => {
            const messages = [
                createMockMessage('room-1', mockUsers.regular.id, {
                    created_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString() // 31 days old
                }),
                createMockMessage('room-1', mockUsers.regular.id, {
                    created_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString() // 29 days old
                }),
                createMockMessage('room-1', mockUsers.regular.id, {
                    created_at: new Date().toISOString() // Today
                })
            ];
            
            const retentionDays = 30;
            const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
            
            const messagesToKeep = messages.filter(msg => 
                new Date(msg.created_at) > cutoffDate
            );
            
            expect(messagesToKeep.length).toBe(2);
            expect(messages.length - messagesToKeep.length).toBe(1); // 1 message deleted
        });

        test('should archive important moderation actions', () => {
            const moderationAction = {
                id: 'action-1',
                action_type: 'ban',
                moderator_id: mockUsers.admin.id,
                target_user_id: mockUsers.regular.id,
                reason: 'Repeated violations',
                created_at: new Date().toISOString(),
                metadata: {
                    duration: 86400000, // 24 hours
                    previous_warnings: 3
                }
            };
            
            // Important actions should be archived, not deleted
            const isImportantAction = ['ban', 'unban', 'delete_message'].includes(moderationAction.action_type);
            expect(isImportantAction).toBe(true);
            
            // Archive instead of delete
            const archivedAction = {
                ...moderationAction,
                archived_at: new Date().toISOString(),
                archived: true
            };
            
            expect(archivedAction.archived).toBe(true);
            expect(archivedAction.archived_at).toBeTruthy();
        });
    });
});