// script.js

// Variable globale pour stocker les données du CSV
let csvData = {};

// Fonction générique pour charger un fichier CSV et stocker ses données
function loadCSV(csvFilePath, callback) {
    Papa.parse(csvFilePath, {
        download: true,
        header: true,  // Utilise la première ligne comme en-tête
        skipEmptyLines: true,
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
function populateDropdown(csvFilePath, columnName, dropdownId) {
    // Vérifier si les données du CSV sont déjà chargées
    if (csvData[csvFilePath]) {
        createDropdownOptions(csvData[csvFilePath], columnName, dropdownId);
    } else {
        // Charger le CSV puis remplir le menu déroulant
        loadCSV(csvFilePath, function(data) {
            createDropdownOptions(data, columnName, dropdownId);
        });
    }
}

// Fonction pour créer les options du menu déroulant
function createDropdownOptions(data, columnName, dropdownId) {
    // Extraire les valeurs uniques de la colonne spécifiée
    const uniqueValues = [...new Set(data.map(row => row[columnName]).filter(value => value && value.trim() !== 'N/A'))];
    
    // Sélectionner le menu déroulant
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        console.error(`Élément dropdown avec l'ID "${dropdownId}" non trouvé.`);
        return;
    }

    // Réinitialiser les options du menu déroulant
    dropdown.innerHTML = `<option value="">Sélectionnez un ${columnName.toLowerCase()}</option>`;

    // Créer et ajouter les options
    uniqueValues.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        dropdown.appendChild(option);
    });
}

// Fonction pour afficher les informations du matériau sélectionné
function displayMaterialInfo(materialName, outputDivId, csvFilePath, keyMapping) {
    const data = csvData[csvFilePath];
    if (!data) {
        console.error(`Les données du fichier CSV (${csvFilePath}) ne sont pas chargées.`);
        return;
    }

    const material = data.find(row => row['Matériau'] === materialName);
    if (!material) {
        document.getElementById(outputDivId).innerHTML = `<p>Aucune information disponible pour le matériau sélectionné.</p>`;
        return;
    }

    // Créer le contenu HTML pour afficher les informations
    let content = `<h2>Informations pour : ${material['Matériau']}</h2>`;
    content += `<table>
        <thead>
            <tr>
                <th>Type de traitement</th>
                <th>Impact (kg éq. CO2/tonne)</th>
                <th>Émissions évitées (kg éq. CO2/tonne)</th>
            </tr>
        </thead>
        <tbody>`;

    // Parcourir les types de traitement
    ['Incinération', 'Recyclage', 'Méthanisation'].forEach(type => {
        content += `<tr>
            <td>${type}</td>
            <td>${material[`${type} - Impact (kg éq. CO2/tonne)`] || 'N/A'}</td>
            <td>${material[`${type} - Émissions Évitées (kg éq. CO2/tonne)`] || 'N/A'}</td>
        </tr>`;
    });

    content += `</tbody></table>`;

    // Afficher le contenu dans la division spécifiée
    document.getElementById(outputDivId).innerHTML = content;
}

// Initialisation des dropdowns et autres fonctionnalités après le chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    // Définir les chemins relatifs vers les fichiers CSV
    const csvFilePath = '../../static/csv/impact_benefices_fdv.csv';

    // Définir les mappings de colonnes aux IDs des dropdowns
    const dropdownConfigs = [
        { column: 'Matériau', id: 'materialDropdown' }
        // Tu peux ajouter d'autres configurations ici si nécessaire
    ];

    // Charger et remplir les dropdowns
    dropdownConfigs.forEach(config => {
        populateDropdown(csvFilePath, config.column, config.id);
    });

    // Ajouter un écouteur d'événement pour le dropdown des matériaux
    const materialDropdown = document.getElementById('materialDropdown');
    if (materialDropdown) {
        materialDropdown.addEventListener('change', function() {
            const selectedMaterial = this.value;
            displayMaterialInfo(selectedMaterial, 'materialInfo', csvFilePath);
        });
    }
});
