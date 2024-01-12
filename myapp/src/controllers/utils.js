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

module.exports = {
    convertToDateSQL, convertToYYYYMMDD
};