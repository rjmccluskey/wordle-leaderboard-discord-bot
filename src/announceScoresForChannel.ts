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
  lastGameNumber: number,
  lastScores: {
    lastAllTimeScores?: AllTimeScoreForSave[][];
    lastMonthlyScores?: MonthlyScoreForSave[][];
  } = {}
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

  const embeds: EmbedBuilder[] = [];

  if (
    !lastScores.lastMonthlyScores ||
    !rankedScoresAreEqual(lastScores.lastMonthlyScores, rankedMonthlyScores)
  ) {
    const displayMonth = getDisplayMonthByGameNumber(lastGameNumber);
    let monthlyScoresEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`${displayMonth} Leaderboard`);
    monthlyScoresEmbed = addRankedScoresToEmbed(
      monthlyScoresEmbed,
      rankedMonthlyScores
    );
    embeds.push(monthlyScoresEmbed);
  }

  if (
    !lastScores.lastAllTimeScores ||
    !rankedScoresAreEqual(lastScores.lastAllTimeScores, rankedAllTimeScores)
  ) {
    let allTimeScoresEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("All-Time Leaderboard");
    allTimeScoresEmbed = addRankedScoresToEmbed(
      allTimeScoresEmbed,
      rankedAllTimeScores
    );
    embeds.push(allTimeScoresEmbed);
  }

  if (embeds.length > 0) {
    // We don't want to say the leaderboard has changed if it's the first time announcing it.
    if (lastScores.lastAllTimeScores && lastScores.lastAllTimeScores) {
      await channel.send(bold("Leaderboard rankings have changed!"));
    }
    await channel.send({ embeds });
  }
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

function rankedScoresAreEqual(
  rankedScores1: Array<AllTimeScoreForSave | MonthlyScoreForSave>[],
  rankedScores2: Array<AllTimeScoreForSave | MonthlyScoreForSave>[]
): boolean {
  if (rankedScores1.length !== rankedScores2.length) {
    return false;
  }

  for (let i = 0; i < rankedScores1.length; i++) {
    const scoresForPlace1 = rankedScores1[i];
    const scoresForPlace2 = rankedScores2[i];
    if (scoresForPlace1.length !== scoresForPlace2.length) {
      return false;
    }

    for (let j = 0; j < scoresForPlace1.length; j++) {
      const score1 = scoresForPlace1[j];
      const score2 = scoresForPlace2[j];
      if (score1.discordUserId !== score2.discordUserId) {
        return false;
      }
    }
  }

  return true;
}
