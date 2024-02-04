const express = require('express');
const router = express.Router();
const path = require('path');
const dbService = require('../services/dbService'); // Adjust the path as necessary
const { validateArgs } = require('../middlewares/securityControls');
const { convertToDateSQL, convertToYYYYMMDD } = require('../controllers/utils');
const sseMiddleware = require('../middlewares/sse');

function sendEventsToAll(data, connections) {
    console.log("caall")
    if (!connections) {
        console.log("No connections provided");
        return;
    }
    if (!Array.isArray(connections)) {
        console.log("Connections is not an array");
        return;
    }
    connections.forEach((res, index) => {
        try {
            console.log(`Sending to connection ${index}`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
            console.error(`Error sending to connection ${index}:`, error);
        }
    });
}

function generateHash(username, password) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha512');
    hash.update(username + password);
    return hash.digest('hex');
}

function generatePassword(lentgh){
    const crypto = require('crypto');
    return crypto.randomBytes(lentgh).toString('base64').slice(0, lentgh);
}

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin.html'), function (err) {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching chart data');
        }
    });
});

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
            res.status(400).send('Error updating CTF');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get("/users", validateArgs, async (req, res) => {
    try {
        const ctf_id = Number(req.query.ctf_id);
        if (!ctf_id) {
            return res.status(400).send('Error: ctf_id is required');
        }
        const users = await dbService.getCtfUser(ctf_id);
        res.json(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post("/user", validateArgs, async (req, res) => {
    try {
        const ctf_id = Number(req.body.ctf_id);
        const username = req.body.username;
        const password = generatePassword(10);
        if (!ctf_id || !username || !password) {
            console.log("ctf_id: ", ctf_id);
            console.log("username: ", username);
            console.log("password: ", password);    
            return res.status(400).send('Error: ctf_id, username and password are required');
        }
        let response = await dbService.createUser(ctf_id, username, password);
        console.log("response: ", response);
        if(!response || response == false){
            return res.status(400).send('Error: Creation failed');
        }
        let user_id = response;
        const user = await dbService.addUserToCtf(ctf_id, user_id);
        if (user == false){
            return res.status(400).send('Error : User already exist');
        }
        if (user.affectedRows > 0) {
            return res.redirect('/admin');
        } else {
            console.log(user);
            res.status(400).send('Error adding user');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});


router.post("/resetPassword", validateArgs, sseMiddleware, async (req, res) => {
    try {
        console.log("resetPassword: ", req.body)
        const username = req.body.username;
        if (!username) {
            return res.status(400).send('Error: ctf_id and username are required');
        }
        const password = generatePassword(10);
        const user = await dbService.resetPassword(username, password);
        if (user == false){
            res.status(400).send('Error : User doesnt exist');
        }
        if (user.affectedRows > 0) {
            notifData = {
                "type": "reset_password",
                "user": username,
            }
            sendEventsToAll(notifData, req.connections);
            res.json({password: password});
        } else {
            console.log(user);
            res.status(400).send('Error resetting password');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get("/machines", validateArgs, async (req, res) => {
    try {
        const ctf_id = Number(req.query.ctf_id);
        if (!ctf_id) {
            return res.status(400).send('Error: ctf_id is required');
        }
        const vmInstances = await dbService.listAllVmInstance(ctf_id);
        res.json(vmInstances);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post("/machine/state", validateArgs, sseMiddleware, async (req, res) => {
    try {
        const instance_id = req.body.instance_id;
        let running = req.body.running;
        const ctf_id = req.body.ctf_id;
        if (instance_id === undefined || ctf_id === undefined || running === undefined) {
            return res.status(400).send('Error: instance_id, ctf_id and running are required');
        }
        if( running != true && running != false){
            return res.status(400).send('Error: running must be true or false');
        }
        if (running == true){
            running = 1;
        } else {
            running = 0;
        }
        const response = await dbService.changeVmInstanceStatus(instance_id, running);
        if (response.affectedRows > 0) {
            let notifData;
            if (running == 1){
                const machine_name = req.body.machine_name;
                const ip = req.body.ip;
                notifData = {
                    "type": "new_instance",
                    "machine_name": machine_name,
                    "ip": ip,
                    "instance_id": instance_id,
                    "ctf_id": ctf_id
                }
            }else{
                notifData = {
                    "type": "logout",
                    "ctf_id": ctf_id,
                    "instance_id": instance_id,
                }
            }
            console.log("notifData: ", notifData)
            sendEventsToAll(notifData, req.connections);
            res.status(200).send('OK');
        } else {
            res.status(400).send('Error updating VM state');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post("/machine/kill", validateArgs, async (req, res) => {
    try {
        const instance_id = req.body.instance_id;
        if (!instance_id) {
            return res.status(400).send('Error: instance_id is required');
        }
        const response = await dbService.logoutVmInstance(instance_id);
        if (response.affectedRows > 0) {
            res.status(200).send('OK');
        } else {
            res.status(400).send('Error killing VM');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get("/pwnStat", validateArgs, async (req, res) => {
    try {
        const ctf_id = Number(req.query.ctf_id);
        if (!ctf_id) {
            return res.status(400).send('Error: ctf_id is required');
        }
        const machines = await dbService.getMachineList(ctf_id);
        for (const machine of machines){
            const result = await dbService.getPwnStat(ctf_id, machine.machine_name);
            machine.pwnStat = result;
        }
        console.log("machines: ", machines);
        res.json(machines);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


module.exports = router;