const express = require('express');
require('dotenv').config();

const paymentRoutes = require('./routes/payments');
const db = require('./config/database');
const redis = require('./config/redis');

const app = express();
const PORT = process.env.PAYMENT_SERVICE_PORT || 3003;

app.use(express.json());

const initializeConnections = async () => {
    try {
        await db.connect();
        await redis.connect();
        console.log('Payment Service - Database and Redis connected');
    } catch (error) {
        console.error('Payment Service - Connection error:', error);
        process.exit(1);
    }
};

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'Payment Service',
        timestamp: new Date().toISOString()
    });
});

app.use('/payments', paymentRoutes);

app.use((error, req, res, next) => {
    console.error('Payment Service Error:', error);
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
        console.log(`Payment Service running on port ${PORT}`);
    });
});

module.exports = app;