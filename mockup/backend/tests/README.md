# Finding Sports Social Features Test Suite

## Overview

This test suite provides comprehensive coverage for the social features including moderation, chat rooms, message handling, and report management. The tests focus on security, edge cases, and proper enforcement of permissions.

## Test Structure

```
tests/
├── unit/                           # Unit tests for individual components
│   ├── moderation-permissions.test.js    # Role-based permission tests
│   ├── chat-room-lifecycle.test.js       # Chat room creation, expiration, locking
│   ├── message-moderation.test.js        # Message filtering, deletion, editing
│   ├── report-handling.test.js           # Report workflow and analytics
│   └── websocket-events.test.js          # WebSocket event handling
├── integration/                    # Integration tests
│   ├── moderation-endpoints.test.js      # API endpoint security and functionality
│   └── security-tests.test.js            # Security-focused integration tests
├── utils/                          # Test utilities
│   └── test-helpers.js            # Mock data, helpers, and utilities
├── fixtures/                       # Test data fixtures (if needed)
├── setup.js                        # Jest setup file
└── README.md                       # This file
```

## Running Tests

### All Tests
```bash
npm test                    # Run all tests with coverage
npm run test:watch         # Run tests in watch mode
npm run test:ci           # Run tests in CI mode
```

### Specific Test Suites
```bash
npm run test:moderation    # Run moderation-related tests
npm run test:chat         # Run chat room tests
npm run test:security     # Run security tests
npm run test:websocket    # Run WebSocket tests
npm run test:reports      # Run report handling tests
```

### Unit vs Integration
```bash
npm run test:unit         # Run only unit tests
npm run test:integration  # Run only integration tests
```

## Test Coverage Areas

### 1. Moderation Permissions (`moderation-permissions.test.js`)
- **Role Hierarchy**: Regular users < Moderators < Admins
- **Permission Checks**: Validates each role's capabilities
- **Edge Cases**: Null users, missing permissions, role changes
- **JWT Integration**: Token generation with role information

### 2. Chat Room Lifecycle (`chat-room-lifecycle.test.js`)
- **Creation**: One room per game, proper expiration timing
- **Expiration**: 24 hours after game end, prevents new messages
- **Participants**: Join/leave tracking, mute functionality
- **Locking**: Moderator/admin room control
- **Cleanup**: Message retention, archival of important actions

### 3. Message Moderation (`message-moderation.test.js`)
- **Content Filtering**: Automated banned word detection
- **Message Deletion**: Soft delete with audit trail
- **Editing**: User edits with re-filtering
- **Bulk Actions**: Multiple message handling
- **Reporting**: User reports with duplicate prevention

### 4. Report Handling (`report-handling.test.js`)
- **Report Types**: Harassment, spam, inappropriate content, etc.
- **Workflow**: Pending → Reviewing → Resolved/Dismissed
- **Queue Management**: Priority-based sorting, SLA tracking
- **Actions**: Warn, mute, ban with proper logging
- **Analytics**: Statistics, repeat offender detection

### 5. WebSocket Events (`websocket-events.test.js`)
- **Authentication**: Token validation, banned user handling
- **Chat Events**: Join/leave, messages, typing indicators
- **Moderation Events**: Real-time updates for actions
- **Notifications**: Game updates, direct messages
- **Connection**: Disconnect handling, rate limiting

### 6. Security Integration (`security-tests.test.js`)
- **Authentication**: Ban enforcement, token validation
- **Rate Limiting**: Per-user limits, retry headers
- **Input Validation**: XSS prevention, length limits
- **Mute Enforcement**: Temporary restrictions
- **Access Control**: Room participation checks

## Test Utilities

### Mock Users
- `regular`: Standard user with no special permissions
- `moderator`: Can mute, kick, delete messages
- `admin`: Full permissions including ban and moderator management
- `banned`: User with active ban for testing restrictions

### Helper Functions
- `generateToken(user)`: Create JWT tokens for testing
- `createMockGame()`: Generate game data
- `createMockChatRoom(gameId)`: Create chat room with proper expiration
- `createMockMessage()`: Generate message data
- `createMockReport()`: Create report data
- `MockSocketClient`: Simulate WebSocket connections
- `RateLimiter`: Test rate limiting functionality

### Custom Jest Matchers
- `toBeWithinRange(floor, ceiling)`: Check numeric ranges
- `toContainObject(expected)`: Check array contains object with properties

## Security Considerations

### Tests Validate:
1. **Input Sanitization**: XSS prevention, SQL injection protection
2. **Authentication**: Proper token validation, ban enforcement
3. **Authorization**: Role-based access control
4. **Rate Limiting**: Prevents spam and abuse
5. **Data Validation**: Length limits, type checking
6. **Error Handling**: No information leakage

### Key Security Tests:
- Banned users cannot bypass restrictions
- Rate limits are enforced per-user
- XSS attempts are sanitized
- Oversized payloads are rejected
- Muted users cannot send messages
- Self-reporting is prevented

## CI/CD Integration

The test suite is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run test:ci
    - uses: codecov/codecov-action@v2
```

## Coverage Requirements

Minimum coverage thresholds (configured in `jest.config.js`):
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Debugging Tests

### Verbose Output
```bash
jest --verbose tests/unit/moderation-permissions.test.js
```

### Debug Single Test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand tests/unit/chat-room-lifecycle.test.js
```

### View Coverage Report
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Adding New Tests

When adding features, ensure:
1. Unit tests for business logic
2. Integration tests for API endpoints
3. Security tests for user input
4. WebSocket tests for real-time features
5. Update this README with new test descriptions

## Common Issues

### Port Conflicts
Tests use random ports, but if issues occur:
```bash
lsof -i :3000  # Check if port is in use
```

### Database/Memory Cleanup
Each test should call `cleanupTestData()` in `afterEach()`

### Async Timeout
For long-running tests, increase timeout:
```javascript
jest.setTimeout(30000); // 30 seconds
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Assertions**: Test both success and failure cases
4. **Edge Cases**: Include boundary conditions
5. **Security**: Always test unauthorized access
6. **Performance**: Keep tests fast (< 1 second each)

## Maintenance

Regular maintenance tasks:
1. Update dependencies: `npm update`
2. Check for security vulnerabilities: `npm audit`
3. Review and update test coverage
4. Remove obsolete tests
5. Refactor duplicate test code