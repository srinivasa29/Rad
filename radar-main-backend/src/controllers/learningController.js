const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

const getLearnings = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../data/learningData.json');
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        logger.error('Failed to load learning data:', error);
        res.status(500).json({ error: 'Failed to load learning data' });
    }
};

module.exports = { getLearnings };
