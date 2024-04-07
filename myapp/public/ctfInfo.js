/* -------------- Listeners -------------- */



document.addEventListener('DOMContentLoaded', async function () {
    await listCtf();
    ctfId = retrieveCtfIdFromDropdown();
    await fetchCtfDetails(ctfId);

    attachDropdownListener();
    attachCheckboxListener();
    updateGraphBySelection(ctfId);
    listVmInstance(ctfId);
});


function attachDropdownListener() {
    const container = document.getElementById('ctf-dropdown-container');
    container.addEventListener('change', async function (event) {
        if (event.target.id === 'ctf-select') {
            const ctfId = event.target.value;
            await fetchCtfDetails(ctfId);
            const date = retrieveDateFromDropdown();
            updateGraphBySelection(ctfId, date);
            listVmInstance(ctfId);

        }
    });
    const dateContainer = document.getElementById('date-dropdown-container');
    // Perform actions based on the selected date
    dateContainer.addEventListener('change', function (event) {
        if (event.target.id === 'date-select') {
            const ctfId = retrieveCtfIdFromDropdown();
            const date = retrieveDateFromDropdown();
            updateGraphBySelection(ctfId, date);
        }
    });
}

function attachCheckboxListener() {
    const container = document.getElementById('previousPoint');
    container.addEventListener('change', function (event) {
        const ctfId = retrieveCtfIdFromDropdown();
        const date = retrieveDateFromDropdown();
        updateGraphBySelection(ctfId, date);
    });
}

function updateGraphBySelection(ctf_id, date = null) {
    resetChart("compromisedChart");
    generate_daily_graph(ctf_id, "compromisedChart", date);
    resetChart("generalChart");
    generate_global_graph(ctf_id, "generalChart");
}

/* -------------- CTF details -------------- */

/* Fetches CTF details from the API and updates the DOM */
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
        listDates();
    } catch (error) {
        console.error('Fetching CTF details failed:', error);
        document.getElementById('ctfDetails').textContent = 'Failed to load CTF details.';
    }
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


/* -------------- Date dropdown -------------- */

function generateValues(min, max) {
    let array = [];
    for (let i = min; i <= max; i++) {
        array.push(i.toString());
    }
    return array;
}



function listDates() {
    start_date = Number(localStorage.getItem('ctf_start_date'));
    end_date = Number(localStorage.getItem('ctf_end_date'));
    dates = generateValues(start_date, end_date);
    createDateDropdown(dates);
}


function createDateDropdown(dates) {
    const container = document.getElementById('date-dropdown-container');
    if (container.querySelector('#date-select')) {
        container.removeChild(container.querySelector('#date-select'));
    }

    const select = document.createElement('select');
    select.name = 'date';
    select.id = 'date-select';
    let i = 1;

    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = "Jour " + i;
        i++;
        select.appendChild(option);
    });

    container.appendChild(select);

    // Select the first date by default
    select.value = dates[0];

    // Check if date parameter exists in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam) {
        // Verify if the value is in the dropdown and select it
        const option = select.querySelector(`option[value="${dateParam}"]`);
        if (option) {
            select.value = dateParam;
        }
    } else {
        // Retrieve t he current client date
        const currentDate = new Date().toISOString().split('T')[0];
        // Verify if the value is in the dropdown and select it
        const option = select.querySelector(`option[value="${currentDate}"]`);
        if (option) {
            localStorage.setItem('selected_date', currentDate);
            select.value = currentDate;
        }
    }


}




/* -------------- Retrieve data from front -------------- */

function retrieveDateFromDropdown() {
    const dateSelect = document.getElementById('date-select');
    const selectedDate = dateSelect.value;
    return selectedDate;
}

function retrieveCtfIdFromDropdown() {
    const ctfSelect = document.getElementById('ctf-select');
    const selectedCtfId = ctfSelect.value;
    return selectedCtfId;
}




// ------------ generate graph ---------

let global_chart;
let daily_chart;

function generate_labels() {
    let minValue = 8;
    let maxValue = 17;
    if (localStorage.getItem('ctf_start_hour')) {
        minValue = Number(localStorage.getItem('ctf_start_hour'));
    }
    if (localStorage.getItem('ctf_end_hour')) {
        maxValue = Number(localStorage.getItem('ctf_end_hour'));
    }
    let array = [];
    for (let i = minValue; i <= maxValue; i++) {
        array.push(i.toString());
    }
    return array;
}

function generate_global_labels() {
    let minValue = 8;
    let maxValue = 17;
    if (localStorage.getItem('ctf_start_hour')) {
        minValue = Number(localStorage.getItem('ctf_start_hour'));
    }
    if (localStorage.getItem('ctf_end_hour')) {
        maxValue = Number(localStorage.getItem('ctf_end_hour'));
    }
    let hour_per_day = maxValue - minValue + 1;
    let nb_days = Number(localStorage.getItem('ctf_end_date')) - Number(localStorage.getItem('ctf_start_date')) + 1;
    let nb_hours = hour_per_day * nb_days;
    let array = [];
    for (let i = 0; i <= nb_hours; i++) {
        array.push(i.toString());
    }
    return array;
}

