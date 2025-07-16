const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

class UserGameService {
  constructor(gameModel, cacheManager, notificationService) {
    this.gameModel = gameModel;
    this.cacheManager = cacheManager;
    this.notificationService = notificationService;
    
    // Validation schema for user-submitted games
    this.gameSchema = Joi.object({
      venue: Joi.object({
        name: Joi.string().required().min(3).max(255),
        address: Joi.string().required(),
        latitude: Joi.number().required().min(-90).max(90),
        longitude: Joi.number().required().min(-180).max(180),
        type: Joi.string().valid('community_center', 'park', 'arena', 'gym', 'other').required()
      }).required(),
      game: Joi.object({
        sport: Joi.string().required().valid(
          'basketball', 'soccer', 'hockey', 'volleyball', 'tennis', 
          'pickleball', 'badminton', 'baseball', 'football', 'other'
        ),
        startTime: Joi.date().required().min('now').max(Joi.ref('endTime')),
        endTime: Joi.date().required(),
        gameType: Joi.string().valid('drop-in', 'organized', 'pickup').default('drop-in'),
        skillLevel: Joi.string().valid('beginner', 'intermediate', 'advanced', 'all').default('all'),
        capacity: Joi.number().integer().min(2).max(100),
        price: Joi.number().min(0).max(100),
        description: Joi.string().max(500),
        contactInfo: Joi.string().max(255)
      }).required(),
      user: Joi.object({
        id: Joi.string().required(),
        email: Joi.string().email(),
        phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/),
        name: Joi.string().max(100)
      }).required()
    });

