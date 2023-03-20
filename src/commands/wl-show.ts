import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import {
  getLastCompletedGameNumber,
  getMonthByGameNumber,
} from "../game-number";
import {
  channelIsEnabled,
  getRankedAllTimeScoresForChannel,
  getRankedMonthlyScoresForChannel,
} from "../db";
import {
  buildAllTimeLeaderboardEmbed,
  buildMonthlyLeaderboardEmbed,
} from "../leaderboard-embeds";

export const SHOW_WORDLE_LEADERBOARD = "wl-show";

export const data = new SlashCommandBuilder()
  .setName(SHOW_WORDLE_LEADERBOARD)
  .setDescription(
    "Show the latest Wordle Leaderboards on this channel. The results will be shown privately to you."
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const discordChannelId = interaction.channelId;

  if (!(await channelIsEnabled(discordChannelId))) {
    await interaction.editReply(
      "Wordle Leaderboard has not been added for this channel yet. Use `/wl-add` to add it."
    );
    console.log(
      `Command finished. Wordle Leaderboard not enabled on channel ${discordChannelId}.`
    );
    return;
  }

  const lastGameNumber = getLastCompletedGameNumber();
  const [rankedAllTimeScores, rankedMonthlyScores] = await Promise.all([
    getRankedAllTimeScoresForChannel(discordChannelId),
    getRankedMonthlyScoresForChannel(
      discordChannelId,
      getMonthByGameNumber(lastGameNumber)
    ),
  ]);

  const embeds = [
    buildMonthlyLeaderboardEmbed(rankedMonthlyScores, lastGameNumber),
    buildAllTimeLeaderboardEmbed(rankedAllTimeScores),
  ];

  await interaction.editReply({ embeds });

  console.log(
    `Command finished. Showed leaderboard for channel ${discordChannelId} to user ${interaction.user.id}.`
  );
}
