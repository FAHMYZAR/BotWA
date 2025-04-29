const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'keynotes.json');

const loadKeynotes = () => {
    try {
        if(!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify({
                prefix: '#',
                notes: {}
            }));
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (err) {
        console.error('Error loading keynotes:', err);
        return { prefix: '#', notes: {} };
    }
};

const saveKeynotes = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving keynotes:', err);
    }
};

module.exports = { loadKeynotes, saveKeynotes };