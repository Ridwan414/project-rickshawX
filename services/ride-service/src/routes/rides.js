const express = require('express');
const Joi = require('joi');
const Ride = require('../models/Ride');
const Route = require('../models/Route');
const authMiddleware = require('../middleware/auth');
const redis = require('../config/redis');

const router = express.Router();

const requestRideSchema = Joi.object({
    routeId: Joi.number().integer().positive().required()
});

router.post('/request', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'user') {
            return res.status(403).json({ error: 'Only users can request rides' });
        }

        const { error, value } = requestRideSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: error.details[0].message 
            });
        }

        const activeRide = await Ride.getActiveRide(req.userId, 'user');
        if (activeRide) {
            return res.status(409).json({ 
                error: 'You already have an active ride',
                ride: activeRide
            });
        }

        const route = await Route.findById(value.routeId);
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        const ride = await Ride.create({
            userId: req.userId,
            routeId: value.routeId,
            price: route.price
        });

        try {
            const notifiedDrivers = await Ride.notifyAvailableDrivers({
                id: ride.id,
                user_id: ride.user_id,
                from_location: route.from_location,
                to_location: route.to_location,
                price: ride.price
            });

            res.status(201).json({
                message: 'Ride request created successfully',
                ride: {
                    id: ride.id,
                    from_location: route.from_location,
                    to_location: route.to_location,
                    price: ride.price,
                    status: ride.status,
                    created_at: ride.created_at
                },
                notified_drivers: notifiedDrivers
            });

        } catch (notifyError) {
            console.error('Error notifying drivers:', notifyError);
            
            res.status(201).json({
                message: 'Ride request created but no drivers available',
                ride: {
                    id: ride.id,
                    from_location: route.from_location,
                    to_location: route.to_location,
                    price: ride.price,
                    status: ride.status,
                    created_at: ride.created_at
                },
                warning: 'No available drivers at the moment'
            });
        }

    } catch (error) {
        console.error('Request ride error:', error);
        res.status(500).json({ 
            error: 'Failed to create ride request',
            message: error.message 
        });
    }
});

router.post('/:id/accept', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can accept rides' });
        }

        const rideId = req.params.id;
        
        const activeRide = await Ride.getActiveRide(req.userId, 'driver');
        if (activeRide) {
            return res.status(409).json({ 
                error: 'You already have an active ride',
                ride: activeRide
            });
        }

        const driverQuery = 'SELECT id FROM drivers WHERE user_id = $1';
        const driverResult = await require('../config/database').query(driverQuery, [req.userId]);
        
        if (driverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Driver profile not found' });
        }

        const driverId = driverResult.rows[0].id;
        
        const ride = await Ride.assignDriver(rideId, driverId);
        const rideDetails = await Ride.findById(rideId);

        await redis.publish('ride_accepted', {
            rideId: ride.id,
            userId: ride.user_id,
            driverId: driverId,
            driverName: rideDetails.driver_name,
            driverPhone: rideDetails.driver_phone,
            pickupTime: ride.pickup_time,
            timestamp: new Date().toISOString()
        });

        res.status(200).json({
            message: 'Ride accepted successfully',
            ride: {
                id: ride.id,
                status: ride.status,
                pickup_time: ride.pickup_time,
                from_location: rideDetails.from_location,
                to_location: rideDetails.to_location,
                user_name: rideDetails.user_name,
                user_phone: rideDetails.user_phone
            }
        });

    } catch (error) {
        console.error('Accept ride error:', error);
        
        if (error.message.includes('not found') || error.message.includes('already assigned')) {
            return res.status(409).json({ 
                error: 'Ride not available',
                message: error.message 
            });
        }

        res.status(500).json({ 
            error: 'Failed to accept ride',
            message: error.message 
        });
    }
});

