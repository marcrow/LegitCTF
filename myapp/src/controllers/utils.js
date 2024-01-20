function convertToDateSQL(dateInt) {
    const dateStr = String(dateInt);
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);

    return `${year}-${month}-${day}`;
}

function convertToYYYYMMDD(sqlDateStr) {
    return sqlDateStr.replace(/-/g, '');
}

function getClientIPv4(req) {
    const ip = req.socket.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        return ip.substr(7)
    }
    return ip;
}

module.exports = {
    convertToDateSQL, convertToYYYYMMDD, getClientIPv4
};

