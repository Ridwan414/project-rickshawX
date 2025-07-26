const Notification = require('../models/Notification');

class NotificationService {
    constructor() {
        console.log('Database Notification Service initialized');
    }

    async sendNotification(type, userId, data) {
        try {
            const title = this.getNotificationTitle(type);
            const message = this.formatNotificationMessage(type, data);
            
            // Store in database
            const notification = await Notification.create({
                userId: userId,
                type: type,
                title: title,
                message: message,
                data: data
            });

            // Also log to console for development
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${type.toUpperCase()} NOTIFICATION`);
            console.log(`User ID: ${userId}`);
            console.log(`Title: ${title}`);
            console.log(`Message: ${message}`);
            console.log(`Notification ID: ${notification.id}`);
            console.log('---');

            return {
                success: true,
                notificationId: notification.id,
                message: 'Notification stored successfully'
            };
        } catch (error) {
            console.error('Error storing notification:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to store notification'
            };
        }
    }

    getNotificationTitle(type) {
        switch (type) {
            case 'ride_request':
                return 'New Ride Request';
            case 'ride_accepted':
                return 'Ride Accepted';
            case 'trip_started':
                return 'Trip Started';
            case 'trip_completed':
                return 'Trip Completed';
            case 'payment_processed':
                return 'Payment Processed';
            default:
                return 'Notification';
        }
    }

    formatNotificationMessage(type, data) {
        switch (type) {
            case 'ride_request':
                return `New ride request! From: ${data.fromLocation} To: ${data.toLocation}. Fare: ৳${data.price}. Accept via app.`;
            
            case 'ride_accepted':
                return `Your ride has been accepted! Driver: ${data.driverName}, Phone: ${data.driverPhone}. Driver is on the way.`;
            
            case 'trip_started':
                return `Your trip has started! Driver: ${data.driverName}. Have a safe journey!`;
            
            case 'trip_completed':
                return `Trip completed! From: ${data.fromLocation} To: ${data.toLocation}. Fare: ৳${data.price}. Thank you for using RickshawX!`;
            
            case 'payment_processed':
                return `Payment of ৳${data.amount} processed successfully via ${data.method}. Transaction ID: ${data.transactionId}`;
            
            default:
                return `Notification: ${JSON.stringify(data)}`;
        }
    }

    async sendRideRequestNotification(driverId, rideDetails) {
        return await this.sendNotification('ride_request', driverId, rideDetails);
    }

    async sendRideAcceptedNotification(userId, driverDetails) {
        return await this.sendNotification('ride_accepted', userId, driverDetails);
    }

    async sendTripStartedNotification(userId, driverDetails) {
        return await this.sendNotification('trip_started', userId, driverDetails);
    }

    async sendTripCompletedNotification(userId, rideDetails) {
        return await this.sendNotification('trip_completed', userId, rideDetails);
    }

    async sendPaymentNotification(userId, paymentDetails) {
        return await this.sendNotification('payment_processed', userId, paymentDetails);
    }
}

module.exports = new NotificationService();