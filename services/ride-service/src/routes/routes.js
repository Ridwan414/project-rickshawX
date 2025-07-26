const express = require('express');
const Route = require('../models/Route');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const routes = await Route.getAllRoutes();
        
        res.status(200).json({
            routes: routes,
            count: routes.length
        });

    } catch (error) {
        console.error('Get routes error:', error);
        res.status(500).json({ 
            error: 'Failed to get routes',
            message: error.message 
        });
    }
});

router.get('/locations', async (req, res) => {
    try {
        const locations = await Route.getAvailableLocations();
        
        res.status(200).json({
            locations: locations,
            count: locations.length
        });

    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({ 
            error: 'Failed to get locations',
            message: error.message 
        });
    }
});

router.get('/from/:location', async (req, res) => {
    try {
        const routes = await Route.getRoutesByFromLocation(req.params.location);
        
        res.status(200).json({
            routes: routes,
            count: routes.length,
            from_location: req.params.location
        });

    } catch (error) {
        console.error('Get routes by location error:', error);
        res.status(500).json({ 
            error: 'Failed to get routes',
            message: error.message 
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        res.status(200).json(route);

    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({ 
            error: 'Failed to get route',
            message: error.message 
        });
    }
});

module.exports = router;