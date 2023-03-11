import { client, AllTimeScore } from "./client";
import { Optional } from "utility-types";
import { upsertMany } from "./helpers";

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
