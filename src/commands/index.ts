import {
  BaseInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import {
  ADD_WORDLE_LEADERBOARD,
  data,
  execute,
} from "./add-wordle-leaderboard";

type Commands = {
  [commandName: string]: {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  };
};

export const commands: Commands = {
  [ADD_WORDLE_LEADERBOARD]: {
    data,
    execute,
  },
};

export async function handleSlashCommands(interaction: BaseInteraction) {
  if (!interaction.isChatInputCommand()) {
    console.log(
      `Ignoring non-chat-input command on channel ${interaction.channelId}`
    );
    return;
  }

  const command = commands[interaction.commandName];
  if (!command) {
    console.log(
      `Ignoring unknown command ${interaction.commandName} on channel ${interaction.channelId}`
    );
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
}
