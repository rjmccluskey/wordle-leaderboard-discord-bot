import { client, MonthlyScore } from "./client";
import { Optional } from "utility-types";
import { upsertMany } from "./helpers";

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
      ...(minMonth && { month: { gte: minMonth } }),
      ...(maxMonth && { month: { lte: maxMonth } }),
    },
  });
}
