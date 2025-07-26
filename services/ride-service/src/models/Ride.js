const db = require('../config/database');
const redis = require('../config/redis');
const axios = require('axios');

class Ride {
    static async create(rideData) {
        const { userId, routeId, price } = rideData;
        
        const query = `
            INSERT INTO rides (user_id, route_id, price, status)
            VALUES ($1, $2, $3, 'requested')
            RETURNING *
        `;
        
        const result = await db.query(query, [userId, routeId, price]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT r.*, 
                   rt.from_location, rt.to_location, rt.duration, rt.distance,
                   u.name as user_name, u.phone as user_phone,
                   d.id as driver_id, du.name as driver_name, du.phone as driver_phone
            FROM rides r
            JOIN routes rt ON r.route_id = rt.id
            JOIN users u ON r.user_id = u.id
            LEFT JOIN drivers d ON r.driver_id = d.id
            LEFT JOIN users du ON d.user_id = du.id
            WHERE r.id = $1
        `;
        
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async updateStatus(rideId, status, additionalData = {}) {
        const validStatuses = ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid ride status');
        }

        let updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
        let values = [rideId, status];
        let paramCount = 3;

        if (status === 'accepted' && additionalData.driverId) {
            updateFields.push(`driver_id = $${paramCount}`);
            values.push(additionalData.driverId);
            paramCount++;
            
            updateFields.push(`pickup_time = $${paramCount}`);
            values.push(additionalData.pickupTime || new Date());
            paramCount++;
        }

        if (status === 'in_progress') {
            updateFields.push(`start_time = $${paramCount}`);
            values.push(additionalData.startTime || new Date());
            paramCount++;
        }

        if (status === 'completed') {
            updateFields.push(`end_time = $${paramCount}`);
            values.push(additionalData.endTime || new Date());
            paramCount++;
        }

        const query = `
            UPDATE rides 
            SET ${updateFields.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async assignDriver(rideId, driverId) {
        return await db.transaction(async (client) => {
            const checkRideQuery = `
                SELECT * FROM rides WHERE id = $1 AND status = 'requested'
            `;
            const rideResult = await client.query(checkRideQuery, [rideId]);
            
            if (rideResult.rows.length === 0) {
                throw new Error('Ride not found or already assigned');
            }

            const checkDriverQuery = `
                SELECT * FROM drivers WHERE id = $1 AND status = 'available'
            `;
            const driverResult = await client.query(checkDriverQuery, [driverId]);
            
            if (driverResult.rows.length === 0) {
                throw new Error('Driver not available');
            }

            const updateRideQuery = `
                UPDATE rides 
                SET driver_id = $1, status = 'accepted', pickup_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;
            const updatedRide = await client.query(updateRideQuery, [driverId, rideId]);

            const updateDriverQuery = `
                UPDATE drivers 
                SET status = 'busy', updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `;
            await client.query(updateDriverQuery, [driverId]);

            await redis.setDriverStatus(driverId, 'busy');

            return updatedRide.rows[0];
        });
    }

    static async getAvailableDrivers() {
        try {
            const response = await axios.get(
                `${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/drivers/available`,
                { timeout: 5000 }
            );
            return response.data.drivers;
        } catch (error) {
            console.error('Error fetching available drivers:', error.message);
            return [];
        }
    }

    static async getRideHistory(userId, userType, limit = 10, offset = 0) {
        let query, params;

        if (userType === 'user') {
            query = `
                SELECT r.*, 
                       rt.from_location, rt.to_location, rt.duration,
                       du.name as driver_name, du.phone as driver_phone
                FROM rides r
                JOIN routes rt ON r.route_id = rt.id
                LEFT JOIN drivers d ON r.driver_id = d.id
                LEFT JOIN users du ON d.user_id = du.id
                WHERE r.user_id = $1
                ORDER BY r.created_at DESC
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
                SELECT r.*, 
                       rt.from_location, rt.to_location, rt.duration,
                       u.name as user_name, u.phone as user_phone
                FROM rides r
                JOIN routes rt ON r.route_id = rt.id
                JOIN users u ON r.user_id = u.id
                WHERE r.driver_id = $1
                ORDER BY r.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            params = [driverId, limit, offset];
        } else {
            throw new Error('Invalid user type');
        }

        const result = await db.query(query, params);
        return result.rows;
    }

    static async getActiveRide(userId, userType) {
        let query, params;

        if (userType === 'user') {
            query = `
                SELECT r.*, 
                       rt.from_location, rt.to_location, rt.duration,
                       du.name as driver_name, du.phone as driver_phone
                FROM rides r
                JOIN routes rt ON r.route_id = rt.id
                LEFT JOIN drivers d ON r.driver_id = d.id
                LEFT JOIN users du ON d.user_id = du.id
                WHERE r.user_id = $1 AND r.status IN ('requested', 'accepted', 'in_progress')
                ORDER BY r.created_at DESC
                LIMIT 1
            `;
            params = [userId];
        } else {
            const driverQuery = 'SELECT id FROM drivers WHERE user_id = $1';
            const driverResult = await db.query(driverQuery, [userId]);
            
            if (driverResult.rows.length === 0) {
                return null;
            }

            const driverId = driverResult.rows[0].id;
            
            query = `
                SELECT r.*, 
                       rt.from_location, rt.to_location, rt.duration,
                       u.name as user_name, u.phone as user_phone
                FROM rides r
                JOIN routes rt ON r.route_id = rt.id
                JOIN users u ON r.user_id = u.id
                WHERE r.driver_id = $1 AND r.status IN ('accepted', 'in_progress')
                ORDER BY r.created_at DESC
                LIMIT 1
            `;
            params = [driverId];
        }

        const result = await db.query(query, params);
        return result.rows[0] || null;
    }

    static async notifyAvailableDrivers(rideData) {
        try {
            const availableDrivers = await this.getAvailableDrivers();
            
            if (availableDrivers.length === 0) {
                throw new Error('No available drivers found');
            }

            for (const driver of availableDrivers) {
                await redis.publish('ride_request', {
                    rideId: rideData.id,
                    driverId: driver.id,
                    userId: rideData.user_id,
                    fromLocation: rideData.from_location,
                    toLocation: rideData.to_location,
                    price: rideData.price,
                    timestamp: new Date().toISOString()
                });
            }

            return availableDrivers.length;
        } catch (error) {
            console.error('Error notifying drivers:', error);
            throw error;
        }
    }
}

module.exports = Ride;