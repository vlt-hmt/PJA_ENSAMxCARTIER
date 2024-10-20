// static/scripts/onglet5.js

const map = L.map('map').setView([48.8566, 2.3522], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let routeControls = [];

function addStorageInput() {
    const container = document.getElementById("storage-container");
    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group";

    const addressInput = document.createElement("input");
    addressInput.type = "text";
    addressInput.className = "large-input storage-input";
    addressInput.placeholder = "Entrez une autre adresse complète";

    const latInput = document.createElement("input");
    latInput.type = "text";
    latInput.className = "small-input latitude-input";
    latInput.placeholder = "Lat";

    const lonInput = document.createElement("input");
    lonInput.type = "text";
    lonInput.className = "small-input longitude-input";
    lonInput.placeholder = "Lon";

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.textContent = "Supprimer";
    removeButton.onclick = function() { removeInput(removeButton); };

    inputGroup.appendChild(addressInput);
    inputGroup.appendChild(latInput);
    inputGroup.appendChild(lonInput);
    inputGroup.appendChild(removeButton);

    container.insertBefore(inputGroup, container.querySelector(".button-add"));
}

function addTreatmentInput() {
    const container = document.getElementById("treatment-container");
    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group";

    const addressInput = document.createElement("input");
    addressInput.type = "text";
    addressInput.className = "large-input treatment-input";
    addressInput.placeholder = "Entrez une autre adresse complète";

    const latInput = document.createElement("input");
    latInput.type = "text";
    latInput.className = "small-input latitude-input";
    latInput.placeholder = "Lat";

    const lonInput = document.createElement("input");
    lonInput.type = "text";
    lonInput.className = "small-input longitude-input";
    lonInput.placeholder = "Lon";

    const selectOption = document.createElement("select");
    selectOption.className = "treatment-option";
    selectOption.innerHTML = `
        <option value="recycling">Recyclage</option>
        <option value="methanation">Méthanisation</option>
        <option value="incineration">Incinération</option>
        <option value="landfill">Enfouissement</option>
    `;

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.textContent = "Supprimer";
    removeButton.onclick = function() { removeInput(removeButton); };

    inputGroup.appendChild(addressInput);
    inputGroup.appendChild(latInput);
    inputGroup.appendChild(lonInput);
    inputGroup.appendChild(selectOption);
    inputGroup.appendChild(removeButton);

    container.insertBefore(inputGroup, container.querySelector(".button-add"));
}

function removeInput(button) {
    const inputGroup = button.parentElement;
    inputGroup.remove();
}

function compareRoutes() {
    routeControls.forEach(control => {
        map.removeControl(control);
    });
    routeControls = [];
    const distanceTableBody = document.querySelector("#distance-table tbody");
    distanceTableBody.innerHTML = '';

    const storageInputs = Array.from(document.querySelectorAll(".input-group"));
    const treatmentInputs = Array.from(document.querySelectorAll(".input-group"));

    let headerRow = '<tr><th>Stockage / Traitement</th>';
    treatmentInputs.forEach(input => {
        const treatmentName = input.querySelector(".treatment-input").value || "Traitement";
        const option = input.querySelector(".treatment-option").selectedOptions[0].text;
        headerRow += `<th>${treatmentName} (${option})</th>`;
    });
    headerRow += '</tr>';
    document.querySelector("#distance-table thead").innerHTML = headerRow;

    let promises = [];
    storageInputs.forEach((sInput) => {
        let row = `<tr><td>${sInput.querySelector(".storage-input").value}</td>`;
        treatmentInputs.forEach((tInput) => {
            let routePromise = L.Routing.control({
                waypoints: [L.latLng(parseFloat(sInput.value), parseFloat(tInput.value))],
                routeWhileDragging: true
            }).addTo(map).on('routesfound', (e) => {
                const distance = (e.routes[0].summary.totalDistance / 1000).toFixed(2);
                row += `<td>${distance} km</td>`;
            });
            promises.push(routePromise);
        });
        Promise.all(promises).then(() => { distanceTableBody.innerHTML += row + '</tr>'; });
    });
}
