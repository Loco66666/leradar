import { Client, Interaction } from 'discord.js';

export function registerInteractionHandler(client: Client, commands: Map<string, { execute: (i: any) => Promise<void> }>) {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = commands.get(interaction.commandName);
    if (cmd) await cmd.execute(interaction);
  });
}
