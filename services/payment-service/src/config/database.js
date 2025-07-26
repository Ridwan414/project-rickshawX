const { Pool } = require('pg');

class DatabaseManager {
    constructor() {
        this.pool = null;
    }

    async connect() {
        try {
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Test the connection
            const client = await this.pool.connect();
            client.release();
            
            console.log('PostgreSQL database connected successfully');
        } catch (error) {
            console.error('Database connection error:', error);
            throw error;
        }
    }

    async query(text, params) {
        try {
            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            if (process.env.NODE_ENV === 'development') {
                console.log('Executed query', { text, duration, rows: result.rowCount });
            }
            
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async getClient() {
        return await this.pool.connect();
    }

    async transaction(callback) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async disconnect() {
        try {
            if (this.pool) {
                await this.pool.end();
                console.log('Database disconnected');
            }
        } catch (error) {
            console.error('Database disconnect error:', error);
        }
    }
}

module.exports = new DatabaseManager();