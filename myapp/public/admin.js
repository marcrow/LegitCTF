
document.addEventListener('DOMContentLoaded', async function () {
    await listCtf();
    ctfId = retrieveCtfIdFromDropdown();
    attachDropdownListener();
    fetchCtfDetails(ctfId);
    const users = await retrieveUsers(ctfId);
    fillUserTable(users);
    const machines = await retrieveMachines(ctfId);
    fillMachineTable(machines);
    const pwns = await retrievePwnMachines(ctfId);
    fillPwnTable(pwns);

});


function attachDropdownListener() {
    const container = document.getElementById('ctf-dropdown-container');
    container.addEventListener('change', async function (event) {
        if (event.target.id === 'ctf-select') {
            const ctfId = event.target.value;
            await fetchCtfDetails(ctfId);
            const users = await retrieveUsers(ctfId);
            fillUserTable(users);
            const machines = await retrieveMachines(ctfId);
            fillMachineTable(machines);
            const pwns = await retrievePwnMachines(ctfId);
            fillPwnTable(pwns);
        }
    });
}

async function fetchCtfDetails(ctfId) {
    const baseUrl = '/api/ctfs/'; // Replace with your actual base URL
    try {
        const response = await fetch(baseUrl + ctfId);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const ctf = await response.json();
        storeCtfDetails(ctf);
        displayCtfDetails(ctf);
        fillchangeDetails(ctf);
    } catch (error) {
        console.error('Fetching CTF details failed:', error);
        document.getElementById('ctfDetails').textContent = 'Failed to load CTF details.';
    }
}

function displayCtfDetails(ctf) {
    // Update the DOM with the CTF details
    const detailsElement = document.getElementById('ctfDetails');
    detailsElement.innerHTML = `
        <h2>${ctf.ctf_name}</h2>
        <p>Start Date: ${ctf.start_date}</p>
        <p>End Date: ${ctf.end_date}</p>
        <p> Start Hour: ${ctf.start_hour}</p>
        <p> End Hour: ${ctf.end_hour}</p>
        <!-- Add more details as needed -->
    `;

}

function fillElement(element, value) {
    if(element){
        element.value = value;
    }
    else{
        console.log(value)
    }
}

function formatDate(date) {
    if(date.includes('T')){
        date = date.split('T')[0];
    }
    console.log(date)
    let parts = date.split('-');
    let d = new Date(parts[0], parts[1] - 1, parts[2]);
    let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    console.log([year, month, day].join('-'))
    return [year, month, day].join('-');
}

function fillchangeDetails(ctf) {
    // Update the DOM with the CTF details
    const detailsElement = document.getElementById('changeDetails');
    let inputName = detailsElement.querySelector('#ctf_name');
    fillElement(inputName, ctf.ctf_name);
    inputName = detailsElement.querySelector('#ctf_id');
    fillElement(inputName, ctf.ctf_id);
    inputName = detailsElement.querySelector('#start_date');
    fillElement(inputName, formatDate(ctf.start_date));
    inputName = detailsElement.querySelector('#end_date');
    fillElement(inputName, formatDate(ctf.end_date));
    inputName = detailsElement.querySelector('#start_hour');
    fillElement(inputName, ctf.start_hour);
    inputName = detailsElement.querySelector('#end_hour');
    fillElement(inputName, ctf.end_hour);



}



/* -------------- CTF dropdown -------------- */

async function listCtf() {
    await fetch('/api/listCtfs')
        .then(response => response.json())
        .then(data => {
            createCtfDropdown(data);
        })
        .catch(error => console.error('Error fetching CTF data:', error));
}

function createCtfDropdown(ctfs) {
    const container = document.getElementById('ctf-dropdown-container');
    const select = document.createElement('select');
    select.name = 'ctf';
    select.id = 'ctf-select';

    let maxCtfId = 0;
    ctfs.forEach(ctf => {
        const option = document.createElement('option');
        option.value = ctf.ctf_id;
        option.textContent = ctf.ctf_name;
        select.appendChild(option);

        if (ctf.ctf_id > maxCtfId) {
            maxCtfId = ctf.ctf_id; // Keep track of the max ctf_id
        }
    });

    container.appendChild(select);

    // Select the CTF with the highest ID by default
    select.value = maxCtfId;
}

function retrieveCtfIdFromDropdown() {
    const ctfSelect = document.getElementById('ctf-select');
    const selectedCtfId = ctfSelect.value;
    return selectedCtfId;
}

