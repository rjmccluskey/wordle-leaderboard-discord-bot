import { client, MonthlyScore } from "./client";

export type NewMonthlyScore = Omit<
  MonthlyScore,
  "id" | "createdAt" | "updatedAt"
>;

export async function saveMonthlyScores(
  allTimeScores: Array<NewMonthlyScore>
): Promise<void> {
  await client.monthlyScore.createMany({
    data: allTimeScores,
  });
}
