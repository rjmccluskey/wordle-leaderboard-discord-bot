import { client, WordleResult } from "./client";

export async function saveWordleResults(
  wordleResults: Array<Omit<WordleResult, "id">>
): Promise<void> {
  await client.wordleResult.createMany({
    data: wordleResults,
  });
}

export async function saveWordleResultIfNotExists(
  wordleResult: Omit<WordleResult, "id" | "createdAt">
): Promise<WordleResult | null> {
  const existingResult = await client.wordleResult.findFirst({
    where: {
      discordChannelId: wordleResult.discordChannelId,
      discordUserId: wordleResult.discordUserId,
      gameNumber: wordleResult.gameNumber,
    },
  });
  if (existingResult) return null;

  return await client.wordleResult.create({
    data: wordleResult,
  });
}
