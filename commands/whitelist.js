const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Whitelists a user and sends them their key.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to whitelist')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');

        // Generate a unique key
        const generateKey = () => {
            return `key-${Math.random().toString(36).substring(2, 22)}`;
        };

        let key;
        const unassignedKeysPath = path.join(__dirname, '../database/unassigned.txt');
        const assignedKeysPath = path.join(__dirname, '../database/assigned.txt');

        // Read unassigned keys
        const unassignedKeys = fs.readFileSync(unassignedKeysPath, 'utf-8').split('\n');

        // Find a unique key
        do {
            key = generateKey();
        } while (unassignedKeys.includes(key));

        // Add the new key to unassigned keys file
        fs.appendFileSync(unassignedKeysPath, `${key}\n`);

        // Send DM to the user with the key
        const dmEmbed = {
            content: null,
            embeds: [
                {
                    title: 'You have been whitelisted!',
                    description: `**Here\'s your key:** __**${key}**__`,
                    color: 0,
                },
            ],
            attachments: [],
        };

        try {
            await user.send(dmEmbed);
            await interaction.reply(`Whitelisted ${user.username} and sent them their key via DM!`);
        } catch (error) {
            console.error(`Could not send DM to ${user.username}:`, error);
            await interaction.reply({ content: `Successfully whitelisted ${user.username}, but I couldn't send them a DM.`, ephemeral: true });
        }
    },
};