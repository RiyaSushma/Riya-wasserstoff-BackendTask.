const axios = require('axios');
const { logRequest } = require('./logger');

class Server {
    constructor(port, weight) {
        this.port = port;
        this.weight = weight;
        this.currentLoad = 0;
        this.totalTime = 0;
        this.requestCount = 0;
        this.requestQueue = []; // Queue to hold pending requests
    }

    async handleRequest() {
        while (this.requestQueue.length > 0) {
            console.log("request queue: ", this.requestQueue);
            const request = this.requestQueue.shift(); // Dequeue the request
            try {
                const response = await axios.get(`http://localhost:${this.port}${request.path}`);
                const duration = Date.now() - request.startTime;

                // Update server statistics

                console.log("total time is: ", this.totalTime);

                this.totalTime += duration;
                this.requestCount += 1;
                this.currentLoad -= 1;
                console.log("current load: ", this.currentLoad);

                // Log request details
                logRequest(`Request to http://localhost:${this.port}${request.path} took ${duration}ms: , Average time: ${this.requestCount > 0 ? this.getAverageResponseTime() : 'N/A'} ms, request counts are: ${this.requestCount}`);

                // Send response to the client
                request.resolve(response.data);
            } catch (error) {
                this.currentLoad -= 1;
                console.error(`Error processing request to http://localhost:${this.port}${request.path}: ${error}`);
                request.reject(error);
            }
        }
    }

    enqueueRequest(path, resolve, reject, startTime) {
        this.requestQueue.push({ path, resolve, reject, startTime });
        this.currentLoad += 1;
        console.log("current load is: ", this.currentLoad);
        this.handleRequest(); // Start processing the queued request
    }

    getAverageResponseTime() {
        return this.requestCount > 0 ? this.totalTime / this.requestCount : Infinity;
    }

    getScore() {
        const avgResponseTime = this.getAverageResponseTime();
        return avgResponseTime * this.weight + this.requestQueue.length;
    }
}

const servers = [
    new Server(3001, 2),
    new Server(3002, 3),
    new Server(3003, 1)
];

const apis = {
    rest: servers.map(server => `http://localhost:${server.port}/rest`),
    graphql: servers.map(server => `http://localhost:${server.port}/graphql`),
    grpc: servers.map(server => `http://localhost:${server.port}/grpc`),
};

const getNextServer = (apiType) => {
    const serversForApiType = apis[apiType];
    let selectedServer = null;
    let minScore = Infinity;

    serversForApiType.forEach(url => {
        console.log("url: ", url);
        const serverConfig = servers.find(server => url.includes(server.port));
        console.log("server config: ", serverConfig);
        if (serverConfig) {
            const avgResponseTime = serverConfig.requestCount > 0 ? serverConfig.totalTime / serverConfig.requestCount : 0;
            const score = avgResponseTime * serverConfig.weight + serverConfig.requestQueue.length;
            
            if (score < minScore) {
                minScore = score;
                selectedServer = serverConfig;
            }

            console.log("score is: ", url, score);
        }

        console.log("server config: ", serverConfig.requestCount, serverConfig.requestQueue, serverConfig.getAverageResponseTime());
    });

    return selectedServer ? `http://localhost:${selectedServer.port}/${apiType}` : null;
};

const routeRequest = async (req, res) => {
    const { apiType } = req.params;

    if (!apis[apiType]) {
        return res.status(400).send("Invalid API type");
    }
    
    const url = getNextServer(apiType);

    if (!url) {
        return res.status(500).send("No available servers");
    }
    
    const serverConfig = servers.find(server => url.includes(server.port));

    if (!serverConfig) {
        return res.status(500).send("Server configuration not found");
    }

    console.log(`Selected URL: ${url}, Current load: ${serverConfig.currentLoad}, Average time: ${serverConfig.requestCount > 0 ? serverConfig.getAverageResponseTime() : 'N/A'}`);

    try {
        const start = Date.now();
        const response = await new Promise((resolve, reject) => {
            serverConfig.enqueueRequest(`/${apiType}`, resolve, reject, start);
        });

        res.json(response);
    } catch (error) {
        console.error(`Error routing the request: ${error}`);
        res.status(500).send("Error routing the request");
    }
};

module.exports = { routeRequest };
