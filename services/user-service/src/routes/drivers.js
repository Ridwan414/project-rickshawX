const express = require('express');
const Joi = require('joi');
const Driver = require('../models/Driver');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const statusSchema = Joi.object({
    status: Joi.string().valid('available', 'busy', 'offline').required()
});

const updateDriverSchema = Joi.object({
    vehicleType: Joi.string().optional(),
    vehicleNumber: Joi.string().optional(),
    licenseNumber: Joi.string().optional()
});

router.put('/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'driver') {
            return res.status(403).json({ error: 'Access denied. Driver account required.' });
        }

        const { error, value } = statusSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: error.details[0].message 
            });
        }

        const driver = await Driver.findByUserId(req.userId);
        if (!driver) {
            return res.status(404).json({ error: 'Driver profile not found' });
        }

        const updatedDriver = await Driver.updateStatus(driver.id, value.status);

        res.status(200).json({
            message: 'Driver status updated successfully',
            driver: {
                id: updatedDriver.id,
                status: updatedDriver.status,
                updated_at: updatedDriver.updated_at
            }
        });

    } catch (error) {
        console.error('Update driver status error:', error);
        res.status(500).json({ 
            error: 'Failed to update driver status',
            message: error.message 
        });
    }
});

router.get('/available', authMiddleware, async (req, res) => {
    try {
        const availableDrivers = await Driver.getAvailableDrivers();

        res.status(200).json({
            drivers: availableDrivers,
            count: availableDrivers.length
        });

    } catch (error) {
        console.error('Get available drivers error:', error);
        res.status(500).json({ 
            error: 'Failed to get available drivers',
            message: error.message 
        });
    }
});

router.put('/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'driver') {
            return res.status(403).json({ error: 'Access denied. Driver account required.' });
        }

        const { error, value } = updateDriverSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: error.details[0].message 
            });
        }

        const updatedDriver = await Driver.updateProfile(req.userId, value);

        res.status(200).json({
            message: 'Driver profile updated successfully',
            driver: updatedDriver
        });

    } catch (error) {
        console.error('Update driver profile error:', error);
        res.status(500).json({ 
            error: 'Failed to update driver profile',
            message: error.message 
        });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const driver = await Driver.getDriverWithUser(req.params.id);
        
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        res.status(200).json({
            id: driver.id,
            name: driver.name,
            phone: driver.phone,
            vehicleType: driver.vehicle_type,
            vehicleNumber: driver.vehicle_number,
            status: driver.status
        });

    } catch (error) {
        console.error('Get driver error:', error);
        res.status(500).json({ 
            error: 'Failed to get driver',
            message: error.message 
        });
    }
});

module.exports = router;