/**
 * Calculates the time difference in hours between the CTF data and a pwn time.
 * 
 * 
 * @param {number} start_date - The CTF start date.
 * @param {number} start_hour - The CTF start hour.
 * @param {number} pwn_date - The pwn date.
 * @param {number} pwn_hour - The CTF end hour.
 * @param {number} time_slot - The time slot in hours.
 * @returns {number} - The calculated hour of the pwn from the start of the CTF.
 */
function calculateTimeDifference(start_date, start_hour, pwn_date, pwn_hour, end_hour) {
    start_date = Number(start_date);
    start_hour = Number(start_hour);
    pwn_date = Number(pwn_date);
    pwn_hour = Number(pwn_hour);
    end_hour = Number(end_hour);
    console.log("start_date", start_date)
    console.log("start_hour", start_hour)
    console.log("pwn_date", pwn_date)   
    console.log("pwn_hour", pwn_hour)
    console.log("end_hour", end_hour)
    if (pwn_hour < start_hour || pwn_hour > end_hour || pwn_date < start_date || pwn_date > Number(localStorage.getItem('ctf_end_date'))) {
        if (Number(pwn_hour) < Number(start_hour)){
            console.log("Error: pwn_hour < start_hour")
        }
        if (pwn_hour > end_hour){
            console.log("Error: pwn_hour > end_hour")
        }
        if (pwn_date < start_date){
            console.log("Error: pwn_date < start_date")
        }
        if (pwn_date > Number(localStorage.getItem('ctf_end_date'))){
            console.log("Error: pwn_date > Number(localStorage.getItem('ctf_end_date'))")
        }
        return -1;
    }
    let nb_days = pwn_date - start_date;
    let today_hour = pwn_hour - start_hour + 1;
    let time_slot = end_hour - start_hour + 1;
    let nb_hours = nb_days * time_slot + today_hour;
    return nb_hours
}


async function getGlobalData(ctfs_id, userList) {
    const previousPoint = document.getElementById('previousPoint').checked;
    let parameters = "?ctf_id=" + ctfs_id;
    console.log("init userList", userList)
    try {
        const response = await fetch('/api/data' + parameters);
        const data = await response.json();

        // Get CTF data
        let start_date = Number(localStorage.getItem('ctf_start_date'));
        let start_hour = Number(localStorage.getItem('ctf_start_hour'));
        let end_hour = Number(localStorage.getItem('ctf_end_hour'));

        // Group data by user
        userList = data.reduce((acc, entry) => {
            let pwnHour = entry.compromise_time.split('T')[1].split(':')[0];
            let dateD = entry.compromise_time.split('T')[0];
            dateD = dateD.replace(/-/g, '');
            const formatedDate = convertToYYYYMMDD(dateD);
            let hour = calculateTimeDifference(start_date, start_hour, formatedDate, pwnHour, end_hour)
            if (hour == -1) {
                return acc;
            }
            if (!acc[entry.username]) {
                acc[entry.username] = {};
            }
            if (!acc[entry.username][hour]) {
                acc[entry.username][hour] = 0;
            }
            acc[entry.username][hour]++;
            return acc;
        }, userList);
        return userList;
    } catch (error) {
        console.log("Error fetching pwned data: ", error);
    }
}

async function getData(ctfs_id, userList, date = null) {
    const previousPoint = document.getElementById('previousPoint').checked;
    let parameters = "";

    if (date && !previousPoint) {
        parameters = "?ctf_id=" + ctfs_id + "&date=" + date;
    }
    else {
        parameters = "?ctf_id=" + ctfs_id;
    }
    try {
        const response = await fetch('/api/data' + parameters);
        const data = await response.json();

        selectedDate = retrieveDateFromDropdown();

        // Group data by user
        userList = data.reduce((acc, entry) => {
            const hour = entry.compromise_time.split('T')[1].split(':')[0];
            let dateD = entry.compromise_time.split('T')[0];
            dateD = dateD.replace(/-/g, '');
            const dateInt = convertToYYYYMMDD(dateD);
            if (dateInt == selectedDate) {
                if (!acc[entry.username]) {
                    acc[entry.username] = {};
                }
                if (!acc[entry.username][hour]) {
                    acc[entry.username][hour] = 0;
                }
                acc[entry.username][hour]++;
            } else if (dateInt < selectedDate && previousPoint) {
                if (!acc[entry.username]) {
                    acc[entry.username] = {};
                }
                if (!acc[entry.username][0]) {
                    acc[entry.username][0] = 0;
                }
                acc[entry.username][0]++;
            }
            return acc;
        }, userList);
        console.log("daily userList", userList)
        return userList;
    } catch (error) {
        console.log("Error fetching pwned data: ", error);
    }
}

