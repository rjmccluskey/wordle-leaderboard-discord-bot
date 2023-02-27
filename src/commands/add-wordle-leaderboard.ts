import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { client } from "../db";

export const ADD_WORDLE_LEADERBOARD = "add-wordle-leaderboard";

export const data = new SlashCommandBuilder()
  .setName(ADD_WORDLE_LEADERBOARD)
  .setDescription("Add Wordle Leaderboard to the current channel");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const existingLeaderboard = await client.channelLeaderboard.findUnique({
    where: { discordChannelId: interaction.channelId },
  });
  if (existingLeaderboard) {
    await interaction.editReply(
      "Wordle Leaderboard has already been enabled for this channel."
    );
    return;
  }

  await client.channelLeaderboard.create({
    data: {
      discordChannelId: interaction.channelId,
    },
  });
  await interaction.editReply(
    "Wordle Leaderboard has been added! Scores will be posted daily at midnight."
  );
}
