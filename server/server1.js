const express = require('express');
const app = express();

app.get('/rest', (req, res) => {
    setTimeout(() => res.json({ data: "Rest API Data from server 1" }), Math.random() * 1000);
});

app.get('/graphql', (req, res) => {
    setTimeout(() => res.json({ data: "GraphQL Data from server 1" }), Math.random() * 1000);
});

app.get('/grpc', (req, res) => {
    setTimeout(() => res.json({ data: "gRPC Data from server 1" }), Math.random() * 1000);
});

app.listen(3001, () => {
    console.log("Server 1 is running on port 3001");
});