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
        validateQuery(req, res, next);
    });
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
    if (typeof date !== 'string' || date.length != 8) {
        return -1;
    }   
    return date;
}

module.exports = {
    validateInteger, 
    validateQueryInteger,
    validateArgs 
};