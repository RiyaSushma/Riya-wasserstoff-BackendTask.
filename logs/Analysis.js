const fs = require('fs');
const readline = require('readline');

// Example log file path
const logFilePath = 'logs/requests.log';

// Function to read log file and parse entries
const readLogFile = async () => {
    const logEntries = [];

    const fileStream = fs.createReadStream(logFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const entry = parseLogEntry(line);
        console.log("entry: ", entry);
        if (entry) {
            logEntries.push(entry);
        }
    }

    console.log("log entries: ", logEntries);

    return logEntries;
};

// Function to parse each log entry
const parseLogEntry = (line) => {
    try {
        const [timestampPart, messagePart] = line.split(' - ');
        const timestamp = timestampPart.trim();
        const messageParts = messagePart.split(/(?:Request to | took |, Average time: |, request counts are: |, strategy: )/);
        
        // Adjust indices based on your specific log format
        const requestPath = messageParts[1].trim();

        const urlParts = requestPath.match(/http:\/\/localhost:(\d+)\/(.*)/);
        const port = parseInt(urlParts[1]); // Extract port number
        const apiType = urlParts[2]; // Extract endpoint

        const responseTime = parseInt(messageParts[2]); 
        const averageTime = parseFloat(messageParts[3]); 
        const requestCounts = parseInt(messageParts[4]);
        const strategy = messageParts[5].trim(); 

        return {
            requestPath,
            port,
            apiType,
            timestamp,
            responseTime,
            averageTime,
            requestCounts,
            strategy
        };
    } catch (error) {
        console.error('Error parsing log entry:', error);
        return null;
    }
};

// Example: Read log file and analyze data
readLogFile().then(logEntries => {
    console.log("Total log entries:", logEntries.length);

    // Example: Calculate average response time per strategy and API type
    const strategies = ['FIFO', 'Priority', 'RoundRobin'];
    const apiTypes = ['rest', 'graphql', 'grpc'];

    apiTypes.forEach(apiType => {
        console.log(`\nAPI Type: ${apiType}`);
        
        strategies.forEach(strategy => {
            const strategyEntries = logEntries.filter(entry => entry.strategy === strategy && entry.apiType === apiType);
            const totalRequests = strategyEntries.length;
            const averageResponseTime = totalRequests > 0 ? strategyEntries.reduce((sum, entry) => sum + entry.averageTime, 0) / totalRequests : 0;
            console.log(`Strategy: ${strategy}, Total Requests: ${totalRequests}, Average Response Time: ${averageResponseTime.toFixed(2)} ms`);
        });
    });

    // Example: Identify servers with highest request counts per API type
    const servers = {};

    logEntries.forEach(entry => {
        if (!servers[entry.port]) {
            servers[entry.port] = {
                totalRequests: 0,
                averageResponseTime: 0
            };
        }

        servers[entry.port].totalRequests++;
        servers[entry.port].averageResponseTime += entry.averageTime;
    });

    // Display server statistics per API type
    console.log("\nServer Statistics per API Type:");
    Object.keys(servers).forEach(port => {
        const serverStats = servers[port];
        const avgResponseTime = serverStats.averageResponseTime / serverStats.totalRequests;
        console.log(`Server Port: ${port}, Total Requests: ${serverStats.totalRequests}, Average Response Time: ${avgResponseTime.toFixed(2)} ms`);
    });

}).catch(error => {
    console.error('Error reading log file:', error);
});