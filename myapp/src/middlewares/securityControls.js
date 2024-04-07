const dbService = require('../services/dbService'); // Adjust the path as necessary
const utils = require('../controllers/utils');
const cookie = require('cookie');

function validateInteger(paramName) {
    return function(req, res, next) {
        const paramValue = parseInt(req.params[paramName]);
        if (!Number.isInteger(paramValue)) {
            return res.status(400).send(`${paramName} must be an integer`);
        }
        req.validatedParams = req.validatedParams || {};
        req.validatedParams[paramName] = paramValue;
        next();
    }
}

function validateQueryInteger(req, res, next) {
    paramName = 'ctf_id';
    let paramValue = parseInt(req.query[paramName]);
    
    if (!Number.isInteger(paramValue)) {
        return res.status(400).send(`${paramName} must be an integer`);
    }
    req.validatedParams = req.validatedParams || {};
    req.validatedParams[paramName] = paramValue;
    next();
}

function validateArgs(req, res, next) {
    validateParam(req, res, function(err) {
        if (err) {
            return next(err);
        }
        validateQuery(req, res, function(err) {
            if (err) {
                return next(err);
            }
            validateBody(req, res, next);
        });
    });
}

function validateBody(req, res, next) {
    if (req.method === 'POST' || req.method === 'DELETE') {
        console.log("req.body: ", req.body)
        const bodyParams = Object.keys(req.body);
        for (const param of bodyParams) {
            let result;
            if (param === 'ctf_id'){
                result = validate_ctf_id(req.body[param])
                if(result == -1){
                    return res.status(400).send(`Invalid body parameter: ${param}`);
                }
            }
            if (param === 'date'){
                result = validate_date(req.body[param])
                if(result == -1){
                    return res.status(400).send(`Invalid body parameter: ${param}`);
                }   
            }
            if(param === 'instance_id'){
                result = validate_VmInstance(req.body[param])
                if(result == -1){
                    return res.status(400).send(`Invalid body parameter: ${param}`);
                }   
            }
            if(param === 'ip'){
                result = validateIp(req.body[param])
                if(result == -1){
                    return res.status(400).send(`Invalid ip parameter: ${param}`);
                }   
            }
            if(param == 'start_date' || param == 'end_date'){
                result = validate_date(req.body[param])
                if(result == -1){
                    return res.status(400).send(`Invalid body parameter: ${param}`);
                }   
            }
            if(param == 'start_hour' || param == 'end_hour'){
                result = validate_ctf_id(req.body[param])
                if(result == -1){
                    return res.status(400).send(`Invalid body parameter: ${param}`);
                }   
            }
            if(param == 'ctf_name'){
                result = validate_ctfName(req.body[param])
                if(result == -1){
                    return res.status(400).send(`Invalid body parameter: ${param}`);
                }   
            }
            if(param == 'username'){
                result = validate_username(req.body[param])
                if(result == -1){
                    return res.status(400).send(`Invalid body parameter: ${param}`);
                }   
            }
        }
    }
    next();
}

function validateQuery(req, res, next) {
    const queryParams = Object.keys(req.query);
    for (const param of queryParams) {
        let result;
        if (param === 'ctf_id'){
            result = validate_ctf_id(req.query[param])
            if(result == -1){
                return res.status(400).send(`Invalid query parameter: ${param}`);
            }
        }
        if (param === 'date'){
            result = validate_date(req.query[param])
            if(result == -1){
                return res.status(400).send(`Invalid query parameter: ${param}`);
            }   
        }
    }
    next();
}

function validateParam(req, res, next) {
    const queryParams = Object.keys(req.params);
    for (const param of queryParams) {
        let result;
        if (param === 'ctf_id'){
            result = validate_ctf_id(req.params[param])
            if(result == -1){
                return res.status(400).send(`Invalid query parameter: ${param}`);
            }
        }
        if (param === 'date'){
            result = validate_date(req.params[param])
            if(result == -1){
                return res.status(400).send(`Invalid query parameter: ${param}`);
            }   
        }
    }
    next();
}

function validate_ctf_id(ctf_id){   
    ctf_id = parseInt(ctf_id);
    if (!Number.isInteger(ctf_id) || ctf_id < 0) {
        return -1;
    }   
    return ctf_id;
}