function convertToYYYYMMDD(sqlDateStr) {
    let DateStr = sqlDateStr.split('T')[0];
    DateStr = DateStr.replace(/-/g, '');
    return Number(DateStr);
}

function storeCtfDetails(ctf) {
    localStorage.setItem('ctf_start_hour', ctf.start_hour);
    localStorage.setItem('ctf_end_hour', ctf.end_hour);
    localStorage.setItem('ctf_start_date', convertToYYYYMMDD(ctf.start_date));
    localStorage.setItem('ctf_end_date', convertToYYYYMMDD(ctf.end_date));
}

function displayCtfDetails(ctf) {
    // Update the DOM with the CTF details
    const detailsElement = document.getElementById('ctfDetails');
    detailsElement.innerHTML = `
        <h2>${ctf.ctf_name}</h2>
        <p>Start Date: ${ctf.start_date}</p>
        <p>End Date: ${ctf.end_date}</p>
        <p> Start Hour: ${ctf.start_hour}</p>
        <p> End Hour: ${ctf.end_hour}</p>
        <!-- Add more details as needed -->
    `;

}

//-----------------User info-----------------
let nb_users = 0; 
// Retrieve users from the server
async function retrieveUsers(ctfId) {
    const response = await fetch(`/admin/users?ctf_id=${ctfId}`);
    const users = await response.json();
    nb_users = users.length;
    const pUser = document.getElementById('nbUser');
    pUser.innerHTML = `Number of users: ${nb_users}`;
    updateAddUserForm(ctfId);
    return users;
}

function getDefaulUserTable(){
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '';
    let row = document.createElement('tr');
    row.innerHTML = `
    <tr class="firstRow">
        <th>Username</th>
        <th>Password</th>
        <th>Action</th>
    </tr>`;
    tableBody.appendChild(row);
    return tableBody;
}

// Fill the table with user data
function fillUserTable(users) {
    const tableBody = getDefaulUserTable();
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.password}</td>
            <td><button onclick="resetPassword('${user.username}')">Reset Password</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function  updateAddUserForm(ctf_id){
    const user_id_element = document.getElementById('u_ctf_id');
    user_id_element.value = ctf_id;
}

async function resetPassword(username) {
    fetch('/admin/resetPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
    })
    .then(response => response.json()) // Parse the JSON response into a JavaScript object
    .then(response => {
        console.log("new_password: ", response.password)
        if (response.password) {
            const tableBody = document.getElementById('userTableBody');
            const rows = tableBody.getElementsByTagName('tr');
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName('td');
                if(cells.length > 1){
                    if (cells[0].innerText === username) {
                        // Retrieve the table cell that contains the password
                        console.log("Table cell with password:", cells[1]);
                        cells[1].innerText = response.password;
                        break;
                    }
                }
            }
        }
        else{
            console.log("Error: trouble in resetPassword")
        }
    })
    .catch(error => console.error('Error:', error));
    
}

//-----------------Machine info-----------------
async function retrieveMachines(ctfId) {
    const response = await fetch(`/admin/machines?ctf_id=${ctfId}`);
    const machines = await response.json();
    return machines;
}

function getDefaulMachineTable(){
    const tableBody = document.getElementById('machineTableBody');
    tableBody.innerHTML = '';
    let row = document.createElement('tr');
    row.innerHTML = `
    <tr class="firstRow">
        <th>Machine</th>
        <th>IP</th>
        <th>State</th>
        <th>Action</th>
    </tr>`;
    tableBody.appendChild(row);
    return tableBody;
}

