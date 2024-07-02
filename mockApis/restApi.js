const express = require('express');
const app = express();

app.get('/data', (req, res) => {
    setTimeout(() => res.json({ data: "Rest Api Data" }))
})