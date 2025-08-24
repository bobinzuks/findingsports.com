const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// In-memory storage for social posts (replace with database in production)
let socialPosts = [
    {
        id: 'post_1',
        userId: 'user_1',
        username: 'SportsEnthusiast',
        userAvatar: 'https://ui-avatars.com/api/?name=Sports+Enthusiast',
        content: 'Just finished an amazing basketball game at Kitsilano Community Centre! Great turnout today 🏀',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        likes: 12,
        comments: [],
        gameId: 'game_2',
        location: 'Kitsilano',
        sport: 'basketball'
    },
    {
        id: 'post_2',
        userId: 'user_2',
        username: 'SoccerFan22',
        userAvatar: 'https://ui-avatars.com/api/?name=Soccer+Fan',
        content: 'Looking for players for tomorrow\'s soccer game at UBC. We need 3 more!',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        likes: 8,
        comments: [
            {
                id: 'comment_1',
                userId: 'user_3',
                username: 'ActivePlayer',
                content: 'Count me in!',
                timestamp: new Date(Date.now() - 3600000).toISOString()
            }
        ],
        gameId: 'game_4',
        location: 'UBC',
        sport: 'soccer'
    }
];

// GET all social posts
router.get('/posts', (req, res) => {
    const { sport, location, gameId } = req.query;
    
    let filteredPosts = [...socialPosts];
    
    if (sport) {
        filteredPosts = filteredPosts.filter(post => post.sport === sport);
    }
    
    if (location) {
        filteredPosts = filteredPosts.filter(post => 
            post.location.toLowerCase().includes(location.toLowerCase())
        );
    }
    
    if (gameId) {
        filteredPosts = filteredPosts.filter(post => post.gameId === gameId);
    }
    
    // Sort by timestamp (newest first)
    filteredPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
        success: true,
        posts: filteredPosts,
        total: filteredPosts.length
    });
});

// GET single post by ID
router.get('/posts/:postId', (req, res) => {
    const post = socialPosts.find(p => p.id === req.params.postId);
    
    if (!post) {
        return res.status(404).json({
            success: false,
            error: 'Post not found'
        });
    }
    
    res.json({
        success: true,
        post
    });
});

// POST create new social post
router.post('/posts', authenticateToken, (req, res) => {
    const { content, gameId, location, sport } = req.body;
    
    if (!content || content.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Content is required'
        });
    }
    
    const newPost = {
        id: `post_${Date.now()}`,
        userId: req.user.id,
        username: req.user.username || req.user.email.split('@')[0],
        userAvatar: req.user.avatar || `https://ui-avatars.com/api/?name=${req.user.username || 'User'}`,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: [],
        gameId: gameId || null,
        location: location || null,
        sport: sport || null
    };
    
    socialPosts.unshift(newPost);
    
    // Emit to WebSocket for real-time updates
    if (global.io) {
        global.io.emit('new-post', newPost);
    }
    
    res.status(201).json({
        success: true,
        post: newPost
    });
});

// POST like a post
router.post('/posts/:postId/like', authenticateToken, (req, res) => {
    const post = socialPosts.find(p => p.id === req.params.postId);
    
    if (!post) {
        return res.status(404).json({
            success: false,
            error: 'Post not found'
        });
    }
    
    // Simple like increment (in production, track who liked)
    post.likes += 1;
    
    // Emit to WebSocket
    if (global.io) {
        global.io.emit('post-liked', {
            postId: post.id,
            likes: post.likes
        });
    }
    
    res.json({
        success: true,
        likes: post.likes
    });
});

// POST add comment to post
router.post('/posts/:postId/comments', authenticateToken, (req, res) => {
    const { content } = req.body;
    const post = socialPosts.find(p => p.id === req.params.postId);
    
    if (!post) {
        return res.status(404).json({
            success: false,
            error: 'Post not found'
        });
    }
    
    if (!content || content.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Comment content is required'
        });
    }
    
    const newComment = {
        id: `comment_${Date.now()}`,
        userId: req.user.id,
        username: req.user.username || req.user.email.split('@')[0],
        content: content.trim(),
        timestamp: new Date().toISOString()
    };
    
    post.comments.push(newComment);
    
    // Emit to WebSocket
    if (global.io) {
        global.io.emit('new-comment', {
            postId: post.id,
            comment: newComment
        });
    }
    
    res.status(201).json({
        success: true,
        comment: newComment
    });
});

// DELETE a post (only by owner or admin)
router.delete('/posts/:postId', authenticateToken, (req, res) => {
    const postIndex = socialPosts.findIndex(p => p.id === req.params.postId);
    
    if (postIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Post not found'
        });
    }
    
    const post = socialPosts[postIndex];
    
    // Check if user is owner or admin
    if (post.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Unauthorized to delete this post'
        });
    }
    
    socialPosts.splice(postIndex, 1);
    
    // Emit to WebSocket
    if (global.io) {
        global.io.emit('post-deleted', {
            postId: req.params.postId
        });
    }
    
    res.json({
        success: true,
        message: 'Post deleted successfully'
    });
});

// GET trending topics/tags
router.get('/trending', (req, res) => {
    // Simple trending calculation based on recent posts
    const sports = {};
    const locations = {};
    
    socialPosts.forEach(post => {
        if (post.sport) {
            sports[post.sport] = (sports[post.sport] || 0) + 1;
        }
        if (post.location) {
            locations[post.location] = (locations[post.location] || 0) + 1;
        }
    });
    
    const trendingSports = Object.entries(sports)
        .map(([sport, count]) => ({ sport, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    const trendingLocations = Object.entries(locations)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    res.json({
        success: true,
        trending: {
            sports: trendingSports,
            locations: trendingLocations
        }
    });
});

module.exports = router;