const express = require('express');
const app = express();

app.get('/grpc', (req, res) => {
    setTimeout(() => res.json({ data: "grpc Api Data" }), Math.random() * 1000);
});


app.listen(3002, () => {
    console.log("GRPC API IS RUNNING AT 3002");
})