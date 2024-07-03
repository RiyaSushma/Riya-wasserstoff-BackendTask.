const express = require('express');
const app = express();

app.get('/server1/rest', (req, res) => {
    setTimeout(() => res.json({ data: "Rest Api Data Server 1" }), Math.random() * 1000);
});


app.get('/server2/rest', (req, res) => {
    setTimeout(() => res.json({ data: "Rest Api Data Server 1" }), Math.random() * 1000);
});


app.get('/server3/rest', (req, res) => {
    setTimeout(() => res.json({ data: "Rest Api Data Server 1" }), Math.random() * 1000);
});

app.listen(3001, () => {
    console.log("REST API IS RUNNING AT 3001");
})