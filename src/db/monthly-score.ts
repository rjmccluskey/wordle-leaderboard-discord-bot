import { client, MonthlyScore } from "./client";
import { Optional } from "utility-types";
import { rankOrderedScores, upsertMany } from "./helpers";

export type MonthlyScoreForSave = Optional<
  MonthlyScore,
  "id" | "createdAt" | "updatedAt"
>;

export async function saveMonthlyScores(
  monthlyScores: Array<MonthlyScoreForSave>
): Promise<void> {
  await upsertMany("monthlyScore", monthlyScores);
}

export async function getMonthlyScoresForChannel({
  discordChannelId,
  minMonth,
  maxMonth,
}: {
  discordChannelId: string;
  minMonth?: string;
  maxMonth?: string;
}): Promise<MonthlyScore[]> {
  return client.monthlyScore.findMany({
    where: {
      discordChannelId,
      ...((minMonth || maxMonth) && {
        month: {
          ...(minMonth && { gte: minMonth }),
          ...(maxMonth && { lte: maxMonth }),
        },
      }),
    },
  });
}

export async function getRankedMonthlyScoresForChannel(
  discordChannelId: string,
  month: string
): Promise<MonthlyScore[][]> {
  const orderedScores = await client.monthlyScore.findMany({
    where: {
      discordChannelId,
      month,
    },
    orderBy: [
      {
        totalWins: "desc",
      },
      {
        totalTies: "desc",
      },
      {
        totalPlayed: "desc",
      },
    ],
  });

  return rankOrderedScores(orderedScores);
}
