const redis = require('../config/redis');
const notificationService = require('./notificationService');
const axios = require('axios');

class EventService {
    constructor() {
        this.USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    }

    async getUserDetails(userId) {
        try {
            const response = await axios.get(`${this.USER_SERVICE_URL}/users/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user details:', error.message);
            return null;
        }
    }

    async getDriverDetails(driverId) {
        try {
            const response = await axios.get(`${this.USER_SERVICE_URL}/drivers/${driverId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching driver details:', error.message);
            return null;
        }
    }

    async getDriverUserIdByDriverId(driverId) {
        try {
            const driverDetails = await this.getDriverDetails(driverId);
            return driverDetails ? driverDetails.user_id : null;
        } catch (error) {
            console.error('Error fetching driver user ID:', error.message);
            return null;
        }
    }

    async handleRideRequest(data) {
        console.log('Processing ride request notification:', data);

        try {
            const driverUserId = await this.getDriverUserIdByDriverId(data.driverId);
            if (!driverUserId) {
                console.error('Driver user ID not found for ride request notification');
                return;
            }

            const rideDetails = {
                fromLocation: data.fromLocation,
                toLocation: data.toLocation,
                price: data.price,
                rideId: data.rideId
            };

            await notificationService.sendRideRequestNotification(driverUserId, rideDetails);

        } catch (error) {
            console.error('Error handling ride request notification:', error);
        }
    }

    async handleRideAccepted(data) {
        console.log('Processing ride accepted notification:', data);

        try {
            const driverDetails = await this.getDriverDetails(data.driverId);

            if (!driverDetails) {
                console.error('Driver details not found for ride accepted notification');
                return;
            }

            await notificationService.sendRideAcceptedNotification(data.userId, {
                driverName: driverDetails.name,
                driverPhone: driverDetails.phone,
                rideId: data.rideId,
                pickupTime: data.pickupTime
            });

        } catch (error) {
            console.error('Error handling ride accepted notification:', error);
        }
    }

    async handleTripStarted(data) {
        console.log('Processing trip started notification:', data);

        try {
            const driverDetails = await this.getDriverDetails(data.driverId);

            if (!driverDetails) {
                console.error('Driver details not found for trip started notification');
                return;
            }

            await notificationService.sendTripStartedNotification(data.userId, {
                driverName: driverDetails.name,
                rideId: data.rideId,
                startTime: data.startTime
            });

        } catch (error) {
            console.error('Error handling trip started notification:', error);
        }
    }

    async handleTripCompleted(data) {
        console.log('Processing trip completed notification:', data);

        try {
            await notificationService.sendTripCompletedNotification(data.userId, {
                fromLocation: data.fromLocation || 'N/A',
                toLocation: data.toLocation || 'N/A',
                price: data.price,
                rideId: data.rideId,
                endTime: data.endTime
            });

        } catch (error) {
            console.error('Error handling trip completed notification:', error);
        }
    }

    async handlePaymentProcessed(data) {
        console.log('Processing payment processed notification:', data);

        try {
            await notificationService.sendPaymentNotification(data.userId, {
                amount: data.amount,
                method: data.paymentMethod,
                transactionId: data.transactionId || 'N/A',
                rideId: data.rideId
            });

        } catch (error) {
            console.error('Error handling payment processed notification:', error);
        }
    }

    async handleDriverStatusUpdate(data) {
        console.log('Processing driver status update:', data);
        
    }

    async setupEventListeners() {
        try {
            await redis.subscribe('ride_request', (message) => {
                this.handleRideRequest(message);
            });

            await redis.subscribe('ride_accepted', (message) => {
                this.handleRideAccepted(message);
            });

            await redis.subscribe('trip_started', (message) => {
                this.handleTripStarted(message);
            });

            await redis.subscribe('trip_completed', (message) => {
                this.handleTripCompleted(message);
            });

            await redis.subscribe('payment_processed', (message) => {
                this.handlePaymentProcessed(message);
            });

            await redis.subscribe('driver_status', (message) => {
                this.handleDriverStatusUpdate(message);
            });

            console.log('Event listeners set up successfully');

        } catch (error) {
            console.error('Error setting up event listeners:', error);
            throw error;
        }
    }
}

const eventService = new EventService();

module.exports = {
    setupEventListeners: () => eventService.setupEventListeners(),
    eventService
};