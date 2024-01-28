const express = require('express');
const router = express.Router();
const path = require('path');
const dbService = require('../services/dbService'); // Adjust the path as necessary
const { validateArgs } = require('../middlewares/securityControls');
const { convertToDateSQL, convertToYYYYMMDD } = require('../controllers/utils');

function generateHash(username, password) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha512');
    hash.update(username + password);
    return hash.digest('hex');
}

router.get('/login', async (req, res) => {
    try {
        console.log(path.join(__dirname, '../views/login.html'))
        res.sendFile(path.join(__dirname, '../views/login.html')); // Send the HTML file
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching chart data');
    }
});

router.post('/login', async (req, res) => {
    try {
        console.log("req.body: ", req.body)
        const username = req.body.username;
        const password = req.body.password;
        if (!username || !password) {
            return res.status(400).send('username and password are required');
        }
        hashed_password = generateHash(username, password);
        console.log("hashed_password: ", hashed_password)
        const user = await dbService.checkAdminPassword(username, hashed_password);
        console.log("user: ", user)
        if(user == 0){
            return res.status(400).send('Error: wrong username or password');
        } 
        req.session.admin = user;
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching chart data');
    }
    res.redirect('/admin');
});

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin.html'), function (err) {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching chart data');
        }
    });
});

router.post("/changeDetails", validateArgs, async (req, res) => {
    try {
        const ctfId = Number(req.body.ctf_id);
        const ctfName = req.body.ctf_name;
        const startDate = req.body.start_date;
        const endDate = req.body.end_date;
        const startHour = Number(req.body.start_hour);
        const endHour = Number(req.body.end_hour);
        if (!ctfId || !ctfName || !startDate || !endDate || !startHour || !endHour) {
            return res.status(400).send('Error: ctf_id, ctf_name, start_date, end_date, start_hour and end_hour are required');
        }
        if (convertToYYYYMMDD(startDate) > convertToYYYYMMDD(endDate)) {
            return res.status(400).send('Error: start_date must be before end_date');
        }
        if (startHour > endHour) {
            return res.status(400).send('Error: start_hour must be before end_hour');
        }   
        const updatedCtf = await dbService.updateCtf(ctfId, ctfName, startDate, endDate, startHour, endHour);
        if (updatedCtf.affectedRows > 0) {
            res.redirect('/admin');
        } else {
            console.log(updatedCtf);
            res.status(400).send('Error updating CTF');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;