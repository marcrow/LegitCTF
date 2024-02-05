// server.js
require('dotenv').config();
const express = require('express');
const mariadb = require('mariadb');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const dbService = require('./src/services/dbService'); // Database service
const apiRouter = require('./src/routes/apiRouter'); // Adjust the path as necessary
const adminRouter = require('./src/routes/adminRouter'); // adjust the path according to your project structure
const machinesRouter = require('./src/routes/machinesRouter'); // Adjust the path as necessary
const { validateArgs } = require('./src/middlewares/securityControls');
const { machineAccess, adminAccess } = require('./src/middlewares/securityControls'); // Adjust the path as necessary
const cookieParser = require('cookie-parser');
const session = require('express-session');

app.use(express.static('public')); // Serve static files from the public directory

app.use(express.static('views'));

// Serve Chart.js
app.get('/scripts/chart.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'chart.js', 'dist', 'chart.umd.js'));
  });
  
  // Serve Moment.js
  app.get('/scripts/moment.min.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'moment', 'min', 'moment.min.js'));
  });

  app.get('/scripts/chartjs-adapter-moment.min.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'chartjs-adapter-moment', 'dist', 'chartjs-adapter-moment.min.js'));
  });
app.use(express.json());

function generateSessionSecret() {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update('session' + Math.random());
    return hash.digest('hex');
}

session_secret = generateSessionSecret();

app.use(session({
    secret: session_secret,
    resave: false,
    saveUninitialized: true
  }));

const privateKey = fs.readFileSync('config/key.pem', 'utf8');
const certificate = fs.readFileSync('config/cert.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };

app.get('/db', async (req, res) => {
    try {
        const isConnected = await dbService.testConnection();
        res.send(`Connected to MariaDB successfully! ${isConnected}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to connect to MariaDB');
    }
});

// Use the API router for routes starting with '/api'
app.use('/api', apiRouter);

// Use the machines router for routes starting with '/machines'
app.use('/machines', machineAccess, machinesRouter);

app.use(express.urlencoded({ extended: true }));
app.use('/admin',adminAccess, adminRouter);




app.get('/', async (req, res) => {
    try {
        // const data = await dbService.getCompromisedData(); // Fetch data for chart
        res.sendFile(path.join(__dirname, 'src/views/chart.html')); // Send the HTML file
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching chart data');
    }
});

app.get('/data', validateArgs, async (req, res) => {
    const ctfId = req.query.ctf_id; // Get ctf_id from query parameters
    console.log(ctfId)
    if (!ctfId || ctfId==-1) {
        return res.status(400).send('CTF ID is required');
    }
    try {
        const data = await dbService.getPwnedInfo(ctfId);
        res.json(data);
    } catch (err) {
        console.error('Error fetching data for CTF:', err);
        res.status(500).send('Error fetching data for CTF');
    }
});

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log('Serveur HTTPS lancé sur le port ' + port);
});
