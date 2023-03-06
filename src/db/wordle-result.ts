import { client, WordleResult } from "./client";

export async function saveWordleResults(
  wordleResults: Array<Omit<WordleResult, "id">>
): Promise<void> {
  await client.wordleResult.createMany({
    data: wordleResults,
  });
}
