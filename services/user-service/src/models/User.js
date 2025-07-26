const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { email, phone, password, name, type } = userData;
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const query = `
            INSERT INTO users (email, phone, password_hash, name, type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, phone, name, type, created_at
        `;
        
        const result = await db.query(query, [email, phone, hashedPassword, name, type]);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    static async findByPhone(phone) {
        const query = 'SELECT * FROM users WHERE phone = $1';
        const result = await db.query(query, [phone]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT id, email, phone, name, type, created_at, updated_at 
            FROM users WHERE id = $1
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async updateProfile(userId, updates) {
        const allowedFields = ['name', 'email', 'phone'];
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
            UPDATE users 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING id, email, phone, name, type, updated_at
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async getWithDriverInfo(userId) {
        const query = `
            SELECT 
                u.id, u.email, u.phone, u.name, u.type, u.created_at,
                d.id as driver_id, d.vehicle_type, d.vehicle_number, 
                d.license_number, d.status as driver_status
            FROM users u
            LEFT JOIN drivers d ON u.id = d.user_id
            WHERE u.id = $1
        `;
        
        const result = await db.query(query, [userId]);
        return result.rows[0];
    }
}

module.exports = User;