class Server {
    constructor(name, weight) {
        this.name = name;
        this.weight = weight;
        this.requestCount = 0;
    }

    incrementRequestCount() {
        this.requestCount++;
    }
}
