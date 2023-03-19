import { client, AllTimeScore } from "./client";
import { Optional } from "utility-types";
import { rankOrderedScores, upsertMany } from "./helpers";

export type AllTimeScoreForSave = Optional<
  AllTimeScore,
  "id" | "createdAt" | "updatedAt"
>;

export async function saveAllTimeScores(
  allTimeScores: Array<AllTimeScoreForSave>
): Promise<void> {
  await upsertMany("allTimeScore", allTimeScores);
}

export async function getAllTimeScoresForChannel(
  discordChannelId: string
): Promise<AllTimeScore[]> {
  return client.allTimeScore.findMany({
    where: {
      discordChannelId,
    },
  });
}

export async function getRankedAllTimeScoresForChannel(
  discordChannelId: string
): Promise<AllTimeScore[][]> {
  const orderedScores = await client.allTimeScore.findMany({
    where: {
      discordChannelId,
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
    take: 10,
  });

  return rankOrderedScores(orderedScores);
}
