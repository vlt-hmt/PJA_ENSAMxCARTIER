const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

const USERS_FILE = 'users.json';

// Fonction pour lire le fichier JSON
function readUsersFile() {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
}

// Fonction pour écrire dans le fichier JSON
function writeUsersFile(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Endpoint pour l'inscription
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).send('Email ou mot de passe manquant');
    }

    try {
        const users = readUsersFile();

        // Vérifier si l'utilisateur existe déjà
        if (users.find(user => user.email === email)) {
            return res.status(400).send('Utilisateur déjà existant');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ email, password: hashedPassword });

        writeUsersFile(users);
        res.status(201).send('Utilisateur enregistré');
    } catch (error) {
        res.status(500).send('Erreur lors de l\'inscription');
    }
});

// Endpoint pour la connexion
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Vérifier le captcha
    const secretKey = '6Lcm9WgqAAAAAMwFzcP-Xshv1K_h3bJAANb2eae-';
    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`;

    if (!email || !password) {
        return res.status(400).send('Email ou mot de passe manquant');
    }

    try {
        const users = readUsersFile();
        const user = users.find(user => user.email === email);
        
        if (!user) {
            return res.status(400).send('Utilisateur non trouvé');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Mot de passe incorrect');
        }

        res.send('Connexion réussie');
    } catch (error) {
        res.status(500).send('Erreur lors de la connexion');
    }
});

// Démarrer le serveur
app.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
});
