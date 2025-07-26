const jwt = require('jsonwebtoken');
const redis = require('redis');

let redisClient;

const setupWebSocket = (io) => {
    const connectRedis = async () => {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        await redisClient.connect();
        
        await redisClient.subscribe('ride_request', (message) => {
            const data = JSON.parse(message);
            io.to(`driver_${data.driverId}`).emit('ride_request', data);
        });

        await redisClient.subscribe('ride_accepted', (message) => {
            const data = JSON.parse(message);
            io.to(`user_${data.userId}`).emit('ride_accepted', data);
        });

        await redisClient.subscribe('trip_started', (message) => {
            const data = JSON.parse(message);
            io.to(`user_${data.userId}`).emit('trip_started', data);
            io.to(`driver_${data.driverId}`).emit('trip_started', data);
        });

        await redisClient.subscribe('trip_completed', (message) => {
            const data = JSON.parse(message);
            io.to(`user_${data.userId}`).emit('trip_completed', data);
            io.to(`driver_${data.driverId}`).emit('trip_completed', data);
        });

        await redisClient.subscribe('payment_processed', (message) => {
            const data = JSON.parse(message);
            io.to(`user_${data.userId}`).emit('payment_processed', data);
            io.to(`driver_${data.driverId}`).emit('payment_processed', data);
        });

        await redisClient.subscribe('driver_status', (message) => {
            const data = JSON.parse(message);
            io.emit('driver_status_update', data);
        });

        console.log('WebSocket Redis subscriptions set up');
    };

    connectRedis().catch(console.error);

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.userType = decoded.type;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId} (${socket.userType})`);

        if (socket.userType === 'user') {
            socket.join(`user_${socket.userId}`);
        } else if (socket.userType === 'driver') {
            socket.join(`driver_${socket.userId}`);
        }

        socket.on('driver_location_update', (data) => {
            if (socket.userType === 'driver') {
                socket.broadcast.emit('driver_location', {
                    driverId: socket.userId,
                    location: data.location
                });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });

        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
};

module.exports = { setupWebSocket };