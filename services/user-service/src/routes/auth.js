const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const Driver = require('../models/Driver');
const redis = require('../config/redis');

const router = express.Router();

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().min(10).max(15).required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).required(),
    type: Joi.string().valid('user', 'driver').required(),
    vehicleType: Joi.when('type', {
        is: 'driver',
        then: Joi.string().required(),
        otherwise: Joi.optional()
    }),
    vehicleNumber: Joi.when('type', {
        is: 'driver',
        then: Joi.string().required(),
        otherwise: Joi.optional()
    }),
    licenseNumber: Joi.when('type', {
        is: 'driver',
        then: Joi.string().required(),
        otherwise: Joi.optional()
    })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: error.details[0].message 
            });
        }

        const { email, phone, password, name, type, vehicleType, vehicleNumber, licenseNumber } = value;

        const existingUserByEmail = await User.findByEmail(email);
        if (existingUserByEmail) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        const existingUserByPhone = await User.findByPhone(phone);
        if (existingUserByPhone) {
            return res.status(409).json({ error: 'User with this phone number already exists' });
        }

        const user = await User.create({ email, phone, password, name, type });

        if (type === 'driver') {
            await Driver.create({
                userId: user.id,
                vehicleType,
                vehicleNumber,
                licenseNumber
            });
        }

        const token = jwt.sign(
            { userId: user.id, type: user.type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        await redis.setSession(user.id.toString(), {
            userId: user.id,
            email: user.email,
            type: user.type
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                type: user.type
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Registration failed',
            message: error.message 
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: error.details[0].message 
            });
        }

        const { email, password } = value;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await User.validatePassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, type: user.type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        await redis.setSession(user.id.toString(), {
            userId: user.id,
            email: user.email,
            type: user.type
        });

        let userData = {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            type: user.type
        };

        if (user.type === 'driver') {
            const driver = await Driver.findByUserId(user.id);
            if (driver) {
                userData.driver = {
                    id: driver.id,
                    vehicleType: driver.vehicle_type,
                    vehicleNumber: driver.vehicle_number,
                    status: driver.status
                };
            }
        }

        res.status(200).json({
            message: 'Login successful',
            token,
            user: userData
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed',
            message: error.message 
        });
    }
});

router.post('/logout', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(400).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await redis.deleteSession(decoded.userId.toString());

        res.status(200).json({ message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            error: 'Logout failed',
            message: error.message 
        });
    }
});

module.exports = router;