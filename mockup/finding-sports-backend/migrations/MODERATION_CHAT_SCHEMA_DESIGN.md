# Moderation and Chat System Database Schema Design

## Overview

This document describes the database schema additions for implementing a comprehensive moderation and chat system for the Finding Sports application. The design supports temporary game-based chat rooms, user moderation, reporting systems, and automated content filtering.

## Schema Components

### 1. User Roles and Permissions

**Modified Tables:**
- `users` table extended with:
  - `role`: User role (user, moderator, admin)
  - `permissions`: JSONB for custom permissions
  - `banned_until`: Temporary ban expiration
  - `ban_reason`: Reason for ban
  - `warning_count`: Track user warnings

**New Tables:**
- `role_permissions`: Fine-grained permission control per role

**Design Decisions:**
- Three-tier role system (user, moderator, admin) for clear hierarchy
- JSONB permissions field allows custom permissions without schema changes
- Temporary bans with expiration timestamps
- Warning count for progressive discipline

### 2. Chat Room System

**Tables:**
- `chat_rooms`: Game-linked temporary chat rooms
- `chat_participants`: Track room membership and mute status

**Key Features:**
- One chat room per game (enforced by unique constraint)
- Auto-expiration 24 hours after game ends
- Participant tracking with join/leave timestamps
- Individual mute capabilities per participant

**Design Rationale:**
- Temporary chats reduce data storage requirements
- Game linkage ensures relevant context
- Automatic cleanup prevents database bloat

### 3. Message Storage

**Tables:**
- `chat_messages`: Store all chat messages
- `message_read_receipts`: Optional read tracking

**Features:**
- Support for message replies (parent_message_id)
- Soft delete with timestamp tracking
- Edit history with timestamps
- Message types (text, system, announcement)

**Performance Considerations:**
- Composite indexes on (room_id, created_at) for fast retrieval
- Partial indexes for active messages only
- Separate read receipts table to avoid message table bloat

### 4. Moderation System

**Tables:**
- `moderation_actions`: Comprehensive audit log
- `user_reports`: User-submitted reports
- `report_attachments`: Evidence storage

**Action Types:**
- warn, mute, kick, ban, unban, unmute
- delete_message, edit_message
- lock_chat, unlock_chat

**Design Features:**
- Complete audit trail with moderator tracking
- Flexible metadata storage for context
- Duration support for temporary actions
- Report status workflow (pending → reviewing → resolved)

### 5. Automated Moderation

**Tables:**
- `moderation_rules`: Configurable auto-mod rules
- `banned_words`: Prohibited content list

**Capabilities:**
- Pattern-based filtering (regex support)
- Severity levels for graduated responses
- Active/inactive flag for easy management
- Category grouping for banned words

### 6. Performance Optimizations

**Indexing Strategy:**
- Primary lookups: room_id, user_id, created_at
- Partial indexes for active records
- Covering indexes for common queries
- Strategic use of WHERE clauses in indexes

**Example Indexes:**
```sql
-- Active participants only
CREATE INDEX idx_chat_participants_active 
ON chat_participants(room_id, user_id) 
WHERE left_at IS NULL;

-- Pending reports for moderator queue
CREATE INDEX idx_user_reports_pending 
ON user_reports(created_at) 
WHERE status = 'pending';
```

### 7. Data Retention and Cleanup

**Automatic Processes:**
- Chat rooms expire after game_end + 24 hours
- Cleanup function for old messages (30-day retention)
- Trigger-based expiration setting

**Manual Processes:**
- Periodic cleanup of resolved reports
- Archive old moderation actions
- Review and update banned words list

## Query Examples

### Get active chat participants
```sql
SELECT u.username, u.avatar_url, cp.joined_at
FROM chat_participants cp
JOIN users u ON cp.user_id = u.id
WHERE cp.room_id = ? 
  AND cp.left_at IS NULL
  AND cp.is_muted = false;
```

### Get recent messages with user info
```sql
SELECT 
    m.id,
    m.content,
    m.created_at,
    u.username,
    u.avatar_url,
    parent.content as reply_to
FROM chat_messages m
JOIN users u ON m.user_id = u.id
LEFT JOIN chat_messages parent ON m.parent_message_id = parent.id
WHERE m.room_id = ?
  AND m.is_deleted = false
ORDER BY m.created_at DESC
LIMIT 50;
```

### Get moderation queue
```sql
SELECT 
    r.id,
    r.report_type,
    r.description,
    r.created_at,
    reporter.username as reporter_name,
    reported.username as reported_name
FROM user_reports r
JOIN users reporter ON r.reporter_id = reporter.id
LEFT JOIN users reported ON r.reported_user_id = reported.id
WHERE r.status = 'pending'
ORDER BY r.created_at ASC;
```

### Check user permissions
```sql
SELECT DISTINCT permission, resource
FROM role_permissions
WHERE role = (SELECT role FROM users WHERE id = ?)
   OR role = 'user';  -- Include base permissions
```

## Security Considerations

1. **Row-Level Security**: Consider implementing RLS policies for multi-tenant scenarios
2. **Input Validation**: Message content should be validated before storage
3. **Rate Limiting**: Implement at application level to prevent spam
4. **Encryption**: Consider encrypting sensitive report data
5. **Access Control**: Enforce permission checks at API level

## Migration Notes

1. Run migration in transaction for atomicity
2. Default permissions are inserted automatically
3. Existing users get 'user' role by default
4. Consider running ANALYZE after migration for query planning

## Future Enhancements

1. **Message Reactions**: Add emoji reactions table
2. **File Uploads**: Support for image/video messages
3. **Voice Notes**: Audio message support
4. **Translation**: Multi-language message support
5. **AI Moderation**: Integration points for ML-based content filtering
6. **Shadow Banning**: Soft moderation capabilities
7. **Reputation System**: User trust scores based on behavior