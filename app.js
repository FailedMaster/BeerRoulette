const express = require('express');
const path = require('path');
const mysql = require('mysql');
const cron = require('node-cron');

const beerRoulette = require('./api/beerRoulette.js');
const { port, mysqlConfig } = require('./config.json');

// DB
const connection = mysql.createConnection({
    host: mysqlConfig.host,
    socketPath: mysqlConfig.socketPath,
    database: mysqlConfig.db,
    user: mysqlConfig.user,
    password: mysqlConfig.pw
});

connection.connect(async (err) => {
    if (err) {
        console.error('Error connecting to MySQL:', error);
        return;
    }

    console.log('Connected to MySql Databse');
});

// App
const app = express();

// Serve the public directory as static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for all unmatched routes
app.get('/', (req, res) => {
    res.status(200);
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/getRandomBeer', async (req, res) => {
    const response = await beerRoulette.getRandomBeer(req.query, connection);
    res.status(200);
    res.send(response);
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

// Scheduled Pull
cron.schedule('0 0 18 * * *', () => {
	try {
		beerRoulette.fetchBeers(connection);
	} catch (error) {
		console.log(error);
	}
})