const express = require('express');
require('dotenv').config();

const routeRoutes = require('./routes/routes');
const rideRoutes = require('./routes/rides');
const db = require('./config/database');
const redis = require('./config/redis');

const app = express();
const PORT = process.env.RIDE_SERVICE_PORT || 3002;

app.use(express.json());

const initializeConnections = async () => {
    try {
        await db.connect();
        await redis.connect();
        console.log('Ride Service - Database and Redis connected');
    } catch (error) {
        console.error('Ride Service - Connection error:', error);
        process.exit(1);
    }
};

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'Ride Service',
        timestamp: new Date().toISOString()
    });
});

app.use('/routes', routeRoutes);
app.use('/rides', rideRoutes);

app.use((error, req, res, next) => {
    console.error('Ride Service Error:', error);
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
        console.log(`Ride Service running on port ${PORT}`);
    });
});

module.exports = app;