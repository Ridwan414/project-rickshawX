const db = require('../config/database');

class Route {
    static async getAllRoutes() {
        const query = `
            SELECT id, from_location, to_location, price, duration, distance, created_at
            FROM routes
            ORDER BY from_location, to_location
        `;
        
        const result = await db.query(query);
        return result.rows;
    }

    static async findById(id) {
        const query = 'SELECT * FROM routes WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findByLocations(fromLocation, toLocation) {
        const query = `
            SELECT * FROM routes 
            WHERE from_location = $1 AND to_location = $2
        `;
        const result = await db.query(query, [fromLocation, toLocation]);
        return result.rows[0];
    }

    static async getRoutesByFromLocation(fromLocation) {
        const query = `
            SELECT * FROM routes 
            WHERE from_location = $1
            ORDER BY to_location
        `;
        const result = await db.query(query, [fromLocation]);
        return result.rows;
    }

    static async getAvailableLocations() {
        const query = `
            SELECT DISTINCT from_location as location FROM routes
            UNION
            SELECT DISTINCT to_location as location FROM routes
            ORDER BY location
        `;
        const result = await db.query(query);
        return result.rows.map(row => row.location);
    }
}

module.exports = Route;