const express = require('express');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const driverRoutes = require('./routes/drivers');
const db = require('./config/database');
const redis = require('./config/redis');

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3001;

app.use(express.json());

const initializeConnections = async () => {
    try {
        await db.connect();
        await redis.connect();
        console.log('User Service - Database and Redis connected');
    } catch (error) {
        console.error('User Service - Connection error:', error);
        process.exit(1);
    }
};

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'User Service',
        timestamp: new Date().toISOString()
    });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/drivers', driverRoutes);

app.use((error, req, res, next) => {
    console.error('User Service Error:', error);
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
        console.log(`User Service running on port ${PORT}`);
    });
});

module.exports = app;