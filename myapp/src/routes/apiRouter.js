const express = require('express');
const router = express.Router();
const { validateInteger } = require('../middlewares/securityControls'); // Adjust the path as necessary
const dbService = require('../services/dbService'); // Adjust the path as necessary
const { validateArgs } = require('../middlewares/securityControls');
const { convertToDateSQL, convertToYYYYMMDD, getFormattedDate, getFormattedHour } = require('../controllers/utils');
const sseMiddleware = require('../middlewares/sse'); // Adjust the path as necessary

router.get('/events', sseMiddleware, (req, res) => {

});

// Define the API route for getting a single CTF by ID
router.get('/ctfs/:ctfId', validateInteger('ctfId'), async (req, res) => {
    try {
        const ctfId = req.validatedParams.ctfId;
        const ctfData = await dbService.getCtfById(ctfId);
        res.json(ctfData);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/listUsers/:ctfId', validateInteger('ctfId'), async (req, res) => {
    try {
        const ctfId = req.validatedParams.ctfId;
        const users = await dbService.listUsers(ctfId);
        res.json(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/listCtfs', async (req, res) => {
    try {
        const ctfData = await dbService.listCtf();
        res.json(ctfData);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/data', validateArgs, async (req, res) => {
    const ctfId = req.query.ctf_id; // Get ctf_id from query parameters
    let pwn_date = "";
    console.log("req.query.date: ", req.query.date);
    if (!req.query.date) {
        // Get the last pwn date
        let pwnDate = await dbService.getLastPwn(ctfId);
        console.log("pwnDate: ", pwnDate);
        if (pwnDate && pwnDate.latestCompromiseTime) {
            console.log("pwnDate.latestCompromiseTime: ", pwnDate.latestCompromiseTime);
            pwn_date = getFormattedDate(pwnDate.latestCompromiseTime);
        } else {
            const ctf_data = await dbService.getCtfById(ctfId);
            console.log("ctf_data: ", ctf_data);
            if (ctf_data && ctf_data.start_date) {
                console.log("ctf_data.start_date: ", ctf_data.start_date);
                pwn_date = getFormattedDate(ctf_data.start_date);
            } else {
                return res.status(400).send('Invalid CTF data');
            }
        console.log("pwn_date: ", pwn_date);
        }
    } else {
        const dateInt = req.query.date; // Get date from query parameters
        pwn_date = convertToDateSQL(dateInt);
    }
    try {
        console.log("pwn_date: ", pwn_date);
        const data = await dbService.getPwnedInfoByDate(ctfId, pwn_date);
        res.json(data);
    } catch (err) {
        console.error('Error fetching data for CTF:', err);
        res.status(500).send('Error fetching data for CTF');
    }
});

router.get('/machines', validateArgs, async (req, res) => {
    const ctfId = req.query.ctf_id; // Get ctf_id from query parameters
    if (!ctfId) {
        return res.status(400).send('CTF ID is required');
    }
    try {
        const machines = await dbService.listVMInstance(ctfId);
        res.json(machines);
    } catch (err) {
        console.error('Error fetching machines for CTF:', err);
        res.status(500).send('Error fetching machines for CTF');
    }
});

module.exports = router;