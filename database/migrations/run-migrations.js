const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function runMigrations() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL database');

        // Read and execute schema
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by statements and execute each one
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                    console.log('Executed:', statement.substring(0, 50) + '...');
                } catch (err) {
                    if (!err.message.includes('already exists')) {
                        console.error('Error executing statement:', statement.substring(0, 50));
                        console.error(err.message);
                    }
                }
            }
        }

        // Seed routes data
        const routesPath = path.join(__dirname, '../seeds/routes.sql');
        const routesData = fs.readFileSync(routesPath, 'utf8');
        
        try {
            await client.query(routesData);
            console.log('Routes seeded successfully');
        } catch (err) {
            if (!err.message.includes('duplicate key value')) {
                console.error('Error seeding routes:', err.message);
            } else {
                console.log('Routes already seeded');
            }
        }

        console.log('Database migration completed successfully');
        
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };