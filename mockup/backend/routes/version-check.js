const express = require('express');
const router = express.Router();

// Dynamic version check endpoint that forces Railway to check the actual server
router.get('/check', (req, res) => {
    const deploymentTime = new Date().toISOString();
    const randomId = Math.random().toString(36).substring(7);
    
    res.set({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'X-Deployment-Check': deploymentTime,
        'X-Random-ID': randomId
    });
    
    res.json({
        version: '2025-01-13-aggressive-cache-bypass',
        deploymentTime,
        randomId,
        buttonsFunctional: true,
        playNowImplemented: true,
        features: {
            playNow: {
                geolocation: true,
                citySelection: true,
                stringDistanceHandling: true,
                categorizedGames: true,
                googleMapsReady: true
            },
            searchGames: true,
            sportRules: true,
            tabSwitching: true
        },
        timestamp: Date.now()
    });
});

module.exports = router;