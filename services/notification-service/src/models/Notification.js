const db = require('../config/database');

class Notification {
    static async create(notificationData) {
        const { userId, type, title, message, data } = notificationData;
        
        const query = `
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const result = await db.query(query, [
            userId, 
            type, 
            title, 
            message, 
            data ? JSON.stringify(data) : null
        ]);
        
        return result.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT * FROM notifications WHERE id = $1';
        const result = await db.query(query, [id]);
        
        if (result.rows.length > 0) {
            const notification = result.rows[0];
            if (notification.data) {
                notification.data = JSON.parse(notification.data);
            }
            return notification;
        }
        
        return null;
    }

    static async getByUserId(userId, limit = 20, offset = 0, status = null) {
        let query = `
            SELECT * FROM notifications 
            WHERE user_id = $1
        `;
        let params = [userId];
        let paramCount = 2;

        if (status) {
            query += ` AND status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        
        return result.rows.map(notification => {
            if (notification.data) {
                notification.data = JSON.parse(notification.data);
            }
            return notification;
        });
    }

    static async markAsRead(notificationId, userId) {
        const query = `
            UPDATE notifications 
            SET status = 'read', read_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        
        const result = await db.query(query, [notificationId, userId]);
        
        if (result.rows.length > 0) {
            const notification = result.rows[0];
            if (notification.data) {
                notification.data = JSON.parse(notification.data);
            }
            return notification;
        }
        
        return null;
    }

    static async markAllAsRead(userId) {
        const query = `
            UPDATE notifications 
            SET status = 'read', read_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND status = 'unread'
            RETURNING count(*)
        `;
        
        const result = await db.query(query, [userId]);
        return result.rowCount;
    }

    static async getUnreadCount(userId) {
        const query = `
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE user_id = $1 AND status = 'unread'
        `;
        
        const result = await db.query(query, [userId]);
        return parseInt(result.rows[0].count);
    }

    static async deleteOldNotifications(daysToKeep = 30) {
        const query = `
            DELETE FROM notifications 
            WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
            RETURNING count(*)
        `;
        
        const result = await db.query(query);
        return result.rowCount;
    }

    static async createRideRequestNotification(userId, rideData) {
        return await this.create({
            userId: userId,
            type: 'ride_request',
            title: 'New Ride Request',
            message: `New ride request from ${rideData.fromLocation} to ${rideData.toLocation}. Fare: ৳${rideData.price}`,
            data: rideData
        });
    }

    static async createRideAcceptedNotification(userId, rideData) {
        return await this.create({
            userId: userId,
            type: 'ride_accepted',
            title: 'Ride Accepted',
            message: `Your ride has been accepted by ${rideData.driverName}. Driver is on the way.`,
            data: rideData
        });
    }

    static async createTripStartedNotification(userId, rideData) {
        return await this.create({
            userId: userId,
            type: 'trip_started',
            title: 'Trip Started',
            message: `Your trip has started with driver ${rideData.driverName}. Have a safe journey!`,
            data: rideData
        });
    }

    static async createTripCompletedNotification(userId, rideData) {
        return await this.create({
            userId: userId,
            type: 'trip_completed',
            title: 'Trip Completed',
            message: `Trip completed from ${rideData.fromLocation} to ${rideData.toLocation}. Fare: ৳${rideData.price}`,
            data: rideData
        });
    }

    static async createPaymentProcessedNotification(userId, paymentData) {
        return await this.create({
            userId: userId,
            type: 'payment_processed',
            title: 'Payment Processed',
            message: `Payment of ৳${paymentData.amount} processed successfully via ${paymentData.method}`,
            data: paymentData
        });
    }
}

module.exports = Notification;