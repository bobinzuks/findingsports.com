const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const communityService = require('../services/community-reputation-service');
const { body, query, param, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get user reputation
router.get('/reputation/:userId', 
  authenticateToken,
  param('userId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const reputation = await communityService.getUserReputation(req.params.userId);
      res.json(reputation);
    } catch (error) {
      console.error('Error getting reputation:', error);
      res.status(500).json({ error: 'Failed to get reputation' });
    }
  }
);

// Add reputation points (admin/moderator only)
router.post('/reputation/:userId/add',
  authenticateToken,
  param('userId').isUUID(),
  body('actionType').notEmpty(),
  body('points').isInt({ min: 1, max: 100 }),
  body('reason').optional().isString(),
  validate,
  async (req, res) => {
    try {
      // Check if user is admin or moderator
      if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const result = await communityService.addReputationPoints(
        req.params.userId,
        req.body.actionType,
        req.body.points,
        req.user.id,
        req.body.reason
      );

      res.json(result);
    } catch (error) {
      console.error('Error adding reputation:', error);
      res.status(500).json({ error: 'Failed to add reputation' });
    }
  }
);

// Endorse a user
router.post('/endorse/:userId',
  authenticateToken,
  param('userId').isUUID(),
  body('skillType').isIn(['leadership', 'teamwork', 'sportsmanship', 'organization', 'communication', 'technical']),
  body('message').optional().isString().isLength({ max: 500 }),
  validate,
  async (req, res) => {
    try {
      const endorsement = await communityService.endorseUser(
        req.user.id,
        req.params.userId,
        req.body.skillType,
        req.body.message
      );

      res.json(endorsement);
    } catch (error) {
      console.error('Error endorsing user:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get user endorsements
router.get('/endorsements/:userId',
  authenticateToken,
  param('userId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const endorsements = await communityService.getUserEndorsements(req.params.userId);
      res.json(endorsements);
    } catch (error) {
      console.error('Error getting endorsements:', error);
      res.status(500).json({ error: 'Failed to get endorsements' });
    }
  }
);

// Get ice breaker prompts
router.get('/ice-breakers',
  authenticateToken,
  query('category').optional().isIn(['sports_general', 'team_building', 'local_community', 'sport_specific', 'fun_casual']),
  query('sport').optional().isString(),
  validate,
  async (req, res) => {
    try {
      const prompts = await communityService.getIceBreakerPrompts(
        req.query.category,
        req.query.sport
      );
      res.json(prompts);
    } catch (error) {
      console.error('Error getting ice breakers:', error);
      res.status(500).json({ error: 'Failed to get ice breakers' });
    }
  }
);

// Save ice breaker response
router.post('/ice-breakers/response',
  authenticateToken,
  body('promptId').isUUID(),
  body('response').notEmpty().isLength({ max: 1000 }),
  body('visibility').optional().isIn(['public', 'friends', 'private']),
  validate,
  async (req, res) => {
    try {
      const response = await communityService.saveIceBreakerResponse(
        req.user.id,
        req.body.promptId,
        req.body.response,
        req.body.visibility
      );
      res.json(response);
    } catch (error) {
      console.error('Error saving ice breaker response:', error);
      res.status(500).json({ error: 'Failed to save response' });
    }
  }
);

// Create team formation request
router.post('/teams/create',
  authenticateToken,
  body('sport').notEmpty(),
  body('skillLevel').isIn(['beginner', 'intermediate', 'advanced', 'mixed']),
  body('teamName').optional().isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('location').isObject(),
  body('maxMembers').optional().isInt({ min: 2, max: 50 }),
  validate,
  async (req, res) => {
    try {
      const team = await communityService.createTeamFormation({
        creatorId: req.user.id,
        ...req.body
      });
      res.json(team);
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ error: 'Failed to create team' });
    }
  }
);

// Join team
router.post('/teams/:teamId/join',
  authenticateToken,
  param('teamId').isUUID(),
  body('position').optional().isString(),
  validate,
  async (req, res) => {
    try {
      const result = await communityService.joinTeam(
        req.params.teamId,
        req.user.id,
        req.body.position
      );
      res.json(result);
    } catch (error) {
      console.error('Error joining team:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get team recommendations
router.get('/teams/recommendations',
  authenticateToken,
  query('sport').optional().isString(),
  validate,
  async (req, res) => {
    try {
      const recommendations = await communityService.getTeamRecommendations(
        req.user.id,
        req.query.sport
      );
      res.json(recommendations);
    } catch (error) {
      console.error('Error getting team recommendations:', error);
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }
);

// Get user social graph
router.get('/social-graph/:userId',
  authenticateToken,
  param('userId').isUUID(),
  query('depth').optional().isInt({ min: 1, max: 3 }),
  validate,
  async (req, res) => {
    try {
      const graph = await communityService.getUserSocialGraph(
        req.params.userId,
        req.query.depth || 2
      );
      res.json(graph);
    } catch (error) {
      console.error('Error getting social graph:', error);
      res.status(500).json({ error: 'Failed to get social graph' });
    }
  }
);

// Get community groups
router.get('/groups',
  authenticateToken,
  query('category').optional().isString(),
  query('isPublic').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const groups = await communityService.getCommunityGroups(req.query);
      res.json(groups);
    } catch (error) {
      console.error('Error getting groups:', error);
      res.status(500).json({ error: 'Failed to get groups' });
    }
  }
);

// Create community group
router.post('/groups/create',
  authenticateToken,
  body('name').notEmpty().isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('category').isIn(['sport', 'location', 'skill_level', 'interest', 'social']),
  body('isPublic').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const group = await communityService.createCommunityGroup({
        creatorId: req.user.id,
        ...req.body
      });
      res.json(group);
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({ error: 'Failed to create group' });
    }
  }
);

// Get user trust signals
router.get('/trust-signals/:userId',
  authenticateToken,
  param('userId').isUUID(),
  validate,
  async (req, res) => {
    try {
      const signals = await communityService.getUserTrustSignals(req.params.userId);
      res.json(signals);
    } catch (error) {
      console.error('Error getting trust signals:', error);
      res.status(500).json({ error: 'Failed to get trust signals' });
    }
  }
);

// Add trust signal (verified users only)
router.post('/trust-signals/:userId',
  authenticateToken,
  param('userId').isUUID(),
  body('signalType').isIn(['identity_verified', 'phone_verified', 'social_linked', 'background_check']),
  body('signalValue').isInt({ min: 1, max: 10 }),
  validate,
  async (req, res) => {
    try {
      // Only allow admins or the user themselves for certain signals
      if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      await communityService.addTrustSignal(
        req.params.userId,
        req.body.signalType,
        req.body.signalValue,
        req.user.id,
        req.body.expiresAt
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error adding trust signal:', error);
      res.status(500).json({ error: 'Failed to add trust signal' });
    }
  }
);

// Award achievement (admin only)
router.post('/achievements/:userId',
  authenticateToken,
  param('userId').isUUID(),
  body('achievementType').notEmpty(),
  body('achievementName').notEmpty(),
  body('description').optional().isString(),
  validate,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      await communityService.awardAchievement(
        req.params.userId,
        req.body.achievementType,
        req.body.achievementName,
        req.body.description,
        req.body.metadata
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error awarding achievement:', error);
      res.status(500).json({ error: 'Failed to award achievement' });
    }
  }
);

module.exports = router;