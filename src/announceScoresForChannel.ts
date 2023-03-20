import { bold, EmbedBuilder } from "discord.js";
import {
  AllTimeScoreForSave,
  getRankedAllTimeScoresForChannel,
  getRankedMonthlyScoresForChannel,
  MonthlyScoreForSave,
} from "./db";
import { getMonthByGameNumber } from "./game-number";
import { getChannel } from "./getChannel";
import {
  buildAllTimeLeaderboardEmbed,
  buildMonthlyLeaderboardEmbed,
} from "./leaderboard-embeds";

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
    const monthlyScoresEmbed = buildMonthlyLeaderboardEmbed(
      rankedMonthlyScores,
      lastGameNumber
    );
    embeds.push(monthlyScoresEmbed);
  }

  if (
    !lastScores.lastAllTimeScores ||
    !rankedScoresAreEqual(lastScores.lastAllTimeScores, rankedAllTimeScores)
  ) {
    let allTimeScoresEmbed = buildAllTimeLeaderboardEmbed(rankedAllTimeScores);
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
