require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Gestor de Bots Multicarpeta funcionando!');
});

app.listen(port, () => {
    console.log(`Servidor de monitoreo escuchando en el puerto ${port}`);
});

// Directorio donde están los bots
const botsDir = path.join(__dirname, 'bots');

async function loadBots() {
    if (!fs.existsSync(botsDir)) {
        console.warn('No se encontró el directorio de bots.');
        return;
    }

    const folders = fs.readdirSync(botsDir);

    for (const folder of folders) {
        const botPath = path.join(botsDir, folder);
        if (fs.lstatSync(botPath).isDirectory()) {
            const indexPath = path.join(botPath, 'index.js');
            if (fs.existsSync(indexPath)) {
                try {
                    const botModule = require(indexPath);
                    // Buscamos el token en las variables de entorno del servidor (e.g. Render)
                    // Formato: NOMBRECARPETA_TOKEN (ej. POKEQUIZ_TOKEN)
                    const tokenVar = `${folder.toUpperCase()}_TOKEN`;
                    const token = process.env[tokenVar];

                    if (token) {
                        console.log(`[Manager] Iniciando bot '${folder}' usando la variable ${tokenVar}...`);
                        await botModule.init(token);
                        console.log(`[Manager] Bot '${folder}' está en línea.`);
                    } else {
                        console.warn(`[Manager] ATENCIÓN: No se encontró la variable de entorno '${tokenVar}' para el bot en la carpeta '${folder}'.`);
                    }
                } catch (error) {
                    console.error(`[Manager] Error al cargar el bot en '${folder}':`, error);
                }
            }
        }
    }
}

loadBots();