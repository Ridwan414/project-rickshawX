const express = require('express');
require('dotenv').config();

const notificationRoutes = require('./routes/notifications');
const db = require('./config/database');
const redis = require('./config/redis');
const { setupEventListeners } = require('./services/eventService');

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3004;

app.use(express.json());

const initializeConnections = async () => {
    try {
        await db.connect();
        await redis.connect();
        console.log('Notification Service - Database and Redis connected');
        
        await setupEventListeners();
        console.log('Notification Service - Event listeners set up');
    } catch (error) {
        console.error('Notification Service - Connection error:', error);
        process.exit(1);
    }
};

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'Notification Service',
        timestamp: new Date().toISOString()
    });
});

app.use('/notifications', notificationRoutes);

app.use((error, req, res, next) => {
    console.error('Notification Service Error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

initializeConnections().then(() => {
    app.listen(PORT, () => {
        console.log(`Notification Service running on port ${PORT}`);
    });
});

module.exports = app;