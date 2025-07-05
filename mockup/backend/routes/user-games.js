const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap
const { authenticateToken } = require('../middleware/auth');
const { getInstance: getDataPipeline } = require('../services/data-aggregation-pipeline');

// Geocoding service (you'd use Google Maps API or similar in production)
async function geocodeAddress(address) {
    // Mock geocoding for demo
    const mockCoords = {
        vancouver: { lat: 49.2827, lng: -123.1207 },
        burnaby: { lat: 49.2488, lng: -122.9807 },
        richmond: { lat: 49.1666, lng: -123.1336 },
        surrey: { lat: 49.1913, lng: -122.849 }
    };

    const city = address.toLowerCase().split(',')[1]?.trim() || 'vancouver';
    return mockCoords[city] || mockCoords.vancouver;
}

// Submit a new game
router.post('/submit', authenticateToken, async (req, res) => {
    try {
        const dataPipeline = getDataPipeline();
        const gameData = req.body;
        const { user } = req;

        // Validate required fields
        const requiredFields = ['title', 'sport', 'venue', 'startTime'];
        for (const field of requiredFields) {
            if (!gameData[field]) {
                return res.status(400).json({
                    error: `Missing required field: ${field}`
                });
            }
        }

        // Validate venue
        if (!gameData.venue.name || !gameData.venue.address) {
            return res.status(400).json({
                error: 'Venue must have name and address'
            });
        }

        // Geocode if coordinates not provided
        if (!gameData.venue.coordinates) {
            gameData.venue.coordinates = await geocodeAddress(gameData.venue.address);
        }

        // Normalize sport name
        const normalizedSport = dataPipeline.sources.communityCenter.normalizeSport(gameData.sport);

        // Create normalized game object
        const normalizedGame = {
            title: gameData.title,
            sport: normalizedSport,
            venue: {
                name: gameData.venue.name,
                address: gameData.venue.address,
                coordinates: gameData.venue.coordinates,
                type: 'user-submitted'
            },
            startTime: new Date(gameData.startTime),
            endTime: gameData.endTime ? new Date(gameData.endTime) : null,
            recurring: gameData.recurring || { enabled: false },
            capacity: {
                min: gameData.minPlayers || 2,
                max: gameData.maxPlayers || null,
                current: 1 // Host is attending
            },
            skillLevel: gameData.skillLevel || 'all',
            cost: gameData.cost || 0,
            requirements: gameData.requirements || [],
            description: gameData.description,
            organizer: {
                id: user.id,
                name: user.name || user.username,
                email: user.email,
                verified: user.verificationLevel >= 2
            },
            source: {
                type: 'user',
                name: user.username,
                submittedAt: new Date(),
                verified: user.verificationLevel >= 2,
                reliability: 0.7 // Base reliability for user submissions
            }
        };

        // Process and store the game
        const processed = await dataPipeline.processGames([normalizedGame]);

        if (processed === 0) {
            return res.status(400).json({
                error: 'Failed to process game. It may be a duplicate or invalid.'
            });
        }

        // Get the stored game
        const gameId = dataPipeline.generateGameId(normalizedGame);
        const storedGame = dataPipeline.gamesDatabase.get(gameId);

        // Notify via WebSocket
        const webSocketService = require('../services/websocket');
        webSocketService.notifyNewGame(gameData.venue.address.split(',')[1]?.trim() || 'vancouver', storedGame);

        res.json({
            success: true,
            game: storedGame,
            message: 'Game submitted successfully!'
        });
    } catch (error) {
        console.error('Error submitting game:', error);
        res.status(500).json({
            error: 'Failed to submit game. Please try again.'
        });
    }
});

// Get user's submitted games
router.get('/my-games', authenticateToken, (req, res) => {
    try {
        const dataPipeline = getDataPipeline();
        const userId = req.user.id;

        const userGames = Array.from(dataPipeline.gamesDatabase.values())
            .filter(game => game.organizer?.id === userId)
            .sort((a, b) => new Date(b.source.submittedAt) - new Date(a.source.submittedAt));

        res.json({ games: userGames });
    } catch (error) {
        console.error('Error fetching user games:', error);
        res.status(500).json({
            error: 'Failed to fetch your games'
        });
    }
});

// Update a user's game
router.put('/:gameId', authenticateToken, async (req, res) => {
    try {
        const dataPipeline = getDataPipeline();
        const { gameId } = req.params;
        const updates = req.body;
        const userId = req.user.id;

        // Get existing game
        const existingGame = dataPipeline.gamesDatabase.get(gameId);

        if (!existingGame) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Check ownership
        if (existingGame.organizer?.id !== userId) {
            return res.status(403).json({
                error: 'You can only update your own games'
            });
        }

        // Apply updates
        const updatedGame = {
            ...existingGame,
            ...updates,
            venue: { ...existingGame.venue, ...updates.venue },
            source: {
                ...existingGame.source,
                lastUpdated: new Date()
            }
        };

        // Revalidate
        if (!dataPipeline.validateGame(updatedGame)) {
            return res.status(400).json({
                error: 'Invalid game data after update'
            });
        }

        // Store updated game
        dataPipeline.gamesDatabase.set(gameId, updatedGame);

        // Notify via WebSocket
        const webSocketService = require('../services/websocket');
        webSocketService.notifyGameUpdate(gameId, updatedGame);

        res.json({
            success: true,
            game: updatedGame
        });
    } catch (error) {
        console.error('Error updating game:', error);
        res.status(500).json({
            error: 'Failed to update game'
        });
    }
});

// Delete a user's game
router.delete('/:gameId', authenticateToken, (req, res) => {
    try {
        const dataPipeline = getDataPipeline();
        const { gameId } = req.params;
        const userId = req.user.id;

        // Get existing game
        const existingGame = dataPipeline.gamesDatabase.get(gameId);

        if (!existingGame) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Check ownership
        if (existingGame.organizer?.id !== userId) {
            return res.status(403).json({
                error: 'You can only delete your own games'
            });
        }

        // Delete game
        dataPipeline.gamesDatabase.delete(gameId);

        // Notify cancellation
        const webSocketService = require('../services/websocket');
        webSocketService.notifyGameUpdate(gameId, { cancelled: true });

        res.json({
            success: true,
            message: 'Game deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({
            error: 'Failed to delete game'
        });
    }
});

// Report/flag a game
router.post('/:gameId/report', authenticateToken, async (req, res) => {
    try {
        const { gameId } = req.params;
        const { reason, details } = req.body;
        const userId = req.user.id;

        // In production, this would be stored in a reports table
        console.log('Game reported:', {
            gameId,
            reportedBy: userId,
            reason,
            details,
            timestamp: new Date()
        });

        // You could adjust reliability score based on reports
        const dataPipeline = getDataPipeline();
        const game = dataPipeline.gamesDatabase.get(gameId);

        if (game) {
            game.reliability = Math.max(0, game.reliability - 0.1);
            dataPipeline.gamesDatabase.set(gameId, game);
        }

        res.json({
            success: true,
            message: 'Thank you for your report. We will review it.'
        });
    } catch (error) {
        console.error('Error reporting game:', error);
        res.status(500).json({
            error: 'Failed to submit report'
        });
    }
});

module.exports = router;
