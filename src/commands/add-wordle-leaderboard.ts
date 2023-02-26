import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const ADD_WORDLE_LEADERBOARD = "add-wordle-leaderboard";

export const data = new SlashCommandBuilder()
  .setName(ADD_WORDLE_LEADERBOARD)
  .setDescription("Add Wordle Leaderboard to the current channel");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply("It works!");
}
