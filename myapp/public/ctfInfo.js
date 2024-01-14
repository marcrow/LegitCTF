/* -------------- Listeners -------------- */


document.addEventListener('DOMContentLoaded', async function () {
    await listCtf();
    ctfId = retrieveCtfIdFromDropdown();
    await fetchCtfDetails(ctfId);
    
    attachDropdownListener();
    attachCheckboxListener();
    updateGraphBySelection(ctfId);
});


function attachDropdownListener() {
    const container = document.getElementById('ctf-dropdown-container');
    container.addEventListener('change', async function (event) {
        if (event.target.id === 'ctf-select') {
            const ctfId = event.target.value;
            await fetchCtfDetails(ctfId);
            const date = retrieveDateFromDropdown();
            updateGraphBySelection(ctfId,date);

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
    resetChart();
    generate_graph(ctf_id, date);
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

    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
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
        // Retrieve the current client date
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

function generate_labels() {
    let minValue = 8;
    let maxValue = 17;
    if (localStorage.getItem('ctf_start_hour') && localStorage.getItem('ctf_start_hour' != "null")) {
        minValue = Number(localStorage.getItem('ctf_start_hour'));
    }
    if (localStorage.getItem('ctf_end_hour') && localStorage.getItem('ctf_end_hour') != "null") {
        maxValue = Number(localStorage.getItem('ctf_end_hour'));
    }
    let array = [];
    for (let i = minValue; i <= maxValue; i++) {
        array.push(i.toString());
    }
    return array;
}



async function getPwnedWithPreviousDay(userList, parameters) {
    
}


async function getPwnedWithoutPreviousDay(userList, parameters) {
    try {
        const response = await fetch('/api/data' + parameters);
        const data = await response.json();

        // First, group data by user
        userList = data.reduce((acc, entry) => {
            // Extract just the hour part from the current 'compromise_time' of the entry
            const hour = entry.compromise_time.split('T')[1].split(':')[0];
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
    }
    catch (error) {
        console.log("Error fetching pwned data: ", error);
    }
}

async function getData(ctfs_id, userList, date=null) {
    const previousPoint = document.getElementById('previousPoint').checked;
    let parameters = "";
    console.log("userList1: ", userList);

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
            console.log("selectedDate: ", selectedDate)
            if (dateInt == selectedDate) {
                if (!acc[entry.username]) {
                    acc[entry.username] = {};
                }
                if (!acc[entry.username][hour]) {
                    acc[entry.username][hour] = 0;
                }
                acc[entry.username][hour]++;
            } else if (dateInt < selectedDate && previousPoint) {
                console.log("******************")
                console.log( "dateInt2: ", acc[entry.username])
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
        console.log("userList: ", userList);
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


function generate_graph(ctfs_id, date = null) {
    listUsers(ctfs_id).then(userList => {
        getData(ctfs_id, userList, date).then(usersData => {

            // fetch('/data?ctf_id='+ctfs_id)
            //     .then(response => response.json())
            //         .then(data => {
            //             // First, group data by user
            //             let usersData = data.reduce((acc, entry) => {
            //             // Extract just the hour part from the current 'compromise_time' of the entry
            //             const hour = entry.compromise_time.split('T')[1].split(':')[0];

            //             if (!acc[entry.username]) {
            //                 acc[entry.username] = {};
            //             }
            //             if (!acc[entry.username][hour]) {
            //                 acc[entry.username][hour] = 0;
            //             }
            //             acc[entry.username][hour]++;
            //             return acc;
            //         }, {});




            // Get unique dates to use as labels
            // const labels = Array.from(new Set(data.map(entry => entry.compromise_time.split('T')[0]))).sort();
            // const labels = Array.from(new Set(data.map(entry => {return entry.compromise_time.split('T')[1].split(':')[0];}))).sort();
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
            return renderChart(labels, datasets);
        });
    });
}


function resetChart() {
    var chart = document.getElementById('compromisedChart');
    chart.parentElement.removeChild(chart);

    var canv = document.createElement('canvas');
    canv.id = 'compromisedChart';
    document.body.appendChild(canv);
}

function renderChart(labels, datasets) {
    let labels_array = generate_labels();
    const ctx = document.getElementById('compromisedChart').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels_array,
            datasets: datasets
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 10
                },
                x: {

                    title: {
                        display: true,
                        text: 'Hour'
                    }
                }
            },
            // responsive: true,
            // maintainAspectRatio: false
        }
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

