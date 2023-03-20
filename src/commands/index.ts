import {
  BaseInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import {
  ADD_WORDLE_LEADERBOARD,
  data as wlAddData,
  execute as wlAddExecute,
} from "./wl-add";
import {
  SHOW_WORDLE_LEADERBOARD,
  data as wlShowData,
  execute as wlShowExecute,
} from "./wl-show";

type Commands = {
  [commandName: string]: {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  };
};

export const commands: Commands = {
  [ADD_WORDLE_LEADERBOARD]: {
    data: wlAddData,
    execute: wlAddExecute,
  },
  [SHOW_WORDLE_LEADERBOARD]: {
    data: wlShowData,
    execute: wlShowExecute,
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
    console.log(
      `Executing ${interaction.commandName} command on channel ${interaction.channelId}...`
    );
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
