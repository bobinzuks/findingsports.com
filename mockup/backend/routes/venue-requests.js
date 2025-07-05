const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap
const { authenticateToken } = require('../middleware/auth');

// In-memory storage for venue requests (replace with database)
const venueRequests = new Map();
let requestIdCounter = 1;

// Submit a venue request
router.post('/request', authenticateToken, async (req, res) => {
    try {
        const { venueName, address, sport, additionalInfo } = req.body;
        const { user } = req;

        // Validate required fields
        if (!venueName || !address || !sport) {
            return res.status(400).json({
                error: 'Venue name, address, and sport are required'
            });
        }

        // Create request
        const request = {
            id: `vr_${requestIdCounter++}`,
            venueName,
            address,
            sport,
            additionalInfo,
            requestedBy: {
                id: user.id,
                name: user.name || user.username,
                email: user.email
            },
            status: 'pending',
            submittedAt: new Date(),
            estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            notes: []
        };

        // Store request
        venueRequests.set(request.id, request);

        // In production, this would trigger:
        // 1. Email to admin team
        // 2. Automated research tasks
        // 3. Addition to research queue
        console.log('New venue request:', request);

        res.json({
            success: true,
            request: {
                id: request.id,
                status: request.status,
                estimatedCompletion: request.estimatedCompletion,
                message:
                    "Your venue request has been received. We'll research this location and add it within 24 hours if drop-in sports are available."
            }
        });
    } catch (error) {
        console.error('Error submitting venue request:', error);
        res.status(500).json({
            error: 'Failed to submit venue request'
        });
    }
});

// Get user's venue requests
router.get('/my-requests', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;

        const userRequests = Array.from(venueRequests.values())
            .filter(request => request.requestedBy.id === userId)
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        res.json({ requests: userRequests });
    } catch (error) {
        console.error('Error fetching venue requests:', error);
        res.status(500).json({
            error: 'Failed to fetch your venue requests'
        });
    }
});

// Get request status
router.get('/:requestId', authenticateToken, (req, res) => {
    try {
        const request = venueRequests.get(req.params.requestId);

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Check if user owns this request
        if (request.requestedBy.id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ request });
    } catch (error) {
        console.error('Error fetching request:', error);
        res.status(500).json({
            error: 'Failed to fetch request'
        });
    }
});

// Admin endpoints

// Get all pending requests (admin only)
router.get('/admin/pending', authenticateToken, (req, res) => {
    // Check admin role
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const pendingRequests = Array.from(venueRequests.values())
            .filter(request => request.status === 'pending')
            .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

        res.json({ requests: pendingRequests });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({
            error: 'Failed to fetch pending requests'
        });
    }
});

// Update request status (admin only)
router.put('/admin/:requestId/status', authenticateToken, async (req, res) => {
    // Check admin role
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const { status, notes, venueId } = req.body;
        const request = venueRequests.get(req.params.requestId);

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Update request
        request.status = status;
        request.updatedAt = new Date();
        request.updatedBy = req.user.name;

        if (notes) {
            request.notes.push({
                text: notes,
                addedBy: req.user.name,
                addedAt: new Date()
            });
        }

        if (status === 'completed' && venueId) {
            request.venueId = venueId;
            request.completedAt = new Date();
        }

        venueRequests.set(request.id, request);

        // Notify user via WebSocket
        const webSocketService = require('../services/websocket');
        webSocketService.notifyUser(request.requestedBy.id, {
            type: 'venue-request-update',
            requestId: request.id,
            status: request.status,
            message:
                status === 'completed'
                    ? 'Your venue request has been completed! The venue is now available for game submissions.'
                    : `Your venue request status: ${status}`
        });

        res.json({ success: true, request });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({
            error: 'Failed to update request'
        });
    }
});

// Search for existing venues (for autocomplete)
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query.toLowerCase();
        const { getInstance: getDataPipeline } = require('../services/data-aggregation-pipeline');
        const dataPipeline = getDataPipeline();

        // Search facilities
        const facilities = Array.from(dataPipeline.facilitiesDatabase.values());

        const matches = facilities
            .filter(
                facility =>
                    facility.venue.name.toLowerCase().includes(query) ||
                    facility.venue.address?.toLowerCase().includes(query)
            )
            .slice(0, 10) // Limit to 10 results
            .map(facility => ({
                id: facility.venue.id,
                name: facility.venue.name,
                address: facility.venue.address,
                features: facility.venue.features
            }));

        res.json({ venues: matches });
    } catch (error) {
        console.error('Error searching venues:', error);
        res.status(500).json({
            error: 'Failed to search venues'
        });
    }
});

module.exports = router;
