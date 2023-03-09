import { client, AllTimeScore } from "./client";

export type NewAllTimeScore = Omit<AllTimeScore, "id" | "createdAt" | "updatedAt">;

export async function saveAllTimeScores(
  allTimeScores: Array<NewAllTimeScore>
): Promise<void> {
  await client.allTimeScore.createMany({
    data: allTimeScores,
  });
}
