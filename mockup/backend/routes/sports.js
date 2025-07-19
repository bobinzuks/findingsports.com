const express = require('express');
const router = express.Router();

const LOCAL_SPORTS = [
  { id: 'basketball', name: 'Basketball', emoji: '🏀', dropInVenues: 15, type: 'indoor' },
  { id: 'soccer', name: 'Soccer', emoji: '⚽', dropInVenues: 20, type: 'outdoor' },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', dropInVenues: 12, type: 'indoor' },
  { id: 'hockey', name: 'Ice Hockey', emoji: '🏒', dropInVenues: 8, type: 'arena' },
  { id: 'skating', name: 'Public Skating', emoji: '⛸️', dropInVenues: 8, type: 'arena' },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', dropInVenues: 10, type: 'indoor' }
];

router.get('/', (req, res) => {
  res.json({
    success: true,
    count: LOCAL_SPORTS.length,
    sports: LOCAL_SPORTS.map(s => ({
      ...s,
      description: 'Drop-in ' + s.name + ' at local venues',
      avgCost: s.type === 'arena' ? '$8-12' : '$3-8'
    }))
  });
});

router.get('/:id', (req, res) => {
  const sport = LOCAL_SPORTS.find(s => s.id === req.params.id);
  if (!sport) return res.status(404).json({ error: 'Sport not found' });

  res.json({
    success: true,
    sport: {
      ...sport,
      venues: sport.dropInVenues + ' local venues',
      peakTimes: ['6-8 AM', '7-9 PM']
    }
  });
});

module.exports = router;
