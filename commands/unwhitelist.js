const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwhitelist')
        .setDescription('Removes a user from the whitelist.')
        .addUserOption(option =>
            option.setName('username')
                .setDescription('The user to remove from the whitelist')
                .setRequired(true)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('username');
        const keysFilePath = path.join(__dirname, '../database/keys.txt');
        
        // Read the keys file
        let keysFile = fs.readFileSync(keysFilePath, 'utf-8').split('\n');

        // Find the user and remove their entry
        const newKeysFile = keysFile.filter(line => !line.startsWith(user.id));

        if (newKeysFile.length === keysFile.length) {
            await interaction.reply(`No whitelist entry found for ${user.username}.`);
            return;
        }

        // Rewrite the keys file with the updated entries
        fs.writeFileSync(keysFilePath, newKeysFile.join('\n'));

        await interaction.reply(`Successfully removed ${user.username} from the whitelist.`);
    },
};