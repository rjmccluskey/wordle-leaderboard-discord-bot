import { bold, EmbedBuilder, inlineCode } from "discord.js";
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
import { SHOW_WORDLE_LEADERBOARD } from "./commands/wl-show";

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

  const monthlyPositionsHaveChanged =
    lastScores.lastMonthlyScores &&
    !rankedScoresAreEqual(lastScores.lastMonthlyScores, rankedMonthlyScores);
  const isLastGameOfMonth =
    getMonthByGameNumber(lastGameNumber) !==
    getMonthByGameNumber(lastGameNumber + 1);
  if (
    !lastScores.lastMonthlyScores ||
    monthlyPositionsHaveChanged ||
    isLastGameOfMonth
  ) {
    const monthlyScoresEmbed = buildMonthlyLeaderboardEmbed(
      rankedMonthlyScores,
      lastGameNumber
    );
    embeds.push(monthlyScoresEmbed);
  }

  const allTimePositionsHaveChanged =
    lastScores.lastAllTimeScores &&
    !rankedScoresAreEqual(lastScores.lastAllTimeScores, rankedAllTimeScores);
  if (!lastScores.lastAllTimeScores || allTimePositionsHaveChanged) {
    let allTimeScoresEmbed = buildAllTimeLeaderboardEmbed(rankedAllTimeScores);
    embeds.push(allTimeScoresEmbed);
  }

  if (embeds.length > 0) {
    if (monthlyPositionsHaveChanged || allTimePositionsHaveChanged) {
      await channel.send(bold("Leaderboard positions have changed!"));
    }
    await channel.send({ embeds });
  } else {
    await channel.send(
      `Leaderboard positions have not changed. Use the ${inlineCode(
        `/${SHOW_WORDLE_LEADERBOARD}`
      )} command to see the current leaderboards.`
    );
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
