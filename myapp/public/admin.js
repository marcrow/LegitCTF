document.addEventListener('DOMContentLoaded', async function () {
    await listCtf();
    ctfId = retrieveCtfIdFromDropdown();
    attachDropdownListener();
    fetchCtfDetails(document.getElementById('ctf-select').value);
});


function attachDropdownListener() {
    const container = document.getElementById('ctf-dropdown-container');
    container.addEventListener('change', async function (event) {
        if (event.target.id === 'ctf-select') {
            const ctfId = event.target.value;
            await fetchCtfDetails(ctfId);
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