// Fonction générique pour charger un fichier CSV et créer un menu déroulant à partir d'une colonne spécifique
function loadDropdownFromCSV(csvFilePath, columnName, dropdownId) {
    // Utilisation de PapaParse pour lire le fichier CSV
    Papa.parse(csvFilePath, {
        download: true,
        header: true,  // Assure que la première ligne du CSV est utilisée comme en-tête
        complete: function(results) {
            const uniqueValues = [];
            
            // Parcours des lignes du CSV et extraction des valeurs uniques de la colonne spécifiée
            results.data.forEach(row => {
                if (row[columnName] && !uniqueValues.includes(row[columnName])) {
                    uniqueValues.push(row[columnName]);  // Ajouter uniquement les valeurs uniques
                }
            });

            // Sélectionne le menu déroulant dans lequel insérer les options
            const dropdown = document.getElementById(dropdownId);

            // Efface les anciennes options si besoin
            dropdown.innerHTML = "";

            // Crée et insère chaque option dans le menu déroulant
            uniqueValues.forEach(value => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                dropdown.appendChild(option);
            });
        },
        error: function(error) {
            console.error("Erreur lors du chargement du fichier CSV :", error);
        }
    });
}

// Exemple d'appel pour la colonne "Matériau"
// loadDropdownFromCSV('../csv/impact_benefices_fdv.csv', 'Matériau', 'materialDropdown');

// Exemple d'appel pour une autre colonne, comme "Pays"
// loadDropdownFromCSV('../csv/impact_benefices_fdv.csv', 'Pays', 'countryDropdown');
// ...............................................................................................................................

