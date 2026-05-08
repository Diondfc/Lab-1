const db = require('../config/db');

exports.getAllLocations = async (req, res) => {
    try {
        const [locations] = await db.query('SELECT * FROM EventLocations ORDER BY Name ASC');
        res.json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ 
            error: 'Database operation failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.createLocation = async (req, res) => {
    try {
        const { Name } = req.body;
        
        if (!Name) {
            return res.status(400).json({ error: 'Location name is required' });
        }

        // Check if location already exists
        const [existing] = await db.query(
            'SELECT * FROM EventLocations WHERE Name = ?',
            [Name]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Location already exists' });
        }

        const [result] = await db.query(
            'INSERT INTO EventLocations (Name) VALUES (?)',
            [Name]
        );
        
        const [newLocation] = await db.query(
            'SELECT * FROM EventLocations WHERE LocationID = ?',
            [result.insertId]
        );
        
        res.status(201).json(newLocation[0]);
    } catch (error) {
        console.error('Error creating location:', error);
        res.status(500).json({ 
            error: 'Database operation failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
