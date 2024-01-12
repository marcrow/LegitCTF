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


module.exports = { testConnection, getCompromisedData, getPwnedInfo, getCtfById, listCtf, listUsers, getPwnedInfoByDate, getLastPwn };
