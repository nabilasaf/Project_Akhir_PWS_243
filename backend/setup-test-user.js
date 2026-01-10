const pool = require('./src/config/db');
const bcrypt = require('bcrypt');

async function createTestUser() {
    try {
        console.log('🔍 Checking database structure...');

        // Check users table structure
        const [columns] = await pool.query('SHOW COLUMNS FROM users');
        console.log('\n📋 Users table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });

        // Check if test user exists
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@gamevault.com']);

        if (existing.length > 0) {
            console.log('\n✅ Test user already exists:');
            console.log(`   Email: ${existing[0].email}`);
            console.log(`   Role: ${existing[0].role}`);
            console.log(`   Status: ${existing[0].status || 'N/A'}`);

            // Update status if needed
            if (!existing[0].status || existing[0].status !== 'active') {
                await pool.query('UPDATE users SET status = ? WHERE email = ?', ['active', 'admin@gamevault.com']);
                console.log('\n✅ Updated user status to active');
            }
        } else {
            console.log('\n📝 Creating test user...');

            const hashedPassword = await bcrypt.hash('admin123', 10);

            const [result] = await pool.query(
                `INSERT INTO users (name, email, password, role, status) 
         VALUES (?, ?, ?, ?, ?)`,
                ['Admin User', 'admin@gamevault.com', hashedPassword, 'admin', 'active']
            );

            const userId = result.insertId;

            // Create quota for user
            await pool.query(
                'INSERT INTO user_quotas (user_id, monthly_limit, current_usage) VALUES (?, ?, ?)',
                [userId, 100000, 0]
            );

            console.log('\n✅ Test user created successfully!');
            console.log(`   Email: admin@gamevault.com`);
            console.log(`   Password: admin123`);
            console.log(`   Role: admin`);
        }

        console.log('\n✅ Database setup complete!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createTestUser();