    // Verification thresholds
    this.verificationConfig = {
      autoVerifyThreshold: 3, // Auto-verify after 3 confirmations
      autoRemoveThreshold: 3, // Remove after 3 reports
      trustedUserThreshold: 5, // Users with 5+ verified games become trusted
    };
  }

  async submitGame(gameData) {
    // Validate input
    const { error, value } = this.gameSchema.validate(gameData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    try {
      // Check for duplicate games at same venue/time
      const existingGames = await this.gameModel.findGamesAtVenue(
        value.venue.latitude,
        value.venue.longitude,
        value.game.startTime,
        value.game.endTime
      );

      if (existingGames.length > 0) {
        // Check if similar game already exists
        const duplicate = existingGames.find(g => 
          g.sport === value.game.sport && 
          Math.abs(new Date(g.start_time) - new Date(value.game.startTime)) < 30 * 60 * 1000 // Within 30 minutes
        );

        if (duplicate) {
          return {
            success: false,
            message: 'A similar game already exists at this time and location',
            existingGameId: duplicate.id
          };
        }
      }

      // Create or update venue
      const venue = await this.gameModel.addVenue({
        name: value.venue.name,
        address: value.venue.address,
        latitude: value.venue.latitude,
        longitude: value.venue.longitude,
        type: value.venue.type,
        source: 'user_submitted',
        sourceId: `user_${value.user.id}_${Date.now()}`,
        metadata: {
          submittedBy: value.user.id,
          submittedAt: new Date().toISOString()
        }
      });

      // Add game
      const game = await this.gameModel.addGame({
        venueId: venue.id,
        sport: value.game.sport,
        gameType: value.game.gameType,
        startTime: value.game.startTime,
        endTime: value.game.endTime,
        capacity: value.game.capacity,
        skillLevel: value.game.skillLevel,
        price: value.game.price || 0,
        source: 'user_submitted',
        metadata: {
          description: value.game.description,
          contactInfo: value.game.contactInfo,
          submittedBy: value.user.id
        }
      });

      // Add to user_games for tracking
      await this.gameModel.addUserGame({
        gameId: game.id,
        userId: value.user.id,
        verificationStatus: await this.isUserTrusted(value.user.id) ? 'verified' : 'pending'
      });

      // Invalidate relevant caches
      await this.invalidateNearbyCache(venue.latitude, venue.longitude);

      // Send notifications to nearby users (if enabled)
      if (this.notificationService) {
        await this.notificationService.notifyNearbyUsers({
          venue,
          game,
          radius: 5 // 5km notification radius
        });
      }

      return {
        success: true,
        gameId: game.id,
        venueId: venue.id,
        verificationStatus: game.verification_status,
        message: 'Game submitted successfully'
      };

    } catch (error) {
      console.error('Error submitting game:', error);
      throw error;
    }
  }

  async verifyGame(gameId, userId, action = 'confirm') {
    const validActions = ['confirm', 'report'];
    if (!validActions.includes(action)) {
      throw new Error('Invalid action. Must be "confirm" or "report"');
    }

    try {
      // Get game details
      const game = await this.gameModel.getGameWithVerification(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      // Check if user already verified/reported
      const existingAction = await this.gameModel.getUserGameAction(gameId, userId);
      if (existingAction) {
        return {
          success: false,
          message: `You have already ${existingAction} this game`
        };
      }

      // Record user action
      await this.gameModel.recordUserGameAction(gameId, userId, action);

      // Update verification counts
      const updates = {};
      if (action === 'confirm') {
        updates.verificationCount = game.verification_count + 1;
        if (updates.verificationCount >= this.verificationConfig.autoVerifyThreshold) {
          updates.verificationStatus = 'verified';
        }
      } else {
        updates.reportedCount = game.reported_count + 1;
        if (updates.reportedCount >= this.verificationConfig.autoRemoveThreshold) {
          updates.verificationStatus = 'removed';
        }
      }

      await this.gameModel.updateUserGame(gameId, updates);

      // Invalidate cache if status changed
      if (updates.verificationStatus) {
        const gameDetails = await this.gameModel.getGame(gameId);
        await this.invalidateNearbyCache(
          gameDetails.venue_latitude,
          gameDetails.venue_longitude
        );
      }

      return {
        success: true,
        action,
        newStatus: updates.verificationStatus || game.verification_status,
        verificationCount: updates.verificationCount || game.verification_count,
        reportedCount: updates.reportedCount || game.reported_count
      };

    } catch (error) {
      console.error('Error verifying game:', error);
      throw error;
    }
  }

  async isUserTrusted(userId) {
    const verifiedGames = await this.gameModel.getUserVerifiedGamesCount(userId);
    return verifiedGames >= this.verificationConfig.trustedUserThreshold;
  }

  async getUserSubmittedGames(userId, options = {}) {
    const { page = 1, limit = 20, status = 'all' } = options;
    
    try {
      const games = await this.gameModel.getUserGames(userId, {
        page,
        limit,
        status: status === 'all' ? null : status
      });

      return {
        games,
        pagination: {
          page,
          limit,
          total: games.length > 0 ? games[0].total_count : 0
        }
      };
    } catch (error) {
      console.error('Error fetching user games:', error);
      throw error;
    }
  }

  async invalidateNearbyCache(latitude, longitude, radius = 20) {
    // Invalidate cache for different precision levels
    const precisions = [3, 4, 5, 6];
    
    for (const precision of precisions) {
      const pattern = `search:${geohash.encode(latitude, longitude, precision)}`;
      await this.cacheManager.invalidate(pattern);
    }
  }

  async moderateGames() {
    // Automated moderation tasks
    try {
      // Remove games that have passed
      await this.gameModel.removeExpiredUserGames();

      // Check for suspicious patterns
      const suspiciousGames = await this.gameModel.findSuspiciousGames({
        duplicateThreshold: 5, // Same user submitting 5+ games at once
        timeWindow: 60 * 60 * 1000 // Within 1 hour
      });

      for (const game of suspiciousGames) {
        await this.gameModel.updateUserGame(game.id, {
          verificationStatus: 'flagged',
          metadata: {
            ...game.metadata,
            flaggedReason: 'suspicious_pattern',
            flaggedAt: new Date().toISOString()
          }
        });
      }

      return {
        expiredRemoved: true,
        suspiciousFlagged: suspiciousGames.length
      };
    } catch (error) {
      console.error('Error in moderation:', error);
      throw error;
    }
  }
}

module.exports = UserGameService;