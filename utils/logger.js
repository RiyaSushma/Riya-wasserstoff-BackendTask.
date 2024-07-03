const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/requests.log');

const logRequest = (message) => {
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
};

module.exports = { logRequest };