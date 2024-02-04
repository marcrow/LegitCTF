// src/services/dbService.js
const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    port: process.env.DB_PORT || 3306,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

async function testConnection() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT 1 as val");
        return rows; 
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

async function getCompromisedData() {
    let conn;
    try {
        conn = await pool.getConnection();
        // Modify the query to fetch the actual compromised data
        const rows = await conn.query("SELECT user_id, DATE(compromise_time) AS date, COUNT(*) AS num_compromised FROM pwned GROUP BY user_id, DATE(compromise_time);");
        return rows;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}



async function getPwnedInfo(ctfId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
            SELECT 
                u.username,
                m.machine_name,
                p.compromise_time
            FROM 
                pwned p
            JOIN 
                users u ON p.user_id = u.user_id
            JOIN 
                ctfs_machines m ON p.ctf_id = m.ctf_id AND p.ctf_machine_name = m.machine_name
            WHERE 
                p.ctf_id = ?
            ORDER BY 
                p.compromise_time ASC;
        `;
        const rows = await conn.query(query, [ctfId]);
        return rows;
    } catch (err) {
        console.error('Error in getPwnedInfo:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function getPwnedInfoByDate(ctfId, pwn_date){
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
            SELECT 
                u.username,
                m.machine_name,
                p.compromise_time
            FROM 
                pwned p
            JOIN 
                users u ON p.user_id = u.user_id
            JOIN 
                ctfs_machines m ON p.ctf_id = m.ctf_id AND p.ctf_machine_name = m.machine_name
            WHERE 
                p.ctf_id = ? AND DATE(compromise_time) = ?
            ORDER BY 
                p.compromise_time ASC;
        `;
        const rows = await conn.query(query, [ctfId, pwn_date]);
        return rows;
    } catch (err) {
        console.error('Error in getPwnedInfoByDate:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function getLastPwn(ctfId) {
    let conn;

    try {
        conn = await pool.getConnection();
        const query = `
        SELECT MAX(compromise_time) 
        AS latestCompromiseTime 
        FROM pwned 
        WHERE ctf_id = ?;
        `;
        const [rows] = await conn.query(query, [ctfId]);
        return rows;
    } catch (err) {
        console.error('Error in getPwnedInfo:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}



async function listCtf() {
    let conn;
    try {
        // The query to retrieve all CTFs
        const query = 'SELECT ctf_id, ctf_name from ctfs';

        // Establishing a connection from the pool
        conn = await pool.getConnection();
        const ctfData = await conn.query(query);

        // Close the connection
        conn.end();

        // If no data is found, handle the case accordingly
        if (!ctfData || ctfData.length === 0) {
            return null; // or handle this case as needed
        }

        console.log(ctfData); // Log the data for debugging

        return ctfData; // Return all the retrieved data
    } catch (error) {
        // Handle or log the error appropriately
        throw new Error('Error retrieving CTF data: ' + error.message);
    } finally {
        // Ensure the connection is closed even if an error occurs
        if (conn) conn.end();
    }
}


async function listUsers(ctfId) {
    let conn;
    try {
        // The query to retrieve all CTFsSELECT u.user_id, u.username

        const query = 'SELECT u.user_id, u.username FROM users u JOIN users_ctfs uc ON u.user_id = uc.user_id WHERE uc.ctf_id = ?;';
        const values = [ctfId];

        // For MySQL, using promise-based query execution
        conn = await pool.getConnection();
        const ctfData = await conn.query(query, values);
        conn.end();

        // If no data is found, handle the case accordingly
        if (!ctfData || ctfData.length === 0) {
            return null; // or handle this case as needed
        }

        console.log(ctfData); // Log the data for debugging

        return ctfData; // Return all the retrieved data
    } catch (error) {
        // Handle or log the error appropriately
        throw new Error('Error retrieving CTF data: ' + error.message);
    } finally {
        // Ensure the connection is closed even if an error occurs
        if (conn) conn.end();
    }
}

/**
 * Retrieves a CTF by its ID from the database.
 * @param {number} ctfId - The ID of the CTF to retrieve.
 * @returns The CTF data or null if not found.
 */
async function getCtfById(ctfId) {
    let conn
    try {
        // Assuming ctfId has been validated as an integer before this function is called

        // Using a parameterized query to avoid SQL injection
        const query = 'SELECT * FROM ctfs WHERE ctf_id = ?';
        const values = [ctfId];

        // For MySQL, using promise-based query execution
        conn = await pool.getConnection();
        const [ctfData] = await conn.query(query, values);
        conn.end();

        // Check if CTF data is found
        if (!ctfData || ctfData.length === 0) {
            return null; // or throw an error or however you want to handle this case
        }

        return ctfData; // Assuming you want the first match (should be only one due to ID uniqueness)
    } catch (error) {
        // Handle or log the error appropriately
        throw new Error('Error retrieving CTF data: ' + error.message);
    } finally {
        // Ensure the connection is closed even if an error occurs
        if (conn) conn.end();
    }
}

async function listVMInstance(ctf_id) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                instance_id, machine_name, ip, is_running
            FROM 
                ctf_vm_instance
            WHERE 
                ctf_id = ? AND is_running = True;
        `;
        const rows = await conn.query(query, [ctf_id]);
        return rows;
    } catch (err) {
        console.error('Error in listVMInstance:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function listAllVmInstance(ctf_id) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                instance_id, machine_name, ip, is_running
            FROM 
                ctf_vm_instance
            WHERE 
                ctf_id = ?;
        `;
        const rows = await conn.query(query, [ctf_id]);
        return rows;
    } catch (err) {
        console.error('Error in listAllVmInstance:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function changeVmInstanceStatus(instance_id, status) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            UPDATE 
                ctf_vm_instance
            SET
                is_running = ?
            WHERE 
                instance_id = ?;
        `;
        const rows = await conn.query(query, [status, instance_id]);
        return rows;
    } catch (err) {
        console.error('Error in changeVmInstanceStatus:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function getMachineWithNoInstance(ctf_id) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT
                machine_name
            FROM   
                ctfs_machines
            WHERE   
                ctf_id = ? AND machine_name NOT IN (SELECT machine_name FROM ctf_vm_instance WHERE ctf_id = ?);
        `;
        const rows = await conn.query(query, [ctf_id, ctf_id]);
        return rows;
    } catch (err) {
        console.error('Error in getMachineWithNoInstance:', err);
        throw err; 
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

//------------------ VMInstance ------------------//
async function getInstanceId(ctf_id, machine_name, ip) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                instance_id
            FROM 
            ctf_vm_instance
            WHERE 
                ctf_id = ? AND machine_name = ? AND IP = ?;
        `;
        const rows = await conn.query(query, [ctf_id, machine_name, ip]);
        return rows;
    } catch (err) {
        console.error('Error in getInstanceId:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function instanceExist(ctf_id, machine_name, ip) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                COUNT *
            FROM 
                ctf_vm_instance
            WHERE 
                ctf_id = ? AND machine_name = ? AND IP = ?;
        `;
        const rows = await conn.query(query, [ctf_id, machine_name, ip]);
        return Number(rows);
    } catch (err) {
        console.error('Error in instanceExist:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function getDefaultPassword(ctf_id, machine_name) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
        SELECT 
            default_password
        FROM
            ctfs_machines
        WHERE
            ctf_id = ? AND machine_name = ?;
        `;
        const [rows] = await conn.query(query, [ctf_id, machine_name]);
        return rows;
    } catch (err) {
        console.error('Error in getDefaultPassword:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function createInstance(ctf_id, machine_name, ip, cookie) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            INSERT INTO 
                ctf_vm_instance (ctf_id, machine_name, IP, is_running, cookie)
            VALUES 
                (?, ?, ?, True, ?);
        `;
        const rows = await conn.query(query, [ctf_id, machine_name, ip, cookie]);
        return await getInstanceId(ctf_id, machine_name, ip);
    } catch (err) {
        console.error('Error in createInstance:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}


async function addVmInstanceCookie(instanceId , cookieValue) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            UPDATE 
                ctf_vm_instance
            SET
                cookie = ?
            WHERE 
                instance_id = ?;
        `;
        const rows = await conn.query(query, [instanceId, cookieValue]);
        return rows;
    } catch (err) {
        console.error('Error in addVmInstanceCookie:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function logoutVmInstance(instance_id){
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            DELETE FROM ctf_vm_instance WHERE instance_id = ?;
        `;
        const rows = await conn.query(query, [instance_id]);
        return rows;
    } catch (err) {
        console.error('Error in logout:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function getCookie(instanceId) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                *
            FROM 
                ctf_vm_instance
            WHERE 
                instance_id = ?;
        `;
        const rows = await conn.query(query, [instanceId]);
        return rows;
    } catch (err) {
        console.error('Error in verifyCookie:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function updateCookie(instanceId, cookieValue) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            UPDATE 
                ctf_vm_instance
            SET
                cookie = ?
            WHERE 
                instance_id = ?;
        `;
        const rows = await conn.query(query, [cookieValue, instanceId]);
        return rows;
    } catch (err) {
        console.error('Error in updateCookie:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function getMachineName(instanceId){
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                machine_name
            FROM 
                ctf_vm_instance
            WHERE 
                instance_id = ?;
        `;
        const [rows] = await conn.query(query, [instanceId]);
        return rows;
    } catch (err) {
        console.error('Error in checkMachineName:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function checkUserPassword(password) {
    let conn;
    console.log(password)
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                *
            FROM 
                users
            WHERE 
                password = ?;
        `;
        const [rows] = await conn.query(query, [password]);
        return rows;
    } catch (err) {
        console.error('Error in checkUserPassword:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function pwn(ctf_id, ctf_machine_name, user_id) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            INSERT INTO 
                pwned (ctf_id, ctf_machine_name, user_id, compromise_time)
            VALUES 
                (?, ?, ?, NOW());
        `;
        const rows = await conn.query(query, [ctf_id, ctf_machine_name, user_id]);
        return rows;
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            throw new Error('Duplicate entry');
        } else {
            console.error('Error in pwn:', err);
            throw err;
        }
    } finally {
        if (conn) conn.release(); // release to pool
    }
}


//------------------ Admin ------------------//
async function checkAdminPassword(username, password) {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                admin_id
            FROM 
                admin
            WHERE 
                username = ? AND password = ?;
        `;
        const [rows] = await conn.query(query, [username, password]);
        return rows;
    } catch (err) {
        console.error('Error in checkAdminPassword:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function updateCtf(ctfId, ctfName, startDate, endDate, startHour, endHour){
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            UPDATE 
                ctfs
            SET
                ctf_name = ?,
                start_date = ?,
                end_date = ?,
                start_hour = ?,
                end_hour = ?
            WHERE 
                ctf_id = ?;
        `;
        const rows = await conn.query(query, [ctfName, startDate, endDate, startHour, endHour, ctfId]);
        return rows;
    } catch (err) {
        console.error('Error in updateCtf:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
} 

async function getCtfUser(ctfId){
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                u.user_id, u.username, u.password
            FROM 
                users u
            JOIN
                users_ctfs uc ON u.user_id = uc.user_id
            WHERE 
                uc.ctf_id = ?;
        `;
        const rows = await conn.query(query, [ctfId]);
        return rows;
    } catch (err) {
        console.error('Error in getCtfUser:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function testIfUserExistsInCtf(ctfId, user_id){
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                user_id
            FROM 
                users_ctfs
            WHERE 
                ctf_id = ? AND user_id = ?;
        `;
        const [rows] = await conn.query(query, [ctfId, user_id]);
        if (rows && rows.user_id){
            return true;
        } else return false;
    } catch (err) {
        console.error('Error in testIfUserExists:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}


async function testIfUserExists(username){
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                user_id
            FROM 
                users
            WHERE 
                username = ?;
        `;
        const [row] = await conn.query(query, [username]);
        console.log("row", row);
        if (row && row.user_id){
            return row.user_id;
        } else return false;
    } catch (err) {
        console.error('Error in testIfUserExists:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}



async function createUser(ctfId, username, password){
    let conn;
    try {
        conn = await pool.getConnection();
        let isExist = await testIfUserExists(username);
        console.log("isExist: ", isExist);
        if(isExist != false){
            return isExist;
        }
        const query = `
            INSERT INTO 
                users (username, password)
            VALUES 
                (?, ?);
        `;
        const rows = await conn.query(query, [username, password]);
        if(rows.affectedRows > 0){
            let isExist = await testIfUserExists(username);
            console.log("isExist: ", isExist);
            return isExist;
        }
        return rows;
    } catch (err) {
        console.error('Error in createUser:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}



async function addUserToCtf(ctfId, userId){
    let conn;
    try {
        conn = await pool.getConnection();
        const isExist = await testIfUserExistsInCtf(ctfId, userId);
        if(isExist == true){
            return false;
        }
        const query = `
            INSERT INTO 
                users_ctfs (user_id, ctf_id)
            VALUES 
                (?, ?);
        `;
        const rows = await conn.query(query, [userId, ctfId]);
        return rows;
    } catch (err) {
        console.error('Error in addUserToACtf:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function resetPassword(username, password){
    let conn;
    try {
        let isExist = await testIfUserExists(username);
        if(isExist == false){
            return false;
        }
        conn = await pool.getConnection();

        const query = `
            UPDATE 
                users
            SET
                password = ?
            WHERE 
                username = ?;
        `;
        const rows = await conn.query(query, [password, username]);
        return rows;
    } catch (err) {
        console.error('Error in resetPassword:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}


async function getPwnStat(ctfId, machine_name){
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("ctfId: ", ctfId);
        console.log("machine_name: ", machine_name);
        const query = `
            SELECT 
                COUNT(*) AS count
            FROM 
                pwned
            WHERE 
                ctf_id = ? AND ctf_machine_name = ?
            GROUP BY
                ctf_id;
        `;
        const rows = await conn.query(query, [Number(ctfId), machine_name]);
        console.log("rows: ", rows);
        if (rows.length > 0) {
            return parseInt(rows[0]['count']);
        } else {
            return 0;
        }
    } catch (err) {
        console.error('Error in getPwnStat:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}

async function getMachineList(ctfId){
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT 
                machine_name
            FROM 
                ctfs_machines
            WHERE 
                ctf_id = ?;
        `;
        const rows = await conn.query(query, [ctfId]);
        return rows;
    } catch (err) {
        console.error('Error in getMachineList:', err);
        throw err;
    } finally {
        if (conn) conn.release(); // release to pool
    }
}


module.exports = { testConnection, getCompromisedData, getPwnedInfo, getCtfById, listCtf, listUsers, getPwnedInfoByDate, getLastPwn, getInstanceId, addVmInstanceCookie, getCookie, getDefaultPassword, instanceExist, createInstance, checkUserPassword, pwn, updateCookie, getMachineName, checkAdminPassword, updateCtf, getCtfUser, testIfUserExists, createUser, addUserToCtf, resetPassword, listVMInstance, getMachineWithNoInstance, logoutVmInstance, listAllVmInstance, changeVmInstanceStatus, getMachineList, getPwnStat};