router.post('/:id/start', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can start trips' });
        }

        const rideId = req.params.id;
        const ride = await Ride.findById(rideId);

        if (!ride || ride.status !== 'accepted') {
            return res.status(400).json({ error: 'Ride cannot be started' });
        }

        const driverQuery = 'SELECT id FROM drivers WHERE user_id = $1';
        const driverResult = await require('../config/database').query(driverQuery, [req.userId]);
        
        if (driverResult.rows.length === 0 || driverResult.rows[0].id !== ride.driver_id) {
            return res.status(403).json({ error: 'Unauthorized to start this ride' });
        }

        const updatedRide = await Ride.updateStatus(rideId, 'in_progress', {
            startTime: new Date()
        });

        await redis.publish('trip_started', {
            rideId: updatedRide.id,
            userId: updatedRide.user_id,
            driverId: ride.driver_id,
            startTime: updatedRide.start_time,
            timestamp: new Date().toISOString()
        });

        res.status(200).json({
            message: 'Trip started successfully',
            ride: {
                id: updatedRide.id,
                status: updatedRide.status,
                start_time: updatedRide.start_time
            }
        });

    } catch (error) {
        console.error('Start trip error:', error);
        res.status(500).json({ 
            error: 'Failed to start trip',
            message: error.message 
        });
    }
});

router.post('/:id/complete', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can complete trips' });
        }

        const rideId = req.params.id;
        const ride = await Ride.findById(rideId);

        if (!ride || ride.status !== 'in_progress') {
            return res.status(400).json({ error: 'Ride cannot be completed' });
        }

        const driverQuery = 'SELECT id FROM drivers WHERE user_id = $1';
        const driverResult = await require('../config/database').query(driverQuery, [req.userId]);
        
        if (driverResult.rows.length === 0 || driverResult.rows[0].id !== ride.driver_id) {
            return res.status(403).json({ error: 'Unauthorized to complete this ride' });
        }

        const updatedRide = await Ride.updateStatus(rideId, 'completed', {
            endTime: new Date()
        });

        const updateDriverStatusQuery = `
            UPDATE drivers 
            SET status = 'available', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;
        await require('../config/database').query(updateDriverStatusQuery, [ride.driver_id]);

        await redis.setDriverStatus(ride.driver_id, 'available');

        await redis.publish('trip_completed', {
            rideId: updatedRide.id,
            userId: updatedRide.user_id,
            driverId: ride.driver_id,
            endTime: updatedRide.end_time,
            price: updatedRide.price,
            timestamp: new Date().toISOString()
        });

        res.status(200).json({
            message: 'Trip completed successfully',
            ride: {
                id: updatedRide.id,
                status: updatedRide.status,
                end_time: updatedRide.end_time,
                price: updatedRide.price
            }
        });

    } catch (error) {
        console.error('Complete trip error:', error);
        res.status(500).json({ 
            error: 'Failed to complete trip',
            message: error.message 
        });
    }
});

router.get('/history', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const rides = await Ride.getRideHistory(req.userId, req.user.type, limit, offset);

        res.status(200).json({
            rides: rides,
            count: rides.length,
            limit: limit,
            offset: offset
        });

    } catch (error) {
        console.error('Get ride history error:', error);
        res.status(500).json({ 
            error: 'Failed to get ride history',
            message: error.message 
        });
    }
});

router.get('/active', authMiddleware, async (req, res) => {
    try {
        const activeRide = await Ride.getActiveRide(req.userId, req.user.type);

        if (!activeRide) {
            return res.status(404).json({ message: 'No active ride found' });
        }

        res.status(200).json({
            ride: activeRide
        });

    } catch (error) {
        console.error('Get active ride error:', error);
        res.status(500).json({ 
            error: 'Failed to get active ride',
            message: error.message 
        });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        if (ride.user_id !== req.userId && ride.driver_id !== req.user.driver?.id) {
            return res.status(403).json({ error: 'Unauthorized to view this ride' });
        }

        res.status(200).json(ride);

    } catch (error) {
        console.error('Get ride error:', error);
        res.status(500).json({ 
            error: 'Failed to get ride',
            message: error.message 
        });
    }
});

module.exports = router;