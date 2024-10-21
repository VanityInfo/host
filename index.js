const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Discord bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Set up Express server
const app = express();
app.use(express.json());

// API endpoint to register hardware ID
app.post('/register-hardware', (req, res) => {
    const { key, hardwareId } = req.body;

    if (!key || !hardwareId) {
        return res.status(400).send('Key and hardware ID are required.');
    }

    const assignedFilePath = path.join(__dirname, 'database/assigned.txt');
    const unassignedFilePath = path.join(__dirname, 'database/unassigned.txt');

    // Check if the key is in the unassigned keys
    const unassignedKeys = fs.readFileSync(unassignedFilePath, 'utf-8').split('\n');
    const keyIndex = unassignedKeys.indexOf(key);

    if (keyIndex === -1) {
        return res.status(404).send(`Key ${key} not found in unassigned keys.`);
    }

    // Remove the key from unassigned and add it to assigned
    unassignedKeys.splice(keyIndex, 1); // Remove the key from unassigned keys
    fs.writeFileSync(unassignedFilePath, unassignedKeys.join('\n')); // Update unassigned file

    // Add the key and hardware ID to the assigned keys
    fs.appendFileSync(assignedFilePath, `${key},${hardwareId}\n`);

    res.send(`Successfully locked hardware ID ${hardwareId} to key ${key}.`);
});

// Load commands from the commands folder
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Discord bot ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Register commands with Discord
    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);
    const commands = commandFiles.map(file => require(`./commands/${file}`).data.toJSON());

    try {
        console.log('Registering application commands...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Successfully registered application commands!');
    } catch (error) {
        console.error(error);
    }
});

// Handle command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Start the Discord bot and Express server
client.login(process.env.DISCORD_BOT_TOKEN).then(() => {
    console.log('Discord bot is online!');
}).catch(console.error);

app.listen(3000, () => {
    console.log('API server is running on http://localhost:3000');
});