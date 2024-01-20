const crypto = require('crypto');
const dbService = require('..//services/dbService'); // Database service
const cookie = require('cookie');

// Generate a secure cookie value
const generateSecureCookie = () => {
    const cookieValue = crypto.randomBytes(32).toString('hex');
    const encryptedCookieValue = crypto.createHash('sha256').update(cookieValue).digest('hex');
    return encryptedCookieValue;
};

function createCookie(){
    const cookieValue = generateSecureCookie();
    return cookieValue;
}

module.exports = {
    createCookie
};