const db = require('../config/database');
const redis = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

class Payment {
    static async create(paymentData) {
        const { rideId, amount, paymentMethod, userId } = paymentData;
        const transactionId = uuidv4();
        
        const query = `
            INSERT INTO payments (ride_id, amount, payment_method, transaction_id, status)
            VALUES ($1, $2, $3, $4, 'pending')
            RETURNING *
        `;
        
        const result = await db.query(query, [rideId, amount, paymentMethod, transactionId]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT p.*, 
                   r.user_id, r.driver_id,
                   rt.from_location, rt.to_location
            FROM payments p
            JOIN rides r ON p.ride_id = r.id
            JOIN routes rt ON r.route_id = rt.id
            WHERE p.id = $1
        `;
        
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findByRideId(rideId) {
        const query = 'SELECT * FROM payments WHERE ride_id = $1';
        const result = await db.query(query, [rideId]);
        return result.rows[0];
    }

    static async updateStatus(paymentId, status, processedAt = null) {
        const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid payment status');
        }

        let query, values;
        
        if (processedAt) {
            query = `
                UPDATE payments 
                SET status = $1, processed_at = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `;
            values = [status, processedAt, paymentId];
        } else {
            query = `
                UPDATE payments 
                SET status = $1, processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;
            values = [status, paymentId];
        }

        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async processPayment(rideId, paymentMethod, userId) {
        return await db.transaction(async (client) => {
            const rideQuery = `
                SELECT r.*, rt.price as route_price
                FROM rides r
                JOIN routes rt ON r.route_id = rt.id
                WHERE r.id = $1 AND r.status = 'completed'
            `;
            const rideResult = await client.query(rideQuery, [rideId]);
            
            if (rideResult.rows.length === 0) {
                throw new Error('Ride not found or not completed');
            }

            const ride = rideResult.rows[0];

            if (ride.user_id !== userId) {
                throw new Error('Unauthorized to process payment for this ride');
            }

            const existingPaymentQuery = 'SELECT * FROM payments WHERE ride_id = $1';
            const existingPayment = await client.query(existingPaymentQuery, [rideId]);
            
            if (existingPayment.rows.length > 0) {
                throw new Error('Payment already processed for this ride');
            }

            const transactionId = uuidv4();
            const paymentQuery = `
                INSERT INTO payments (ride_id, amount, payment_method, transaction_id, status, processed_at)
                VALUES ($1, $2, $3, $4, 'completed', CURRENT_TIMESTAMP)
                RETURNING *
            `;
            
            const paymentResult = await client.query(paymentQuery, [
                rideId, 
                ride.price, 
                paymentMethod, 
                transactionId
            ]);

            return {
                payment: paymentResult.rows[0],
                ride: ride
            };
        });
    }

    static async getPaymentHistory(userId, userType, limit = 10, offset = 0) {
        let query, params;

        if (userType === 'user') {
            query = `
                SELECT p.*, 
                       rt.from_location, rt.to_location,
                       du.name as driver_name
                FROM payments p
                JOIN rides r ON p.ride_id = r.id
                JOIN routes rt ON r.route_id = rt.id
                LEFT JOIN drivers d ON r.driver_id = d.id
                LEFT JOIN users du ON d.user_id = du.id
                WHERE r.user_id = $1
                ORDER BY p.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            params = [userId, limit, offset];
        } else if (userType === 'driver') {
            const driverQuery = 'SELECT id FROM drivers WHERE user_id = $1';
            const driverResult = await db.query(driverQuery, [userId]);
            
            if (driverResult.rows.length === 0) {
                return [];
            }

            const driverId = driverResult.rows[0].id;
            
            query = `
                SELECT p.*, 
                       rt.from_location, rt.to_location,
                       u.name as user_name
                FROM payments p
                JOIN rides r ON p.ride_id = r.id
                JOIN routes rt ON r.route_id = rt.id
                JOIN users u ON r.user_id = u.id
                WHERE r.driver_id = $1
                ORDER BY p.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            params = [driverId, limit, offset];
        } else {
            throw new Error('Invalid user type');
        }

        const result = await db.query(query, params);
        return result.rows;
    }

    static async processRefund(paymentId, userId) {
        return await db.transaction(async (client) => {
            const paymentQuery = `
                SELECT p.*, r.user_id
                FROM payments p
                JOIN rides r ON p.ride_id = r.id
                WHERE p.id = $1 AND p.status = 'completed'
            `;
            const paymentResult = await client.query(paymentQuery, [paymentId]);
            
            if (paymentResult.rows.length === 0) {
                throw new Error('Payment not found or cannot be refunded');
            }

            const payment = paymentResult.rows[0];

            if (payment.user_id !== userId) {
                throw new Error('Unauthorized to refund this payment');
            }

            const refundQuery = `
                UPDATE payments 
                SET status = 'refunded', processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;
            
            const refundResult = await client.query(refundQuery, [paymentId]);
            return refundResult.rows[0];
        });
    }

    static async getEarnings(driverId, startDate = null, endDate = null) {
        let query = `
            SELECT 
                COUNT(*) as total_rides,
                COALESCE(SUM(p.amount), 0) as total_earnings,
                AVG(p.amount) as average_fare
            FROM payments p
            JOIN rides r ON p.ride_id = r.id
            WHERE r.driver_id = $1 AND p.status = 'completed'
        `;
        
        const params = [driverId];
        
        if (startDate && endDate) {
            query += ' AND p.processed_at >= $2 AND p.processed_at <= $3';
            params.push(startDate, endDate);
        }

        const result = await db.query(query, params);
        return result.rows[0];
    }

    static async simulatePaymentGateway(amount, paymentMethod) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const success = Math.random() > 0.05;
                resolve({
                    success: success,
                    transactionId: success ? uuidv4() : null,
                    message: success ? 'Payment processed successfully' : 'Payment failed'
                });
            }, 1000);
        });
    }
}

module.exports = Payment;