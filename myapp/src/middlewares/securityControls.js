
function validateInteger(paramName) {
    return function(req, res, next) {
        const paramValue = parseInt(req.params[paramName]);
        if (!Number.isInteger(paramValue)) {
            return res.status(400).send(`${paramName} must be an integer`);
        }
        // If the parameter is an integer, attach it to the request object for downstream use
        req.validatedParams = req.validatedParams || {};
        req.validatedParams[paramName] = paramValue;
        next();
    }
}

module.exports = {
    validateInteger,  
};