function validate_date(date){
    console.log("date: ", date)
    if (typeof date !== 'string'){
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.length != 8) {
            return -1;
        }   
    } 
    return date;
}

function validate_VmInstance(vmInstance){
    vmInstance = parseInt(vmInstance);
    if (!Number.isInteger(vmInstance) || vmInstance < 0) {
        return -1;
    }   
    return vmInstance;
}

function validateIp(ip){
    var ipaddr = require('ipaddr.js');
    if (ipaddr.isValid(ip)) {
        return true;
    }
    return false;
}

function validate_ctfName(ctfName){
    if (typeof ctfName !== 'string' || ctfName.length > 50) {
        return -1;
    }   
    return ctfName;
}

function validate_username(username){
    if (typeof username !== 'string' || username.length > 25) {
        return -1;
    }   
    return username;
}


const ip_req = require('ip');
function checkIfIpIsAllowed(ipAddress, subnet){
        // Utilisez la fonction `ip.cidrSubnet()` pour créer un objet de sous-réseau à partir de la notation CIDR
    const subnetObject = ip_req.cidrSubnet(subnet);
    min_address = Number(subnetObject.firstAddress.replace(/\./g, ''));
    max_address = Number(subnetObject.lastAddress.replace(/\./g, ''));
    ipAddress = Number(ipAddress.replace(/\./g, ''));
    return ipAddress >= min_address && ipAddress <= max_address;    
}





function machineAccess(req, res, next) {
    var machinesNetwork = process.env.MACHINE_NETWORK;
    var ipnumber = utils.getClientIPv4(req);
    if (checkIfIpIsAllowed(ipnumber, machinesNetwork))
    {
        next();
    }
    else
    {
        console.log("Forbidden access from " + ipnumber);
        res.status(403).send('Forbidden');
    }
}


function controlAdminSession(req, res, next) {
    if(req.path == "/login" || req.path == "/logout" || req.path == "/admin/login"){
        next();
        return;
    }
    
    if(req.session && req.session.admin){
        next();
    }
    else{
        var ipnumber = utils.getClientIPv4(req);
        console.log("Forbidden access from (no session)" + ipnumber);
        return res.redirect('/admin/login'); // Redirect to the login page
    }
}

function controlAdminNetwork(req, res, next) {
    var adminNetwork = process.env.ADMIN_NETWORK
    var ipnumber = utils.getClientIPv4(req);
    if (checkIfIpIsAllowed(ipnumber, adminNetwork))
    {
        next();
    }
    else
    {
        console.log("Forbidden access from " + ipnumber);
        return res.status(403).send('Forbidden');
    }
}

function adminAccess(req, res, next) {
    // Call controlAdminNetwork middleware
    controlAdminNetwork(req, res, function(err) {
        if (err) {
            return res.status(403).send('Forbidden');
        }
        
        // Call controlAdminSession middleware
        controlAdminSession(req, res, function(err) {
            if (err) {
                return res.redirect('/admin/login');
            }
            next();
        });
    });
}

//----------------VM Controlls----------------

function checkVMCookie (req, res, next) {
    const instance_id = req.body.instance_id
    if (!instance_id) {
        return res.status(401).send('No instance id found');
    }
    const cookies = cookie.parse(req.headers.cookie || '');
    console.log("cookies: ", cookies);
    const cookieValue = cookies.Cookie_machine;
    if (!cookieValue) {
        console.log("cookie not found");
        return res.status(401).send('No cookie found');
    }
    if(cookieValue.length != 64){
        console.log("cookie invalid");
        return res.status(401).send('Invalid cookie');
    }
    dbService.getCookie(instance_id).then(function(result){
        if(result.length == 0){
            console.log("len 0");
            return res.status(401).send('Invalid cookie');
        }
        data = result[0];
        if(data.cookie != cookieValue){
            console.log("cookie invalid2");
            return res.status(401).send('Invalid cookie');
        }
        if(utils.getClientIPv4(req) != data.ip){
            console.log(utils.getClientIPv4(req) + " " + data.ip);
            console.log("ip invalid");
            return res.status(401).send('Invalid Instance');
        }
        next();
    });
};



module.exports = {
    validateInteger, 
    validateQueryInteger,
    validateArgs,
    machineAccess,
    checkVMCookie,
    adminAccess 
};