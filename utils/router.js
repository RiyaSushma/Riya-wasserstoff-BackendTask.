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
                logRequest(`Request to http://localhost:${this.port}${request.path} took ${duration}ms: , Average time: ${this.requestCount > 0 ? this.getAverageResponseTime() : 'N/A'} ms, request counts are: ${this.requestCount}, strategy: ${request.strategy}`);

                // Send response to the client
                request.resolve(response.data);
            } catch (error) {
                this.currentLoad -= 1;
                console.error(`Error processing request to http://localhost:${this.port}${request.path}: ${error}`);
                request.reject(error);
            }
        }
    }

    enqueueRequest(path, resolve, reject, startTime, strategy) {
        this.requestQueue.push({ path, resolve, reject, startTime, strategy });
        this.currentLoad += 1;
        console.log("current load is: ", this.currentLoad);
        this.handleRequest(); // Start processing the queued request
    }

    enqueueRequestPriority(path, resolve, reject, startTime, priority, strategy) {
        this.requestQueue.push({ path, resolve, reject, startTime, priority, strategy });
        this.requestQueue.sort((a, b) => b.priority - a.priority);
        this.currentLoad += 1;
        this.handleRequest();
    }

    getAverageResponseTime() {
        return this.requestCount > 0 ? this.totalTime / this.requestCount : 0;
    }

    getScore(strategy) {
        const avgResponseTime = this.getAverageResponseTime();
        console.log("strategy is: ", strategy);

        // queue management

        switch (strategy) {
            case 'FIFO':
                return avgResponseTime * this.weight + this.requestQueue.length;
            case 'Priority':
                return avgResponseTime * this.weight + this.requestQueue.reduce((acc, req) => acc + req.priority, 0);
            case 'RoundRobin':
                return this.currentLoad;
            default:
                return avgResponseTime * this.weight + this.requestQueue.length;
        }
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

const getNextServer = (apiType, strategy) => {
    const serversForApiType = apis[apiType];
    if (!serversForApiType) {
        console.log(`No servers found for API type: ${apiType}`);
        return null;
    }

    let selectedServer = null;
    let minScore = Infinity;

    serversForApiType.forEach(url => {
        const serverConfig = servers.find(server => url.includes(server.port));
        if (serverConfig) {
            const score = serverConfig.getScore(strategy);

            console.log("score is: ", score, serverConfig);

            // score is based on average time, weight (servers with highest weight can handle more request) and queue (total number of requests the server already has) taken by the server request, server with min score is choosed

            if (score < minScore) {
                minScore = score;
                selectedServer = serverConfig;
            }
        }
    });

    if (selectedServer) {

        console.log(`Selected server: ${selectedServer.port} with score: ${minScore}`);
    } else {

        // random server choosed if average time taen is INFINITY, but here value is 0 

        const randomIndex = Math.floor(Math.random() * serversForApiType.length);
        selectedServer = servers.find(server => server.port === serversForApiType[randomIndex].port);

        console.log(`No available servers for API type: ${apiType} and strategy: ${strategy}`);
    }

    return selectedServer ? `http://localhost:${selectedServer.port}/${apiType}` : null;
};

const routeRequest = async (req, res) => {
    const { apiType } = req.params;
    const strategy = req.query.strategy || 'FIFO';

    if (!apis[apiType]) {
        return res.status(400).send("Invalid API type");
    }

    const url = getNextServer(apiType, strategy);


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
            if (strategy === 'Priority') {
                const priority = parseInt(req.query.priority) || 0;
                console.log("strategy defined is: ", strategy);
                serverConfig.enqueueRequestPriority(`/${apiType}`, resolve, reject, start, priority, strategy);
            } else {
                console.log("strategy defined is: ", strategy);
                serverConfig.enqueueRequest(`/${apiType}`, resolve, reject, start, strategy);
            }
        });

        res.json(response);
    } catch (error) {
        console.error(`Error routing the request: ${error}`);
        res.status(500).send("Error routing the request");
    }
};

module.exports = { routeRequest };


// to run these commands

// FIFO: http://localhost:3000/api/rest?strategy=FIFO
// Priority: http://localhost:3000/api/rest?strategy=Priority&priority=5
// RoundRobin: http://localhost:3000/api/rest?strategy=RoundRobin