async function listUsers(ctfs_id) {
    try {
        const response = await fetch('/api/listUsers/' + ctfs_id);
        const data = await response.json();
        const userList = data.reduce((acc, entry) => {
            if (entry.username) {
                if (!acc[entry.username]) {
                    acc[entry.username] = {};
                }
            }
            return acc;
        }, {})
        return userList
    }
    catch (error) {
        console.log("Error fetching pwned data: ", error);
    }
}


function generate_daily_graph(ctfs_id, chartId, date = null) {
    listUsers(ctfs_id).then(userList => {
        getData(ctfs_id, userList, date).then(usersData => {
            const labels = generate_labels();
            // Create datasets for each user
            const datasets = Object.keys(usersData).map(username => {
                // For each label (date), get the value or fallback to 0 if no compromises happened on that date
                let sum = parseInt(usersData[username][0] || 0);
                const data = labels.map(label => {
                    sum += parseInt(usersData[username][label] || 0)
                    return sum.toString();
                    // usersData[username][label] || 0
                });
                return {
                    label: username,
                    data: data,
                    fill: false,
                    borderColor: getRandomColor(), // Function to get a random color for the line
                    borderWidth: 2
                };
            });
            daily_chart = renderChart(labels, chartId, datasets);
            window.daily_chart = daily_chart;
            return daily_chart;
        });
    });
}

function generate_global_graph(ctfs_id, chartId) {
    listUsers(ctfs_id).then(userList => {
        getGlobalData(ctfs_id, userList).then(usersData => {
            const labels = generate_global_labels();
            // Create datasets for each user
            const datasets = Object.keys(usersData).map(username => {
                // For each label (date), get the value or fallback to 0 if no compromises happened on that date
                let sum = parseInt(usersData[username][0] || 0);
                const data = labels.map(label => {
                    sum += parseInt(usersData[username][label] || 0)
                    return sum.toString();
                    // usersData[username][label] || 0
                });
                return {
                    label: username,
                    data: data,
                    fill: false,
                    borderColor: getRandomColor(), // Function to get a random color for the line
                    borderWidth: 2
                };
            });
            console.log("datasets", datasets)
            global_chart = renderChart(labels, chartId, datasets);
            window.global_chart = global_chart;
            return global_chart;
        });
    });
}


function resetChart(chartId) {
    var chart = document.getElementById(chartId);
    chart.parentElement.removeChild(chart);

    var canv = document.createElement('canvas');
    canv.id = chartId;

    var div = document.getElementById("div-"+chartId);
    div.appendChild(canv);

    // document.body.appendChild(canv);
}

function getMaxFromDataset(datasets) {
    let max = 0;
    datasets.forEach(dataset => {
        dataset.data.forEach(data => {
            if (data > max) {
                max = data;
            }
        });
    });
    return max;
}

function getMaxY(max){
    return Number(max) + 5;
}

function renderChart(labels, chartId, datasets) {
    lineColor = localStorage.getItem('color_line');
    const ctx = document.getElementById(chartId).getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: getMaxY(getMaxFromDataset(datasets)),
                    title: {
                        display: true,
                        text: 'Machines compromises'
                    },
                    grid: {
                        color: lineColor
                    },
                    ticks: {
                        color: lineColor,
                        font: {
                            size: 20,
                        }
                    }
                },
                x: {

                    title: {
                        display: true,
                        text: 'Heures'
                    },
                    grid: {
                        color: lineColor
                    },
                    ticks: {
                        color: lineColor,
                        font: {
                            size: 20,
                        },
                    }
                }
            },
            responsive: true,
            // maintainAspectRatio: false
        },

    });
    return myChart
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function listVmInstance(ctfID){
    fetch('/api/machines?ctf_id=' + ctfID)
    .then(response => response.json())
    .then(data => {
        console.log("data", data)
        fillMachineTable(data);
    })
    .catch(error => console.error('Error fetching VM instance data:', error));
}


function getMachineDefaulTable(){
    const tableBody = document.getElementById('machine-table');
    tableBody.innerHTML = '';
    let row = document.createElement('tr');
    row.innerHTML = `
    <tr class="firstRow">
        <th>Challenge</th>
        <th>IP</th>
    </tr>`;
    tableBody.appendChild(row);
    return tableBody;
}

// Fill the table with user data
function fillMachineTable(machines) {
    const tableBody = getMachineDefaulTable();
    machines.forEach(machine => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${machine.machine_name}</td>
            <td>${machine.ip_global}</td>
            <td class="hiddenCells">${machine.instance_id}</td>
        `;
        tableBody.appendChild(row);
    });
}