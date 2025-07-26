const express = require('express');
const Joi = require('joi');
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

const router = express.Router();

const sendNotificationSchema = Joi.object({
    userId: Joi.number().integer().positive().required(),
    message: Joi.string().max(500).required(),
    type: Joi.string().optional(),
    title: Joi.string().max(255).optional()
});

router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { error, value } = sendNotificationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: error.details[0].message 
            });
        }

        const { userId, message, type, title } = value;
        const result = await notificationService.sendNotification(type || 'general', userId, { 
            message,
            title: title || 'Notification'
        });

        if (result.success) {
            res.status(200).json({
                message: 'Notification sent successfully',
                notificationId: result.notificationId
            });
        } else {
            res.status(500).json({
                error: 'Failed to send notification',
                message: result.message
            });
        }

    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ 
            error: 'Failed to send notification',
            message: error.message 
        });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const status = req.query.status; // 'read', 'unread', or null for all

        const notifications = await Notification.getByUserId(req.userId, limit, offset, status);

        res.status(200).json({
            notifications: notifications,
            count: notifications.length,
            limit: limit,
            offset: offset
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ 
            error: 'Failed to get notifications',
            message: error.message 
        });
    }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.userId);

        res.status(200).json({
            unreadCount: count
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ 
            error: 'Failed to get unread count',
            message: error.message 
        });
    }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.markAsRead(req.params.id, req.userId);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json({
            message: 'Notification marked as read',
            notification: notification
        });

    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ 
            error: 'Failed to mark notification as read',
            message: error.message 
        });
    }
});

router.put('/mark-all-read', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.markAllAsRead(req.userId);

        res.status(200).json({
            message: 'All notifications marked as read',
            count: count
        });

    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ 
            error: 'Failed to mark all notifications as read',
            message: error.message 
        });
    }
});

router.get('/status', authMiddleware, async (req, res) => {
    try {
        res.status(200).json({
            database_notifications: {
                enabled: true,
                service: 'PostgreSQL Storage'
            },
            console_logging: {
                enabled: true,
                service: 'Console Logging'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get notification status error:', error);
        res.status(500).json({ 
            error: 'Failed to get notification status',
            message: error.message 
        });
    }
});

router.post('/test', authMiddleware, async (req, res) => {
    try {
        const testResult = await notificationService.sendNotification(
            'test',
            req.userId, 
            { message: 'Test notification from RickshawX Notification Service' }
        );

        res.status(200).json({
            message: 'Test notification sent',
            result: testResult
        });

    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ 
            error: 'Failed to send test notification',
            message: error.message 
        });
    }
});

module.exports = router;