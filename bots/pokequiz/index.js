const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

const typesSpanish = {
    'normal': 'Normal',
    'fire': 'Fuego',
    'water': 'Agua',
    'grass': 'Planta',
    'electric': 'Eléctrico',
    'ice': 'Hielo',
    'fighting': 'Lucha',
    'poison': 'Veneno',
    'ground': 'Tierra',
    'flying': 'Volador',
    'psychic': 'Psíquico',
    'bug': 'Bicho',
    'rock': 'Roca',
    'ghost': 'Fantasma',
    'dragon': 'Dragón',
    'dark': 'Siniestro',
    'steel': 'Acero',
    'fairy': 'Hada'
};

const reverseTypesSpanish = Object.fromEntries(
    Object.entries(typesSpanish).map(([en, es]) => [es.toLowerCase(), en])
);

async function getPokemonNameInSpanish(idOrName) {
    try {
        const speciesData = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${idOrName}`).then(r => r.json());
        const spanishName = speciesData.names.find(n => n.language.name === 'es');
        return spanishName ? spanishName.name : idOrName;
    } catch (e) {
        return idOrName;
    }
}

async function init(token) {
    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

    const commands = [
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Muestra el manual de ayuda y los juegos disponibles.'),
        new SlashCommandBuilder()
            .setName('nombre')
            .setDescription('Adivina el nombre del Pokémon por su imagen.')
            .addStringOption(option =>
                option.setName('dificultad')
                    .setDescription('Elige la dificultad del juego')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Fácil (4 opciones)', value: 'facil' },
                        { name: 'Difícil (Escribir)', value: 'dificil' }
                    )),
        new SlashCommandBuilder()
            .setName('tipo')
            .setDescription('Adivina el tipo del Pokémon.')
            .addStringOption(option =>
                option.setName('dificultad')
                    .setDescription('Elige la dificultad del juego')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Fácil (4 opciones)', value: 'facil' },
                        { name: 'Difícil (Escribir)', value: 'dificil' }
                    )),
        new SlashCommandBuilder()
            .setName('evol')
            .setDescription('Adivina la evolución del Pokémon.')
            .addStringOption(option =>
                option.setName('dificultad')
                    .setDescription('Elige la dificultad del juego')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Fácil (4 opciones)', value: 'facil' },
                        { name: 'Difícil (Escribir)', value: 'dificil' }
                    )),
        new SlashCommandBuilder()
            .setName('gen')
            .setDescription('Adivina a qué generación pertenece el Pokémon.')
            .addStringOption(option =>
                option.setName('dificultad')
                    .setDescription('Elige la dificultad del juego')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Fácil (4 opciones)', value: 'facil' },
                        { name: 'Difícil (Escribir)', value: 'dificil' }
                    ))
    ];

    client.once('ready', async () => {
        console.log(`¡Bot PokeQuiz iniciado como ${client.user.tag}!`);
        const rest = new REST({ version: '10' }).setToken(token);
        try {
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            console.log('¡Slash Commands de PokeQuiz registrados!');
        } catch (error) {
            console.error('Error registrando comandos PokeQuiz:', error);
        }
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const difficulty = interaction.options.getString('dificultad') || 'facil';

        if (commandName === 'help') {
            const embed = new EmbedBuilder()
                .setTitle('📖 Manual de PokeQuiz')
                .setDescription(`¡Bienvenido al bot definitivo de trivia Pokémon! Aquí tienes todos los juegos disponibles:\n\n` +
                    `🔹 **/nombre** - Adivina el nombre del Pokémon viendo su imagen.\n` +
                    `🔹 **/tipo** - Adivina el tipo principal o secundario del Pokémon.\n` +
                    `🔹 **/evol** - Adivina en quién evoluciona el Pokémon mostrado.\n` +
                    `🔹 **/gen** - Adivina a qué generación (1 a 9) pertenece el Pokémon.\n` +
                    `🔹 **/help** - Muestra este manual.\n\n` +
                    `💡 **Dificultades:**\n` +
                    `✅ **Fácil:** Te daré 4 opciones (A, B, C, D) y tú respondes escribiendo la letra correcta.\n` +
                    `🔥 **Difícil:** ¡Sin pistas! Tendrás que escribir la respuesta exacta.`)
                .setColor('#E3350D')
                .setThumbnail('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png');
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'nombre') {
            await interaction.deferReply();
            const ids = [];
            const numOpciones = difficulty === 'facil' ? 4 : 1;
            while (ids.length < numOpciones) {
                let numAleatorio = Math.floor(Math.random() * 1025) + 1;
                if (!ids.includes(numAleatorio)) ids.push(numAleatorio);
            }

            try {
                const respuestas = await Promise.all(ids.map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json())));
                const pokemonCorrecto = respuestas[0];
                const nombreCorrectoEN = pokemonCorrecto.name;
                const nombreCorrectoES = await getPokemonNameInSpanish(pokemonCorrecto.id);
                const imagenCorrecta = pokemonCorrecto.sprites.other['official-artwork'].front_default || pokemonCorrecto.sprites.front_default;

                const embed = new EmbedBuilder()
                    .setTitle('¿Quién es este Pokémon?')
                    .setImage(imagenCorrecta)
                    .setColor('#FFCC00');

                let letraCorrecta = '';

                if (difficulty === 'facil') {
                    const opcionesES = await Promise.all(respuestas.map(p => getPokemonNameInSpanish(p.id)));
                    const nCorrecto = opcionesES[0];
                    opcionesES.sort(() => Math.random() - 0.5);
                    const letras = ['a', 'b', 'c', 'd'];
                    letraCorrecta = letras[opcionesES.indexOf(nCorrecto)];

                    embed.setDescription(`Modo **FÁCIL**: Mira las opciones y responde abajo.\n\n` +
                        `**A)** ${opcionesES[0].toUpperCase()}\n` +
                        `**B)** ${opcionesES[1].toUpperCase()}\n` +
                        `**C)** ${opcionesES[2].toUpperCase()}\n` +
                        `**D)** ${opcionesES[3].toUpperCase()}`)
                    .setFooter({ text: 'Escribe la letra para responder.' });
                } else {
                    embed.setDescription(`Modo **DIFÍCIL**: ¡Demuestra tu conocimiento!`)
                    .setFooter({ text: 'Escribe el nombre del Pokémon en el chat.' });
                }

                await interaction.editReply({ embeds: [embed] });

                const collector = interaction.channel.createMessageCollector({ time: 30000 });

                collector.on('collect', async m => {
                    const userContent = m.content.toLowerCase().trim().replace(/^[!/]/, '');
                    let isCorrect = false;

                    if (difficulty === 'facil') {
                        isCorrect = userContent === letraCorrecta;
                    } else {
                        isCorrect = userContent === nombreCorrectoES.toLowerCase() || userContent === nombreCorrectoEN.toLowerCase();
                    }

                    if (isCorrect) {
                        interaction.channel.send(`¡Felicidades ${m.author}! Has acertado, era **${nombreCorrectoES.toUpperCase()}**.`);
                        collector.stop('correct');
                    } else {
                        // Enviamos el mensaje de "incorrecto"
                        interaction.channel.send(`¡No ${m.author}, esa no es la respuesta! Sigue intentándolo...`);
                    }
                });

                collector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        interaction.channel.send(`¡Tiempo agotado! La respuesta correcta era **${nombreCorrectoES.toUpperCase()}**.`);
                    }
                });

            } catch (error) {
                console.error(error);
                interaction.editReply('Ups, hubo un problema al obtener el Pokémon.');
            }
        }

        if (commandName === 'tipo') {
            await interaction.deferReply();
            try {
                const id = Math.floor(Math.random() * 1025) + 1;
                const data = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json());
                const nombrePokemonES = await getPokemonNameInSpanish(id);
                const tiposCorrectosEN = data.types.map(t => t.type.name);
                const tiposCorrectosES = tiposCorrectosEN.map(t => typesSpanish[t] || t);
                const imagen = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;

                const embed = new EmbedBuilder()
                    .setTitle(`¿De qué tipo es ${nombrePokemonES.toUpperCase()}?`)
                    .setImage(imagen)
                    .setColor('#FFCC00');

                let letraCorrecta = '';
                const todosLosTiposEN = Object.keys(typesSpanish);

                if (difficulty === 'facil') {
                    const tipoCorrectoEN = tiposCorrectosEN[Math.floor(Math.random() * tiposCorrectosEN.length)];
                    const opcionesEN = [tipoCorrectoEN];
                    while (opcionesEN.length < 4) {
                        const tipoAleatorio = todosLosTiposEN[Math.floor(Math.random() * todosLosTiposEN.length)];
                        if (!opcionesEN.includes(tipoAleatorio)) opcionesEN.push(tipoAleatorio);
                    }
                    opcionesEN.sort(() => Math.random() - 0.5);
                    const opcionesES = opcionesEN.map(t => typesSpanish[t].toUpperCase());
                    const letras = ['a', 'b', 'c', 'd'];
                    letraCorrecta = letras[opcionesEN.indexOf(tipoCorrectoEN)];

                    embed.setDescription(`Modo **FÁCIL**: Responde con la letra correcta en el chat.\n\n` +
                        `**A)** ${opcionesES[0]}\n` +
                        `**B)** ${opcionesES[1]}\n` +
                        `**C)** ${opcionesES[2]}\n` +
                        `**D)** ${opcionesES[3]}`)
                    .setFooter({ text: 'Escribe la letra para responder.' });
                } else {
                    embed.setDescription(`Modo **DIFÍCIL**: Escribe el tipo del Pokémon en el chat.`)
                    .setFooter({ text: 'Escribe el tipo (ej: fuego).' });
                }

                await interaction.editReply({ embeds: [embed] });

                const collector = interaction.channel.createMessageCollector({ time: 30000 });

                collector.on('collect', m => {
                    const userContent = m.content.toLowerCase().trim().replace(/^[!/]/, '');
                    let isCorrect = false;

                    if (difficulty === 'facil') {
                        isCorrect = userContent === letraCorrecta;
                    } else {
                        // Aceptamos tanto inglés como español, y normalizamos
                        const userTypeEN = reverseTypesSpanish[userContent] || userContent;
                        isCorrect = tiposCorrectosEN.includes(userTypeEN);
                    }

                    if (isCorrect) {
                        interaction.channel.send(`¡Correcto ${m.author}! **${nombrePokemonES.toUpperCase()}** es de tipo **${tiposCorrectosES.join(' / ').toUpperCase()}**.`);
                        collector.stop('correct');
                    } else {
                        interaction.channel.send(`¡No ${m.author}, ese no es su tipo! Sigue intentándolo...`);
                    }
                });

                collector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        interaction.channel.send(`¡Tiempo agotado! **${nombrePokemonES.toUpperCase()}** es de tipo **${tiposCorrectosES.join(' / ').toUpperCase()}**.`);
                    }
                });
            } catch (error) {
                console.error(error);
                interaction.editReply('Hubo un error al obtener los tipos.');
            }
        }

        if (commandName === 'evol') {
            await interaction.deferReply();
            try {
                let evolutionFound = false;
                let pokemonBaseID, pokemonBaseES, nextEvolutionsEN, imagen;

                while (!evolutionFound) {
                    const id = Math.floor(Math.random() * 500) + 1;
                    const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json());
                    const speciesData = await fetch(pokemonData.species.url).then(r => r.json());
                    const evolutionData = await fetch(speciesData.evolution_chain.url).then(r => r.json());

                    let currentStep = evolutionData.chain;
                    while (currentStep) {
                        if (currentStep.species.name === pokemonData.name) {
                            if (currentStep.evolves_to.length > 0) {
                                pokemonBaseID = pokemonData.id;
                                pokemonBaseES = await getPokemonNameInSpanish(pokemonData.id);
                                nextEvolutionsEN = currentStep.evolves_to.map(e => e.species.name);
                                imagen = pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default;
                                evolutionFound = true;
                            }
                            break;
                        }
                        currentStep = currentStep.evolves_to[0];
                    }
                }

                const nextEvolutionsES = await Promise.all(nextEvolutionsEN.map(name => getPokemonNameInSpanish(name)));

                const embed = new EmbedBuilder()
                    .setTitle(`¿En quién evoluciona ${pokemonBaseES.toUpperCase()}?`)
                    .setImage(imagen)
                    .setColor('#FFCC00');

                let letraCorrecta = '';

                if (difficulty === 'facil') {
                    const nCorrectoES = nextEvolutionsES[0];
                    const falsosIds = [];
                    while (falsosIds.length < 3) {
                        let idAleatorio = Math.floor(Math.random() * 1025) + 1;
                        if (!falsosIds.includes(idAleatorio) && idAleatorio !== pokemonBaseID) falsosIds.push(idAleatorio);
                    }
                    const falsosES = await Promise.all(falsosIds.map(id => getPokemonNameInSpanish(id)));
                    const opcionesES = [nCorrectoES, ...falsosES];
                    opcionesES.sort(() => Math.random() - 0.5);
                    const letras = ['a', 'b', 'c', 'd'];
                    letraCorrecta = letras[opcionesES.indexOf(nCorrectoES)];

                    embed.setDescription(`Modo **FÁCIL**: Responde con la letra correcta en el chat.\n\n` +
                        `**A)** ${opcionesES[0].toUpperCase()}\n` +
                        `**B)** ${opcionesES[1].toUpperCase()}\n` +
                        `**C)** ${opcionesES[2].toUpperCase()}\n` +
                        `**D)** ${opcionesES[3].toUpperCase()}`)
                    .setFooter({ text: 'Escribe la letra para responder.' });
                } else {
                    embed.setDescription(`Modo **DIFÍCIL**: ¡Adivina su evolución!`)
                    .setFooter({ text: 'Escribe la evolución en el chat.' });
                }

                await interaction.editReply({ embeds: [embed] });

                const collector = interaction.channel.createMessageCollector({ time: 30000 });

                collector.on('collect', m => {
                    const userContent = m.content.toLowerCase().trim().replace(/^[!/]/, '');
                    let isCorrect = false;

                    if (difficulty === 'facil') {
                        isCorrect = userContent === letraCorrecta;
                    } else {
                        isCorrect = nextEvolutionsES.some(e => e.toLowerCase() === userContent) || nextEvolutionsEN.some(e => e.toLowerCase() === userContent);
                    }

                    if (isCorrect) {
                        interaction.channel.send(`¡Correcto ${m.author}! **${pokemonBaseES.toUpperCase()}** evoluciona en **${nextEvolutionsES.join(' o ').toUpperCase()}**.`);
                        collector.stop('correct');
                    } else {
                        interaction.channel.send(`¡No ${m.author}, esa no es su evolución! Sigue intentándolo...`);
                    }
                });

                collector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        interaction.channel.send(`¡Tiempo agotado! La evolución de **${pokemonBaseES.toUpperCase()}** es **${nextEvolutionsES.join(' o ').toUpperCase()}**.`);
                    }
                });
            } catch (error) {
                console.error(error);
                interaction.editReply('Hubo un error con la cadena de evolución.');
            }
        }

        if (commandName === 'gen') {
            await interaction.deferReply();
            try {
                const id = Math.floor(Math.random() * 1025) + 1;
                const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json());
                const speciesData = await fetch(pokemonData.species.url).then(r => r.json());
                
                const nombrePokemonES = await getPokemonNameInSpanish(id);
                const genName = speciesData.generation.name; 
                const genNumber = genName.split('-')[1]; 
                
                const romanToArabic = {
                    'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 
                    'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9'
                };
                const genCorrecta = romanToArabic[genNumber] || '0';
                const imagen = pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default;

                const embed = new EmbedBuilder()
                    .setTitle(`¿A qué generación (1 al 9) pertenece ${nombrePokemonES.toUpperCase()}?`)
                    .setImage(imagen)
                    .setColor('#23d160');

                let letraCorrecta = '';

                if (difficulty === 'facil') {
                    const opciones = [genCorrecta];
                    while (opciones.length < 4) {
                        const rnd = Math.floor(Math.random() * 9) + 1;
                        if (!opciones.includes(rnd.toString())) opciones.push(rnd.toString());
                    }
                    opciones.sort(() => Math.random() - 0.5);
                    const letras = ['a', 'b', 'c', 'd'];
                    letraCorrecta = letras[opciones.indexOf(genCorrecta)];

                    embed.setDescription(`Modo **FÁCIL**: Responde con la letra correcta en el chat.\n\n` +
                        `**A)** Generación ${opciones[0]}\n` +
                        `**B)** Generación ${opciones[1]}\n` +
                        `**C)** Generación ${opciones[2]}\n` +
                        `**D)** Generación ${opciones[3]}`)
                    .setFooter({ text: 'Escribe la letra para responder.' });
                } else {
                    embed.setDescription(`Modo **DIFÍCIL**: ¡Escribe el número de la generación (1, 2, 3...)!`)
                    .setFooter({ text: 'Escribe el número en el chat.' });
                }

                await interaction.editReply({ embeds: [embed] });

                const collector = interaction.channel.createMessageCollector({ time: 30000 });

                collector.on('collect', m => {
                    const userContent = m.content.toLowerCase().trim().replace(/^[!/]/, '');
                    let isCorrect = (difficulty === 'facil') ? (userContent === letraCorrecta) : (userContent === genCorrecta);

                    if (isCorrect) {
                        interaction.channel.send(`¡Fabuloso ${m.author}! **${nombrePokemonES.toUpperCase()}** es de la **Generación ${genCorrecta}**.`);
                        collector.stop('correct');
                    } else {
                        interaction.channel.send(`¡No ${m.author}, esa no es su generación! Sigue intentándolo...`);
                    }
                });

                collector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        interaction.channel.send(`¡Tiempo agotado! **${nombrePokemonES.toUpperCase()}** es de la **Generación ${genCorrecta}**.`);
                    }
                });
            } catch (error) {
                console.error(error);
                interaction.editReply('Hubo un error al obtener la generación.');
            }
        }
    });

    await client.login(token);
    return client;
}

module.exports = { init };
