import { Optional } from "utility-types";
import { client, WordleResult } from "./client";

export type { WordleResult } from "./client";

export type WordleResultForSave = Optional<WordleResult, "id" | "createdAt">;

export async function saveWordleResults(
  wordleResults: WordleResultForSave[]
): Promise<void> {
  await client.wordleResult.createMany({
    data: wordleResults,
  });
}

export async function saveWordleResultIfNotExists(
  wordleResult: WordleResultForSave
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

export async function getWordleResultsForChannel({
  discordChannelId,
  minGameNumber = null,
  maxGameNumber = null,
}: {
  discordChannelId: string;
  minGameNumber?: number | null;
  maxGameNumber?: number | null;
}): Promise<WordleResult[]> {
  return client.wordleResult.findMany({
    where: {
      discordChannelId,
      ...((minGameNumber || maxGameNumber) && {
        gameNumber: {
          ...(minGameNumber && { gte: minGameNumber }),
          ...(maxGameNumber && { lte: maxGameNumber }),
        },
      }),
    },
  });
}

export async function getWinningResultsForChannel(
  discordChannelId: string,
  gameNumber: number
): Promise<WordleResult[]> {
  const allResultsSorted = await client.wordleResult.findMany({
    where: {
      discordChannelId,
      gameNumber,
    },
    orderBy: { score: "asc" },
  });
  if (allResultsSorted.length === 0) return [];

  let winners: WordleResult[] = [];
  for (const result of allResultsSorted) {
    if (winners.length === 0) {
      winners.push(result);
      continue;
    }

    const winningScore = winners[0].score;
    if (winningScore === null && result.score !== null) {
      winners = [result];
    } else if (result.score === winningScore) {
      winners.push(result);
    } else {
      break;
    }
  }

  return winners;
}
