import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import {
  createChannelLeaderboard,
  enableChannel,
  getChannelLeaderboardByChannelId,
  setLastGameNumber,
} from "../db";
import { backfillChannelScores } from "../backfillChannelScores";

export const ADD_WORDLE_LEADERBOARD = "add-wordle-leaderboard";

export const data = new SlashCommandBuilder()
  .setName(ADD_WORDLE_LEADERBOARD)
  .setDescription("Add Wordle Leaderboard to the current channel");

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordChannelId = interaction.channelId;
  console.log(
    `Executing add-wordle-leaderboard command on channel ${discordChannelId}...`
  );

  await interaction.deferReply();
  const existingLeaderboard = await getChannelLeaderboardByChannelId(
    discordChannelId
  );
  if (existingLeaderboard) {
    await interaction.editReply(
      "Wordle Leaderboard has already been added for this channel."
    );
    console.log(
      `Command finished. Wordle Leaderboard already added to channel ${discordChannelId}.`
    );
    return;
  }

  console.log(
    `Creating and backfilling new leaderboard for channel ${discordChannelId}...`
  );
  await createChannelLeaderboard({ discordChannelId });

  if (!interaction.channel) {
    console.error(
      `Channel object missing from interaction with channelId ${discordChannelId}!`
    );
    return;
  }
  const lastCompletedGameNumber = await backfillChannelScores(
    interaction.channel as TextChannel
  );

  await setLastGameNumber(discordChannelId, lastCompletedGameNumber);
  await enableChannel(discordChannelId);

  await interaction.editReply(
    "Wordle Leaderboard has been added! Scores will be posted daily at midnight."
  );
  console.log(
    `Command finished. Wordle Leaderboard added to channel ${discordChannelId}.`
  );
}
