const db = require('../config/database');
const redis = require('../config/redis');

class Driver {
    static async create(driverData) {
        const { userId, vehicleType, vehicleNumber, licenseNumber } = driverData;
        
        const query = `
            INSERT INTO drivers (user_id, vehicle_type, vehicle_number, license_number, status)
            VALUES ($1, $2, $3, $4, 'offline')
            RETURNING *
        `;
        
        const result = await db.query(query, [userId, vehicleType, vehicleNumber, licenseNumber]);
        const driver = result.rows[0];
        
        await redis.setDriverStatus(driver.id, 'offline');
        
        return driver;
    }

    static async findByUserId(userId) {
        const query = 'SELECT * FROM drivers WHERE user_id = $1';
        const result = await db.query(query, [userId]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT * FROM drivers WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async updateStatus(driverId, status) {
        const validStatuses = ['available', 'busy', 'offline'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid driver status');
        }

        const query = `
            UPDATE drivers 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        
        const result = await db.query(query, [status, driverId]);
        const driver = result.rows[0];
        
        if (driver) {
            await redis.setDriverStatus(driverId, status);
            
            await redis.publish('driver_status', {
                driverId: driverId,
                status: status,
                timestamp: new Date().toISOString()
            });
        }
        
        return driver;
    }

    static async getAvailableDrivers() {
        const query = `
            SELECT d.*, u.name, u.phone 
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            WHERE d.status = 'available'
            ORDER BY d.updated_at ASC
        `;
        
        const result = await db.query(query);
        return result.rows;
    }

    static async getDriverWithUser(driverId) {
        const query = `
            SELECT 
                d.*,
                u.name, u.email, u.phone
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = $1
        `;
        
        const result = await db.query(query, [driverId]);
        return result.rows[0];
    }

    static async updateProfile(userId, updates) {
        const allowedFields = ['vehicle_type', 'vehicle_number', 'license_number'];
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(userId);
        const query = `
            UPDATE drivers 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $${paramCount}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }
}

module.exports = Driver;