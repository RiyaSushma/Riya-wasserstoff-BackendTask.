const express = require('express');
const { routeRequest } = require('./utils/router');

console.log({routeRequest});

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('hello world')
})

app.get('/api/:apiType', routeRequest);

app.listen(PORT, () => {
    console.log(`Load Balancer running on port http://localhost:${PORT}`);
}); 