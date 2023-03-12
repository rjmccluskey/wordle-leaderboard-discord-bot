import { bold, EmbedBuilder } from "discord.js";
import {
  AllTimeScoreForSave,
  getRankedAllTimeScoresForChannel,
  getRankedMonthlyScoresForChannel,
  MonthlyScoreForSave,
} from "./db";
import {
  getDisplayMonthByGameNumber,
  getMonthByGameNumber,
} from "./game-number";
import { getChannel } from "./getChannel";

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
