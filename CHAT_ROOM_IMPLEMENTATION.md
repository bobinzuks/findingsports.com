# Game Chat Room Implementation

## Overview

This implementation provides temporary chat rooms for games with the following features:

- **Auto-creation**: Chat rooms are automatically created when games are created
- **24-hour expiration**: Rooms expire 24 hours after the game ends
- **Real-time messaging**: Socket.IO powered real-time communication
- **Moderation**: Built-in moderation capabilities
- **Message persistence**: Messages are stored and can be retrieved
- **User management**: Track participants and handle join/leave events

## Architecture

### Backend Components

#### 1. Chat Room Service (`/mockup/backend/services/chat-room-service.js`)
- Manages chat room lifecycle
- Handles message storage and retrieval
- Implements moderation actions
- Manages participant tracking
- Handles room expiration and cleanup

#### 2. Game Chat Routes (`/mockup/backend/routes/game-chat.js`)
- RESTful API endpoints for chat operations
- Authentication and authorization
- Message CRUD operations
- Moderation endpoints

#### 3. WebSocket Service Updates
- Real-time message delivery
- Typing indicators
- User presence tracking
- Moderation notifications

#### 4. Scheduler Service (`/mockup/backend/services/scheduler.js`)
- Automatic cleanup of expired rooms
- Runs hourly cleanup tasks
- Maintains system performance

### Database Schema

The implementation uses the existing schema from `/mockup/finding-sports-backend/migrations/20240106_000002_moderation_chat_schema.sql`:

- `chat_rooms`: Stores room information linked to games
- `chat_participants`: Tracks room membership
- `chat_messages`: Stores message content and metadata
- `moderation_actions`: Logs all moderation activities
- `user_reports`: Handles message/user reporting

## API Endpoints

### Chat Room Management

#### Get Chat Room Info
```
GET /api/games/:gameId/chat
```
Returns chat room information for a specific game.

#### Join Chat Room
```
POST /api/games/:gameId/chat/join
Authorization: Bearer <token>
```
Joins the chat room for a game. Creates room if it doesn't exist.

#### Leave Chat Room
```
POST /api/games/:gameId/chat/leave
Authorization: Bearer <token>
```
Leaves the chat room.

### Messaging

#### Get Messages
```
GET /api/games/:gameId/chat/messages?limit=50&before=<messageId>
Authorization: Bearer <token>
```
Retrieves message history with pagination.

#### Send Message
```
POST /api/games/:gameId/chat/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Message text",
  "parentMessageId": null // Optional, for replies
}
```

#### Delete Message
```
DELETE /api/games/:gameId/chat/messages/:messageId
Authorization: Bearer <token>
```

### Moderation

#### Report Message
```
POST /api/games/:gameId/chat/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "messageId": "uuid",
  "userId": "reported-user-id",
  "reportType": "spam|harassment|inappropriate_content|other",
  "description": "Report details"
}
```

#### Moderate User (Moderators Only)
```
POST /api/games/:gameId/chat/moderate
Authorization: Bearer <token>
Content-Type: application/json

{
  "actionType": "mute|kick|ban",
  "targetUserId": "user-id",
  "reason": "Moderation reason",
  "durationMinutes": 30 // Optional
}
```

## Socket.IO Events

### Client to Server

- `join-game-chat`: Join a game's chat room
- `leave-game-chat`: Leave a game's chat room
- `game-chat-typing`: User is typing
- `game-chat-stop-typing`: User stopped typing

### Server to Client

- `joined-game-chat`: Confirmation of joining
- `left-game-chat`: Confirmation of leaving
- `chat-message`: New message in room
- `message-deleted`: Message was deleted
- `user-typing`: Another user is typing
- `user-stopped-typing`: User stopped typing
- `kicked_from_chat`: User was kicked
- `muted_in_chat`: User was muted

## Frontend Integration

### JavaScript Client (`/mockup/js/game-chat.js`)

The `GameChatManager` class provides:
- Socket.IO integration
- Message sending/receiving
- Typing indicators
- Moderation actions
- Error handling
- UI helpers

### Usage Example

```javascript
// Initialize
const socket = io();
gameChat.initialize(socket);

// Join a game chat
await gameChat.joinGameChat('game123');

// Send a message
await gameChat.sendMessage('Hello everyone!');

// Leave chat
await gameChat.leaveGameChat();
```

## Security Features

1. **Authentication Required**: All chat operations require valid JWT token
2. **Participant Validation**: Only game participants can access chat
3. **Message Sanitization**: HTML is escaped to prevent XSS
4. **Rate Limiting**: Can be added to prevent spam
5. **Moderation Tools**: Report, mute, kick, and ban capabilities
6. **Automatic Cleanup**: Expired rooms are cleaned up automatically

## Room Lifecycle

1. **Creation**: Room created when game is created
2. **Joining**: Players join when they join the game
3. **Active Period**: Room active during game + 24 hours
4. **Expiration**: Room marked inactive after expiry
5. **Cleanup**: Room and messages deleted 7 days after expiry

## Testing

A demo page is available at `/mockup/game-chat-demo.html` that demonstrates:
- Joining/leaving chat rooms
- Sending/receiving messages
- Typing indicators
- Message deletion
- Basic moderation features

To test:
1. Start the backend server
2. Open the demo page
3. Click "Join Game 123 Chat"
4. Send test messages
5. Try different features

## Future Enhancements

1. **File Uploads**: Support for images and attachments
2. **Voice Messages**: Audio message support
3. **Reactions**: Emoji reactions to messages
4. **Rich Text**: Markdown or formatted text support
5. **Push Notifications**: Notify users of new messages
6. **Analytics**: Chat activity metrics
7. **AI Moderation**: Automatic content filtering
8. **Translation**: Multi-language support

## Maintenance

- Monitor chat room usage and adjust cleanup schedules
- Review moderation reports regularly
- Update banned words list as needed
- Monitor performance and optimize as needed
- Regular security audits of chat functionality