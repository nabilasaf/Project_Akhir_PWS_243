const db = require('./src/config/db');

const sampleGames = [
    {
        title: 'The Witcher 3: Wild Hunt',
        genre: 'RPG',
        platform: 'PC, PS5, Xbox',
        rating: 4.9,
        api_endpoint: '/api/games/witcher3',
        status: 'available'
    },
    {
        title: 'Grand Theft Auto V',
        genre: 'Action',
        platform: 'PC, PS5, Xbox',
        rating: 4.8,
        api_endpoint: '/api/games/gta5',
        status: 'available'
    },
    {
        title: 'Elden Ring',
        genre: 'RPG',
        platform: 'PC, PS5, Xbox',
        rating: 4.7,
        api_endpoint: '/api/games/eldenring',
        status: 'available'
    },
    {
        title: 'Minecraft',
        genre: 'Simulation',
        platform: 'PC, Mobile, Console',
        rating: 4.8,
        api_endpoint: '/api/games/minecraft',
        status: 'available'
    },
    {
        title: 'FIFA 24',
        genre: 'Sports',
        platform: 'PC, PS5, Xbox',
        rating: 4.2,
        api_endpoint: '/api/games/fifa24',
        status: 'available'
    },
    {
        title: 'Civilization VI',
        genre: 'Strategy',
        platform: 'PC, Switch',
        rating: 4.6,
        api_endpoint: '/api/games/civ6',
        status: 'available'
    },
    {
        title: 'Portal 2',
        genre: 'Puzzle',
        platform: 'PC, PS3, Xbox 360',
        rating: 4.9,
        api_endpoint: '/api/games/portal2',
        status: 'available'
    },
    {
        title: 'Need for Speed: Heat',
        genre: 'Racing',
        platform: 'PC, PS4, Xbox One',
        rating: 4.1,
        api_endpoint: '/api/games/nfsheat',
        status: 'available'
    },
    {
        title: 'The Legend of Zelda: Breath of the Wild',
        genre: 'Adventure',
        platform: 'Nintendo Switch',
        rating: 4.9,
        api_endpoint: '/api/games/zelda-botw',
        status: 'available'
    },
    {
        title: 'Red Dead Redemption 2',
        genre: 'Action',
        platform: 'PC, PS4, Xbox One',
        rating: 4.8,
        api_endpoint: '/api/games/rdr2',
        status: 'available'
    }
];

async function seedGames() {
    try {
        console.log('🌱 Starting to seed games...');

        // Check if games already exist
        const [existing] = await db.query('SELECT COUNT(*) as count FROM games');

        if (existing[0].count > 0) {
            console.log(`⚠️  Database already has ${existing[0].count} games.`);
            console.log('Do you want to continue? This will add more games.');
            // For now, we'll skip if data exists
            console.log('Skipping seed. Delete existing games first if you want to re-seed.');
            process.exit(0);
        }

        // Insert sample games
        for (const game of sampleGames) {
            await db.query(
                `INSERT INTO games (title, genre, platform, rating, api_endpoint, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
                [game.title, game.genre, game.platform, game.rating, game.api_endpoint, game.status]
            );
            console.log(`✅ Added: ${game.title}`);
        }

        console.log(`\n🎉 Successfully seeded ${sampleGames.length} games!`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding games:', error);
        process.exit(1);
    }
}

seedGames();