// Fill the table with user data
function fillMachineTable(machines) {
    const tableBody = getDefaulMachineTable();
    machines.forEach(machine => {
        button2 = '';
        if(machine.is_running == true){
            machine.state = "running";
            button2 = `<button class="stateButton" onclick="stopMachine('${machine.instance_id}')">Stop</button>`;
        }else{
            machine.state = "stopped";
            button2 = `<button class="stateButton" onclick="startMachine('${machine.instance_id}','${machine.ip_global}','${machine.machine_name}')">Start</button>`;
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${machine.machine_name}</td>
            <td>${machine.ip_global}</td>
            <td>${machine.state}</td>
            <td>${button2}<button onclick="kill('${machine.instance_id}')">Kill</button></td>
            <td class="hiddenCells">${machine.instance_id}</td> 
        `;
        tableBody.appendChild(row);
    });
}

function setStateButton(button, state){
    instance_id = button.parentElement.parentElement.getElementsByTagName('td')[4].innerText;
    ip = button.parentElement.parentElement.getElementsByTagName('td')[1].innerText;
    machine_name = button.parentElement.parentElement.getElementsByTagName('td')[0].innerText;  
    if(state == "running"){
        button.innerText = "Stop";
        button.onclick = function() { stopMachine(instance_id) };
    }else{
        button.innerText = "Start";
        oldOnClick = button.onclick;
        button.onclick = function() { startMachine(instance_id, ip, machine_name) };
    }
}

function retrieveButtonByClass(line, className){
    const buttons = line.getElementsByTagName('button');
    for (let i = 0; i < buttons.length; i++) {
        if(buttons[i].className == className){
            return buttons[i];
        }
    }
}

function changeStateButton(line, state){
    const button = retrieveButtonByClass(line, "stateButton");
    setStateButton(button, state);
}


async function startMachine(instance_id, ip, machine_name) {
    const ctf_id = retrieveCtfIdFromDropdown();
    fetch('/admin/machine/state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instance_id, running: true, ctf_id: ctf_id, ip: ip, machine_name: machine_name}),
    })
    .then(response => response.text()) 
    .then(response => {
        if (response) {
            const tableBody = document.getElementById('machineTableBody');
            const rows = tableBody.getElementsByTagName('tr');
            console.log("start machine: ", rows)
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName('td');
                if(cells.length > 1){
                    if (cells[4].innerText === instance_id) {
                        // Retrieve the table cell that contains the state
                        cells[2].innerText = "running";
                        changeStateButton(rows[i], "running");
                        break;
                    }
                }
            }
        }
        else{
            console.log("Error: trouble in startMachine")
        }
    })
    .catch(error => console.error('Error:', error));
    
}

async function stopMachine(instance_id) {
    const ctf_id = retrieveCtfIdFromDropdown();
    fetch('/admin/machine/state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instance_id, running: false, ctf_id: ctf_id}),
    })
    .then(response => response.text()) 
    .then(response => {
        if (response) {
            const tableBody = document.getElementById('machineTableBody');
            const rows = tableBody.getElementsByTagName('tr');
            console.log("stop machine: ", rows)
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName('td');
                if(cells.length > 1){
                    if (cells[4].innerText === instance_id) {
                        // Retrieve the table cell that contains the state
                        cells[2].innerText = "stopped";
                        changeStateButton(rows[i], "stopped");
                        break;
                    }
                }
            }
        }
        else{
            console.log("Error: trouble in stopMachine")
        }
    })
    .catch(error => console.error('Error:', error));
    
}

async function kill(instance_id) {
    fetch('/admin/machine/kill', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instance_id }),
    })
    .then(response => response.text()) 
    .then(response => {
        if (response) {
            const tableBody = document.getElementById('machineTableBody');
            const rows = tableBody.getElementsByTagName('tr');
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName('td');
                if(cells.length > 1){
                    if (cells[4].innerText === instance_id) {
                        // Retrieve the table cell that contains the state
                        tableBody.deleteRow(i);
                        break;
                    }
                }
            }
        }
        else{
            console.log("Error: trouble in kill")
        }
    })
    .catch(error => console.error('Error:', error));
    
}

async function retrievePwnMachines(ctfId) {
    const response = await fetch(`/admin/pwnStat?ctf_id=${ctfId}`);
    const pwns = await response.json();
    return pwns;
}

function getDefaulPwnTable(){
    const tableBody = document.getElementById('pwnTableBody');
    tableBody.innerHTML = '';
    let row = document.createElement('tr');
    row.innerHTML = `
    <tr class="firstRow">
        <th>Machine</th>
        <th>NB Pwned</th>
        <th>Remaining</th>
    </tr>`;
    tableBody.appendChild(row);
    return tableBody;
}

// Fill the table with user data
function fillPwnTable(pwns) {
    const tableBody = getDefaulPwnTable();
    pwns.forEach(pwn => {
        const row = document.createElement('tr');
        let remaining = Number(nb_users) - Number(pwn.pwnStat);
        row.innerHTML = `
            <td>${pwn.machine_name}</td>
            <td>${pwn.pwnStat}</td>
            <td>${remaining}</td>
        `;
        tableBody.appendChild(row);
    });
}


