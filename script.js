// Fonction pour charger le fichier CSV et afficher les données dans la liste déroulante
async function loadCSV() {
    // Charger le fichier CSV avec fetch
    const response = await fetch('data.csv');
    const csvData = await response.text();

    // Utiliser PapaParse pour parser le CSV
    Papa.parse(csvData, {
        header: true, // Si la première ligne du fichier CSV est une ligne d'en-tête
        complete: function(results) {
            const items = results.data;

            // Récupérer l'élément select dans le DOM
            const select = document.getElementById('item-select');

            // Parcourir les données CSV et ajouter les options à la liste déroulante
            items.forEach(item => {
                if (item.name) { // S'assurer que l'élément a une valeur
                    const option = document.createElement('option');
                    option.value = item.name;
                    option.textContent = item.name;
                    select.appendChild(option);
                }
            });
        }
    });
}

// Appel de la fonction au chargement de la page
window.onload = loadCSV;
