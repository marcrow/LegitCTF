document.addEventListener('DOMContentLoaded', function() {
    listCtf();
    attachDropdownListener();
});

function attachDropdownListener() {
    const container = document.getElementById('ctf-dropdown-container');
    container.addEventListener('change', function(event) {
        if (event.target.id === 'ctf-select') {
            const ctfId = event.target.value;
            fetchCtfDetails(ctfId);
            resetChart();
            generate_graph(ctfId);
        }
    });
}
function fetchCtfDetails(ctfId) {
    const baseUrl = '/api/ctfs/'; // Replace with your actual base URL

    fetch(baseUrl + ctfId)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(ctf => {
            storeCtfDetails(ctf);
            displayCtfDetails(ctf);
        })
        .catch(error => {
            console.error('Fetching CTF details failed:', error);
            document.getElementById('ctfDetails').textContent = 'Failed to load CTF details.';
        });
}

function storeCtfDetails(ctf){
    localStorage.setItem('ctf_start_hour',ctf.start_hour);
    localStorage.setItem('ctf_end_hour',ctf.end_hour);
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

function listCtf() {
    fetch('/api/listCtfs')
        .then(response => response.json())
        .then(data => {
            createDropdown(data);
        })
        .catch(error => console.error('Error fetching CTF data:', error));
}

function createDropdown(ctfs) {
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
    fetchCtfDetails(maxCtfId); // Fetch details for the CTF with the highest ID
    myChart = generate_graph(maxCtfId);
}

// ------------ generate graph ---------

function generate_labels(){
    let minValue = 8;
    let maxValue = 17;
    if(localStorage.getItem('ctf_start_hour') && localStorage.getItem('ctf_start_hour'!="null")){
        minValue = Number(localStorage.getItem('ctf_start_hour'));
    }
    if ( localStorage.getItem('ctf_end_hour') && localStorage.getItem('ctf_end_hour') != "null"){
        maxValue = Number(localStorage.getItem('ctf_end_hour'));
    }
    let array = [];
    for (let i = minValue; i <= maxValue; i++) {
        array.push(i.toString());
    }
    return array;
}


async function getData(ctfs_id, userList) {
    try{
        const response = await fetch('/data?ctf_id=' + ctfs_id);
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

        return userList ;
    }
    catch (error){
        console.log("Error fetching pwned data: ",error);
    }
    
}

async function listUsers(ctfs_id) {
    try{
        const response = await fetch('/api/listUsers/' + ctfs_id);
        const data = await response.json();
        const userList = data.reduce(( acc,entry)=> {
            if(entry.username){
                if (!acc[entry.username]) {
                    console.log("user")
                    console.log(entry.username)
                    acc[entry.username] = {};
                }
            }  
            return acc;
        }, {})
        console.log(userList)
        return userList
    }
    catch (error){
        console.log("Error fetching pwned data: ",error);
    }
}


function generate_graph(ctfs_id){
    listUsers(ctfs_id).then(userList => {
        getData(ctfs_id,userList).then(usersData => { 
        
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
                let sum=0;
                const data = labels.map(label => {
                    sum += parseInt(usersData[username][label] || 0)
                    return sum.toString();
                    // usersData[username][label] || 0
                });
                console.log("userdata------------")
                console.log(usersData)
                console.log("data------------")
                console.log(data)
                return {
                    label: username,
                    data: data,
                    fill: false,
                    borderColor: getRandomColor(), // Function to get a random color for the line
                    borderWidth: 2
                };
            });
            console.log("datasets------------")
                console.log(datasets)
            return renderChart(labels, datasets);
        });
    });
}


function resetChart(){
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

