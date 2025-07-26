const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().min(10).max(15).optional()
});

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.getWithDriverInfo(req.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            type: user.type,
            created_at: user.created_at
        };

        if (user.type === 'driver' && user.driver_id) {
            userData.driver = {
                id: user.driver_id,
                vehicleType: user.vehicle_type,
                vehicleNumber: user.vehicle_number,
                licenseNumber: user.license_number,
                status: user.driver_status
            };
        }

        res.status(200).json(userData);

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            error: 'Failed to get profile',
            message: error.message 
        });
    }
});

router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: error.details[0].message 
            });
        }

        if (value.email) {
            const existingUser = await User.findByEmail(value.email);
            if (existingUser && existingUser.id !== req.userId) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }

        if (value.phone) {
            const existingUser = await User.findByPhone(value.phone);
            if (existingUser && existingUser.id !== req.userId) {
                return res.status(409).json({ error: 'Phone number already in use' });
            }
        }

        const updatedUser = await User.updateProfile(req.userId, value);

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            error: 'Failed to update profile',
            message: error.message 
        });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            type: user.type
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            error: 'Failed to get user',
            message: error.message 
        });
    }
});

module.exports = router;