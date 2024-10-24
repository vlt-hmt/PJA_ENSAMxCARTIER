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
        const modelUrl = 'https://huggingface.co/PJJT/distilgpt2-onnx/resolve/main/distilgpt2.onnx'; // Lien de téléchargement direct
        const session = await ort.InferenceSession.create(modelUrl);

        // Encoder le message utilisateur en tant qu'input_id
        const inputIds = tokenize(userMessage); // Fonction de tokenisation à créer (voir plus bas)

        // Créer un tensor d'entrée avec la forme attendue (1, sequence_length)
        const inputTensor = new ort.Tensor('int64', inputIds, [1, inputIds.length]);

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

async function tokenize(text) {
    const tokenizer = await window.transformers.tokenizer('Xenova/gpt2');
    const tokens = tokenizer.encode(text);
    return tokens.ids; // Cela renvoie un tableau d'IDs approprié pour le modèle
}

