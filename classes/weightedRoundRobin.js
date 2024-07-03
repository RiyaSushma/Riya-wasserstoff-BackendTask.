class WeightedRoundRobinBalancer {
    constructor(servers) {
        this.servers = servers;
        this.totalWeight = this.calculateTotalWeight();
        this.cumulativeWeights = this.calculateCumulativeWeights();
        this.currentIndex = 0;
    }

    calculateTotalWeight() {
        return this.servers.reduce((total, server) => total + server.weight, 0);
    }

    calculateCumulativeWeights() {
        let cumulativeWeights = [];
        let sum = 0;
        this.servers.forEach(server => {
            sum += server.weight;
            cumulativeWeights.push(sum);
        });
        return cumulativeWeights;
    }

    getNextServer() {
        let randomValue = Math.floor(Math.random() * this.totalWeight);
        for (let i = 0; i < this.cumulativeWeights.length; i++) {
            if (randomValue < this.cumulativeWeights[i]) {
                this.currentIndex = i;
                break;
            }
        }
        return this.servers[this.currentIndex];
    }
}
