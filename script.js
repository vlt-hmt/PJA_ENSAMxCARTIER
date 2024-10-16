// Variable globale pour stocker les données du CSV
let csvData = {};

// Fonction générique pour charger un fichier CSV et stocker ses données
function loadCSV(csvFilePath, callback, delimiter = ',') {
    Papa.parse(csvFilePath, {
        download: true,
        header: true,  // Utilise la première ligne comme en-tête
        skipEmptyLines: true,
        delimiter: delimiter,  // Permet de spécifier le séparateur
        complete: function(results) {
            // Stocker les données dans la variable globale
            csvData[csvFilePath] = results.data;
            if (callback && typeof callback === 'function') {
                callback(results.data);
            }
        },
        error: function(error) {
            console.error(`Erreur lors du chargement du fichier CSV (${csvFilePath}) :`, error);
        }
    });
}

// Fonction générique pour remplir un menu déroulant à partir d'une colonne spécifique d'un fichier CSV
function populateDropdown(csvFilePath, columnName, dropdownId, delimiter = ',') {
    // Charger les données CSV si elles ne sont pas déjà chargées
    if (csvData[csvFilePath]) {
        createDropdownOptions(csvData[csvFilePath], columnName, dropdownId);
    } else {
        loadCSV(csvFilePath, function(data) {
            createDropdownOptions(data, columnName, dropdownId);
        }, delimiter);
    }
}

// Fonction pour créer les options du menu déroulant
function createDropdownOptions(data, columnName, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = ''; // Vider les options existantes
    data.forEach(function(row) {
        const option = document.createElement('option');
        option.value = row[columnName];
        option.text = row[columnName];
        dropdown.appendChild(option);
    });
}

// Fonction générique pour afficher des informations basées sur une sélection
function displayInfo(selectedValue, outputDivId, csvFilePath, keyMapping, columnKey, delimiter = ',') {
    const data = csvData[csvFilePath];
    if (!data) {
        console.error(`Les données du fichier CSV (${csvFilePath}) ne sont pas chargées.`);
        return;
    }

    const selectedData = data.find(row => row[columnKey] === selectedValue);
    if (!selectedData) {
        console.error(`Donnée non trouvée : ${selectedValue}`);
        return;
    }

    const outputDiv = document.getElementById(outputDivId);
    outputDiv.innerHTML = ''; // Vider les informations précédentes

    // Afficher les données correspondantes à partir du keyMapping
    for (let key in keyMapping) {
        const value = selectedData[key];
        const displayText = `${keyMapping[key]} : ${value || 'N/A'}`;
        const p = document.createElement('p');
        p.textContent = displayText;
        outputDiv.appendChild(p);
    }
}

// Exemple d'utilisation dans votre projet spécifique
// Appel pour charger les matériaux et remplir le menu déroulant dans l'onglet 4
populateDropdown('../../static/csv/impact_benefices_fdv.csv', 'Matériau', 'materialDropdown', ';');

// Ajout d'un écouteur d'événement pour afficher les informations lorsqu'un matériau est sélectionné
document.getElementById('materialDropdown').addEventListener('change', function() {
    const selectedMaterial = this.value;
    if (selectedMaterial) {
        // Exemple de keyMapping dans un projet spécifique
        const keyMapping = {
            'Incinération - Impact (kg éq. CO2/tonne)': 'Impact de l\'incinération',
            'Recyclage - Impact (kg éq. CO2/tonne)': 'Impact du recyclage',
            'Méthanisation - Impact (kg éq. CO2/tonne)': 'Impact de la méthanisation',
            'Incinération - Émissions Évitées (kg éq. CO2/tonne)': 'Émissions évitées par l\'incinération',
            'Recyclage - Émissions Évitées (kg éq. CO2/tonne)': 'Émissions évitées par le recyclage',
            'Méthanisation - Émissions Évitées (kg éq. CO2/tonne)': 'Émissions évitées par la méthanisation'
        };
        displayInfo(selectedMaterial, 'materialInfo', '../../static/csv/impact_benefices_fdv.csv', keyMapping, 'Matériau', ';');
    }
});
// aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
