const redis = require('redis');

class RedisManager {
    constructor() {
        this.client = null;
        this.publisher = null;
        this.subscriber = null;
    }

    async connect() {
        try {
            // Main Redis client for caching and general operations
            this.client = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            // Publisher client for pub/sub
            this.publisher = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            // Subscriber client for pub/sub
            this.subscriber = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            await this.client.connect();
            await this.publisher.connect();
            await this.subscriber.connect();

            console.log('Redis clients connected successfully');

            // Error handling
            this.client.on('error', (err) => console.error('Redis Client Error:', err));
            this.publisher.on('error', (err) => console.error('Redis Publisher Error:', err));
            this.subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

        } catch (error) {
            console.error('Redis connection error:', error);
            throw error;
        }
    }

    // Cache operations
    async set(key, value, expiration = 3600) {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            await this.client.setEx(key, expiration, stringValue);
        } catch (error) {
            console.error('Redis SET error:', error);
            throw error;
        }
    }

    async get(key) {
        try {
            const value = await this.client.get(key);
            if (!value) return null;
            
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            console.error('Redis GET error:', error);
            throw error;
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Redis DEL error:', error);
            throw error;
        }
    }

    // Session management
    async setSession(sessionId, userData, expiration = 86400) {
        await this.set(`session:${sessionId}`, userData, expiration);
    }

    async getSession(sessionId) {
        return await this.get(`session:${sessionId}`);
    }

    async deleteSession(sessionId) {
        await this.del(`session:${sessionId}`);
    }

    // Pub/Sub operations
    async publish(channel, message) {
        try {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            await this.publisher.publish(channel, messageStr);
        } catch (error) {
            console.error('Redis PUBLISH error:', error);
            throw error;
        }
    }

    async subscribe(channel, callback) {
        try {
            await this.subscriber.subscribe(channel, (message) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    callback(parsedMessage);
                } catch {
                    callback(message);
                }
            });
        } catch (error) {
            console.error('Redis SUBSCRIBE error:', error);
            throw error;
        }
    }

    async unsubscribe(channel) {
        try {
            await this.subscriber.unsubscribe(channel);
        } catch (error) {
            console.error('Redis UNSUBSCRIBE error:', error);
            throw error;
        }
    }

    // Driver status operations
    async setDriverStatus(driverId, status) {
        await this.set(`driver:${driverId}:status`, status);
    }

    async getDriverStatus(driverId) {
        return await this.get(`driver:${driverId}:status`);
    }

    async getAvailableDrivers() {
        const keys = await this.client.keys('driver:*:status');
        const availableDrivers = [];
        
        for (const key of keys) {
            const status = await this.get(key);
            if (status === 'available') {
                const driverId = key.split(':')[1];
                availableDrivers.push(driverId);
            }
        }
        
        return availableDrivers;
    }

    async disconnect() {
        try {
            if (this.client) await this.client.disconnect();
            if (this.publisher) await this.publisher.disconnect();
            if (this.subscriber) await this.subscriber.disconnect();
            console.log('Redis clients disconnected');
        } catch (error) {
            console.error('Redis disconnect error:', error);
        }
    }
}

module.exports = new RedisManager();