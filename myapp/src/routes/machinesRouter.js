const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService'); // Adjust the path as necessary
const { validateArgs } = require('../middlewares/securityControls');
const { checkVMCookie } = require('../middlewares/securityControls');
const { createCookie } = require('../controllers/vmCookie');
const utils = require('../controllers/utils');


router.post('/firstAuth/', validateArgs, async (req, res) => {
    try {
        const machine_name = req.body.machine_name;
        const default_password = req.body.default_password;
        const ctf_id = req.body.ctf_id;
        const ip = utils.getClientIPv4(req);
        if (!machine_name || !default_password || !ctf_id) {
            return res.status(400).send('machine_name, default_password, ctf_id are required');
        }
        const id = Number(await dbService.getInstanceId(ctf_id, machine_name, ip))
        if(id != 0 && id != "NaN"){
            console.log("id: ", id)
            return res.status(400).send('instance already exist');
        }
        rows = await dbService.getDefaultPassword(ctf_id, machine_name);
        if (default_password != rows.default_password) {
            return res.status(400).send('wrong password');
        }
        const new_cookie = createCookie();
        const result = await dbService.createInstance(ctf_id, machine_name, ip, new_cookie);
        const instance = result[0].instance_id;
        res.status(200).json({ instance, new_cookie });
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

router.post('/pwn', validateArgs, checkVMCookie, async (req, res) => {
    try {
        const instance_id = req.body.instance_id;
        const ctf_id = req.body.ctf_id;
        const ip = utils.getClientIPv4(req);
        const password = req.body.password;
        const ctf_machine_name = req.body.machine_name;

        if (!instance_id || !ctf_id || !password || !ctf_machine_name) {
            return res.status(400).send('instance_id, ctf_id, ctf_machine_name and password are required');
        }

        const user = await dbService.checkUserPassword(password);
        console.log("user: ", user);
        const user_id = user.user_id;
        if(!user_id || user_id == null){
            return res.status(400).send('wrong password');
        }

        const response = await dbService.pwn(ctf_id, ctf_machine_name, user_id);
        if(response.affectedRows == 0){
            return res.status(400).send('already pwned');
        }
        const new_cookie = createCookie();
        await dbService.updateCookie(instance_id, new_cookie);
        res.status(200).json({'cookie_machine':new_cookie});
    } catch (error) {
        res.status(500).send(error.message);
    }
});



module.exports = router;