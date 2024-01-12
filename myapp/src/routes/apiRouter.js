const express = require('express');
const router = express.Router();
const { validateInteger } = require('../middlewares/securityControls'); // Adjust the path as necessary
const dbService = require('../services/dbService'); // Adjust the path as necessary
const { validateQueryInteger } = require('../middlewares/securityControls');
const { convertToDateSQL, convertToYYYYMMDD } = require('../controllers/utils');


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

router.get('/data', async (req, res) => {
    const ctfId = validateQueryInteger(req.query.ctf_id); // Get ctf_id from query parameters
    if (!ctfId || ctfId==-1) {
        return res.status(400).send('CTF ID is required');
    }
    pwn_date = ""
    if(!req.query.date){
        //getLastpawn
        let pwnDate = await dbService.getLastPwn(ctfId);
        if( pwnDate && pwnDate != null){
            pwn_date = pwnDate.latestCompromiseTime.toISOString().split("T")[0];
        }
        else{
            const ctf_data = await dbService.getCtfById(ctfId);
            pwn_date = ctf_data.start_date.split("T")[0]
        }
    }
    else{
        const dateInt = validateQueryInteger(req.query.date); // Get ctf_id from query parameters
        if(dateInt == -1){
            return res.status(400).send('Date format not supported');
        }
        pwn_date = convertToDateSQL(dateInt);
    }
    try {
        const data = await dbService.getPwnedInfoByDate(ctfId, pwn_date);
        res.json(data);
    } catch (err) {
        console.error('Error fetching data for CTF:', err);
        res.status(500).send('Error fetching data for CTF');
    }
});



module.exports = router;