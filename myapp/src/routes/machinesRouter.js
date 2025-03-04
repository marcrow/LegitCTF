const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService'); // Adjust the path as necessary
const { validateArgs } = require('../middlewares/securityControls');
const { checkVMCookie } = require('../middlewares/securityControls');
const { createCookie } = require('../controllers/vmCookie');
const utils = require('../controllers/utils');
const sseMiddleware = require('../middlewares/sse');
const { convertToDateSQL, convertToYYYYMMDD, getFormattedDate, getFormattedHour } = require('../controllers/utils');

function sendEventsToAll(data, connections) {
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




router.get('/test', sseMiddleware, async (req, res) => {
    try {
        res.send('OK');
        notifData = {
            "type": "pwn",
            "ctf_id": 1,
            "user": "prof",
            "machine": "ctf_machine_name",
            "day": 20240110,
            "hour": 11
        }
        sendEventsToAll(notifData, req.connections);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post('/firstAuth/', validateArgs, sseMiddleware,  async (req, res) => {
    try {
        console.log("firstAuth")
        const machine_name = req.body.machine_name;
        const default_password = req.body.default_password;
        const ctf_id = req.body.ctf_id;
        ip = utils.getClientIPv4(req);
        const ip_global = req.body.ip;
        if (!machine_name || !default_password || !ctf_id || !ip_global) {
            return res.status(400).send('machine_name, default_password, ctf_id, global ip are required');
        }
        const id = Number(await dbService.getInstanceId(ctf_id, machine_name, ip))
        if(id != 0 && id != "NaN"){
            console.log("id: ", id);
            console.log("instance already exist");
            return res.status(400).send('instance already exist');
        }
        rows = await dbService.getDefaultPassword(ctf_id, machine_name);
        if (default_password != rows.default_password) {
            console.log("Error wrong password");
            return res.status(400).send('wrong password');
        }
        const new_cookie = createCookie();
        const result = await dbService.createInstance(ctf_id, machine_name, ip, ip_global, new_cookie);
        const instance = result[0].instance_id;
        notifData = {
            "type": "new_instance",
            "machine_name": machine_name,
            "ip": ip,
            "ip_global": ip_global,
            "instance_id": instance,
            "ctf_id": ctf_id
        }
        console.log("notifData: ", notifData)
        sendEventsToAll(notifData, req.connections);
        res.status(200).json({ instance, new_cookie });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post("/logout", validateArgs, checkVMCookie, sseMiddleware, async (req, res) => {
    try {
        const instance_id = req.body.instance_id;
        const ctf_id = req.body.ctf_id;
        if (!instance_id || !ctf_id) {
            return res.status(400).send('Error: instance_id and ctf_id  are required');
        }

        const response = await dbService.logoutVmInstance(instance_id);
        if(response.affectedRows == 0){
            return res.status(400).send('Error: already logged out');
        }
        notifData = {
            "type": "logout",
            "ctf_id": ctf_id,
            "instance_id": instance_id,
        }
        sendEventsToAll(notifData, req.connections);
        res.status(200).send('OK');
    } catch (error) {
        res.status(500).send(error.message);
    }
});


router.post('/getInstanceId/', validateArgs, async (req, res) => {
    try {
        const ctf_id = req.body.ctf_id;
        const machine_name = req.body.machine_name;
        const ip = req.body.ip;
        if (!ctf_id || !machine_name || !ip) {
            return res.status(400).send('ctf_id, machine_name, and ip are required');
        }
        const instanceId = await dbService.getInstanceId(ctf_id, machine_name, ip);
        res.json(instanceId);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


//------------------ Shall be Auth ------------------//
router.post('/testAuth/', checkVMCookie, async (req, res) => {
    try {
        res.send('OK');
    } catch (error) {
        res.status(500).send(error.message);
    }
});



router.post('/pwn', validateArgs, checkVMCookie, sseMiddleware, async (req, res) => {
    try {
        const instance_id = req.body.instance_id;
        const ctf_id = req.body.ctf_id;
        const ip = utils.getClientIPv4(req);
        const password = req.body.password;
        const ctf_machine_name = req.body.machine_name;

        if (!instance_id || !ctf_id || !password || !ctf_machine_name) {
            return res.status(400).send('Error: instance_id, ctf_id, ctf_machine_name and password are required');
        }

        // Control machine name
        const instance = await dbService.getMachineName(instance_id);
        if(instance.machine_name != ctf_machine_name){
            return res.status(400).send('Error: wrong machine name');
        }

        // Control if the user password is correct
        const user = await dbService.checkUserPassword(password);
        if(user == null){
            return res.status(400).send('Error: wrong password');
        }
        const user_id = user.user_id;
        console.log("user: ", user);

        const response = await dbService.pwn(ctf_id, ctf_machine_name, user_id);
        if(response.affectedRows == 0){
            return res.status(400).send('Error: already pwned');
        }
        const nb_pwns = await dbService.getPwnStat(ctf_id, ctf_machine_name);
        const users = await dbService.listUsers(ctf_id);
        const nb_users = users.length;
        console.log("nb_pwns: ", nb_pwns)
        console.log("nb_users: ", nb_users)
        if (nb_pwns >= nb_users){
            notifData = {
                "type": "totally_pwned",
                "machine": ctf_machine_name,
                "ctf_id": ctf_id,
            }
            sendEventsToAll(notifData, req.connections);
        }
        notifData = {
            "type": "pwn",
            "user": user.username,
            "machine": ctf_machine_name,
            "ctf_id": ctf_id,
            "day": getFormattedDate(),
            "hour": getFormattedHour(),
        }

        console.log(convertToYYYYMMDD(new Date().toISOString()))
        console.log(convertToDateSQL(new Date().toISOString()))
        console.log(getFormattedDate())
        console.log(getFormattedHour())
        console.log(new Date().toISOString())




        sendEventsToAll(notifData, req.connections);
        const new_cookie = createCookie();
        await dbService.updateCookie(instance_id, new_cookie);
        res.status(200).json({'cookie_machine':new_cookie});
    } catch (error) {
        res.status(500).send(error.message);
    }
});



module.exports = router;