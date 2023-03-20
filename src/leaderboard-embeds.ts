import { bold, EmbedBuilder } from "discord.js";
import { AllTimeScoreForSave, MonthlyScoreForSave } from "./db";
import { getDisplayMonthByGameNumber } from "./game-number";

export function buildAllTimeLeaderboardEmbed(
  rankedAllTimeScores: AllTimeScoreForSave[][]
): EmbedBuilder {
  let allTimeScoresEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("All-Time Leaderboard");
  return addRankedScoresToEmbed(allTimeScoresEmbed, rankedAllTimeScores);
}

export function buildMonthlyLeaderboardEmbed(
  rankedMonthlyScores: MonthlyScoreForSave[][],
  lastGameNumber: number
): EmbedBuilder {
  const displayMonth = getDisplayMonthByGameNumber(lastGameNumber);
  const displayMonthTomorrow = getDisplayMonthByGameNumber(lastGameNumber + 1);
  let titleSuffix = "";
  if (displayMonth !== displayMonthTomorrow) {
    titleSuffix = " (FINAL RESULTS)";
  }

  let monthlyScoresEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`${displayMonth} Leaderboard${titleSuffix}`);
  return addRankedScoresToEmbed(monthlyScoresEmbed, rankedMonthlyScores);
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
