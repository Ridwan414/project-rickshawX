const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const rideRoutes = require('./routes/rides');
const paymentRoutes = require('./routes/payments');
const routeRoutes = require('./routes/routes');

const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { setupWebSocket } = require('./utils/websocket');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.API_GATEWAY_PORT || 3000;

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'API Gateway',
        timestamp: new Date().toISOString()
    });
});

app.use('/auth', authRoutes);
app.use('/users', authMiddleware, userRoutes);
app.use('/rides', authMiddleware, rideRoutes);
app.use('/payments', authMiddleware, paymentRoutes);
app.use('/routes', routeRoutes);

setupWebSocket(io);

app.use(errorHandler);

app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

server.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});

module.exports = { app, server, io };