document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si l'utilisateur est connecté en vérifiant le localStorage
    const isLoggedIn = localStorage.getItem('userToken');
    if (!userToken) {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
      window.location.href = 'index.html';
    }
});
