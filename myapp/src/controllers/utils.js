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

function getFormattedDate(date=null) {
    if (date == null) {
        date = new Date();
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function getFormattedHour(date=null) {
    if (date == null) {
        date = new Date();
    }
    const hours = date.getHours();
    return hours;
}

function getFormatedISODate(date=null) {
    if (date == null) {
        date = new Date();
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours();
    const minutes = date.getMinutes(); 
    const seconds = date.getSeconds();
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
}

module.exports = {
    convertToDateSQL, convertToYYYYMMDD, getClientIPv4, getFormattedDate, getFormattedHour, getFormatedISODate 
};

