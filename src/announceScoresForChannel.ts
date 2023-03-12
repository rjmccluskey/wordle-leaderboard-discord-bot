import { TextChannel, EmbedBuilder, bold } from "discord.js";
import { client } from "./client";
import {
  AllTimeScoreForSave,
  getRankedAllTimeScoresForChannel,
  getRankedMonthlyScoresForChannel,
  MonthlyScoreForSave,
} from "./db";
import {
  getMonthByGameNumber,
  getDisplayMonthByGameNumber,
} from "./game-number";

export async function announceScoresForChannel(
  discordChannelId: string,
  lastGameNumber: number
): Promise<void> {
  const [channel, rankedAllTimeScores, rankedMonthlyScores] = await Promise.all(
    [
      getChannel(discordChannelId),
      getRankedAllTimeScoresForChannel(discordChannelId),
      getRankedMonthlyScoresForChannel(
        discordChannelId,
        getMonthByGameNumber(lastGameNumber)
      ),
    ]
  );

  const displayMonth = getDisplayMonthByGameNumber(lastGameNumber);

  let monthlyScoresEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`${displayMonth} Wordle Leaderboard`);
  monthlyScoresEmbed = addRankedScoresToEmbed(
    monthlyScoresEmbed,
    rankedMonthlyScores
  );

  let allTimeScoresEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("All-Time Wordle Leaderboard");
  allTimeScoresEmbed = addRankedScoresToEmbed(
    allTimeScoresEmbed,
    rankedAllTimeScores
  );

  await channel.send({ embeds: [monthlyScoresEmbed, allTimeScoresEmbed] });
}

async function getChannel(discordChannelId: string): Promise<TextChannel> {
  const channel = await client.channels.cache.get(discordChannelId);
  if (!channel) {
    throw new Error(`Channel ${discordChannelId} not found`);
  }

  return channel as TextChannel;
}

function addRankedScoresToEmbed(
  embed: EmbedBuilder,
  rankedScores: Array<AllTimeScoreForSave | MonthlyScoreForSave>[]
): EmbedBuilder {
  if (rankedScores.length > 0) {
    embed.setDescription("Place - Player (Wins, Ties, Played)");
  } else {
    embed.setDescription("No scores yet!");
    return embed;
  }

  let totalPlayers = 0;
  rankedScores.forEach((scoresForPlace, placeIndex) => {
    // There's a limit to how many fields we can add to an embed. Top ten should be good enough.
    if (totalPlayers >= 10) {
      return;
    }

    const place = placeIndex + 1;
    const placePrefix =
      place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : "";
    const placeSuffix = place < 4 ? "" : `${place}th`;
    const placeString = `${placePrefix} ${placeSuffix}`;
    scoresForPlace.forEach((score) => {
      embed.addFields({
        name: "\u200B",
        value: `${placeString} - ${bold(score.discordUsername)} (${
          score.totalWins
        }, ${score.totalTies}, ${score.totalPlayed})`,
      });
      totalPlayers++;
    });
  });

  return embed;
}
