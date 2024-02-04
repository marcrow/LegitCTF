//-----------------  SSE client----------------
let evtSource;
// Établir la connexion SSE
window.onload = function() {
    evtSource = new EventSource('/api/events');
    const messageContainer = document.getElementById('messageContainer');

    evtSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        let message = ""; // Added missing variable declaration
        console.log(data)
        if (typeof data === 'string') {
            message = `Message: ${data}, Timestamp: ${new Date().toISOString()}`
        } 
        else if(data.type == "pwn"){
            message = `Message: ${data.user} pwned ${data.machine}`;
            addDataInGlobalChart(data);
            addDataInDailyChart(data)
        } 
        else if(data.type == "new_instance"){
            message = `Message: ${data.machine_name} added at: ${data.ip}`;
            addMachineInTable(data);
        }
        else if(data.type == "logout"){
            removeMachineInTableByInstance(data);
        }
        else if(data.type == "reset_password"){
            message = `Message: ${data.user}'s password has been reset`;
        }
        else if(data.type == "totally_pwned"){
            message = `Message: ${data.machine} has been totally pwned`;
        }
        else{
            message = `Message: ${data.message}`;
        }
        // addDataInGlobalChart();
        

        if(message != undefined && message != ""){
            const messageElement = document.createElement('div');
            messageElement.innerHTML = message;
            messageContainer.appendChild(messageElement);
            showSnackbar(message);
        }
    };

    evtSource.onerror = function(err) {
        console.error('Erreur SSE:', err);
    };
};

window.onbeforeunload = function() {
    if (evtSource) {
        evtSource.close();
        evtSource.onmessage = null; // Remove the event listener before reloading the page
    }
};


//  update chart
function addDataInGlobalChart(data){
    currentCtf = retrieveCtfIdFromDropdown();
    if(currentCtf != data.ctf_id){
        console.log("currentCtf: ", currentCtf)
        console.log("data.ctf_id: ", data)
        return;
    }
    console.log("data: ", data)
    const start_hour = localStorage.getItem("ctf_start_hour")
    const start_date = localStorage.getItem("ctf_start_date")
    const end_hour = localStorage.getItem("ctf_end_hour")
    const end_date = localStorage.getItem("ctf_end_date")
    const username = data.user;
    let datasets = window.global_chart.data.datasets;
    let globalHour = calculateTimeDifference(start_date, start_hour, data.day, data.hour, end_hour);
    console.log("globalHour: ", globalHour)
    for (let i = 0; i < datasets.length; i++) {
        if(datasets[i].label == username){
            for (let j = globalHour; j < datasets[i].data.length; j++) {
                    datasets[i].data[j] = Number(datasets[i].data[j]) + 1;
            }
            window.global_chart.data.datasets = datasets;
            window.global_chart.update();
            return;
        }
    }
}


function addDataInDailyChart(data){
    currentCtf = retrieveCtfIdFromDropdown();
    if(currentCtf != data.ctf_id){
        return;
    }
    const start_hour = localStorage.getItem("ctf_start_hour")
    const start_date = localStorage.getItem("ctf_start_date")
    const end_hour = localStorage.getItem("ctf_end_hour")
    const end_date = localStorage.getItem("ctf_end_date")
    const username = data.user;
    chartDate = retrieveDateFromDropdown();
    if(chartDate < data.day){
        return;
    }

    let datasets = window.daily_chart.data.datasets;
    let incrementHour = data.hour - start_hour;
    if(chartDate > data.day){
        incrementHour = 0;
    }
    console.log("incrementHour: ", incrementHour)
    for (let i = 0; i < datasets.length; i++) {
        if(datasets[i].label == username){
            for (let j = incrementHour; j < datasets[i].data.length; j++) {
                    datasets[i].data[j] = Number(datasets[i].data[j]) + 1;
            }
            console.log("datasets 2.0 ", datasets)
            window.daily_chart.data.datasets = datasets;
            window.daily_chart.update();
            return;
        }
    }
}

function addMachineInTable(data){
    if(data.ctf_id && Number(data.ctf_id) == Number(retrieveCtfIdFromDropdown())){
        const table = document.getElementById('machine-table');
        const row = table.insertRow(1);
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        cell1.innerHTML = data.machine_name;
        cell2.innerHTML = data.ip;
        cell3.innerHTML = data.instance_id;
        cell3.className = "hiddenCells";
    }
}

function removeMachineInTableByInstance(data){
    console.log("id: ", retrieveCtfIdFromDropdown())
    if(data.ctf_id && Number(data.ctf_id) == Number(retrieveCtfIdFromDropdown())){
        console.log("insert")
        const table = document.getElementById('machine-table');
        for (let i = 1, row; row = table.rows[i]; i++) {
            if(row.cells[2].innerHTML == data.instance_id){
                message = `Message: ${row.cells[0]} with ${row.cells[1]} IP has been removed`;
                table.deleteRow(i);
                return;
            }
        }
    }
    else{
        console.log("not insert")
    }
}


function showSnackbar(message) {
    // Créer une nouvelle snackbar
    var snackbar = document.createElement("div");
    snackbar.className = "snackbar";
    
    // Ajouter le message à la snackbar
    var text = document.createTextNode(message);
    snackbar.appendChild(text);
  
    // Créer le bouton de fermeture
    var closeButton = document.createElement("span");
    closeButton.textContent = "×"; // Symbole 'X'
    closeButton.classList.add("close-btn");
  
    // Ajouter un écouteur d'événement pour fermer la snackbar
    closeButton.onclick = function() {
      var container = document.getElementById("snackbarContainer");
      container.removeChild(snackbar);
    };
  
    // Ajouter le bouton de fermeture à la snackbar
    snackbar.appendChild(closeButton);
  
    // Ajouter la snackbar au conteneur
    var container = document.getElementById("snackbarContainer");
    container.appendChild(snackbar);

    setTimeout(function() {
        snackbar.style.opacity = "0";
        setTimeout(function() { container.removeChild(snackbar); }, 1000);
      }, 5000);
  }
