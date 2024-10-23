document.getElementById('chat-button').addEventListener('click', function () {
    const chatWidget = document.getElementById('chat-widget');
    chatWidget.style.display = chatWidget.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('chat-header').addEventListener('click', function () {
    document.getElementById('chat-widget').style.display = 'none';
});

document.getElementById('chat-input').addEventListener('keypress', async function (e) {
    if (e.key === 'Enter') {
        const userMessage = e.target.value;
        addMessage('You: ' + userMessage);
        e.target.value = '';

        const botResponse = await getBotResponse(userMessage);
        addMessage('Bot: ' + botResponse);
    }
});

function addMessage(message) {
    const chatBody = document.getElementById('chat-body');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight;
}

async function getBotResponse(userMessage) {
    try {
        // Charger le modèle ONNX à partir de Google Drive
        const modelUrl = 'https://cors-anywhere.herokuapp.com/https://drive.google.com/uc?export=download&id=1pZ55p2uKGPnq7olmUfffIVfcmWo_t1KH'; // Lien de téléchargement direct
        const session = await ort.InferenceSession.create(modelUrl);

        // Préparer l'entrée pour le modèle (simplifié ici)
        const inputTensor = new ort.Tensor('int64', [userMessage.length], [1]);

        // Exécuter l'inférence
        const feeds = { input_ids: inputTensor };
        const results = await session.run(feeds);

        // Récupérer et renvoyer le texte généré
        const output = results.output.data;
        return output;
    } catch (error) {
        console.error('Erreur:', error);
        return "Désolé, une erreur est survenue lors de la génération de la réponse.";
    }
}

