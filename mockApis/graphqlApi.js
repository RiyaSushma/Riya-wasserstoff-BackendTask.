const express = require('express');
const app = express();

app.use('/graphql', (req, res) => {
    setTimeout(() => res.json({ data: "Graphql Api Data" }), Math.random() * 1000);
});

app.listen(3003, () => {
    console.log("GRAPHQL API IS RUNNING AT 3003");
})