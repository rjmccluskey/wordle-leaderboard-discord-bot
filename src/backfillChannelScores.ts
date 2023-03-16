import { Message, TextChannel } from "discord.js";
import {
  ExtractedWordleResult,
  extractWordleResult,
} from "./extractWordleResult";
import { saveWordleResults, WordleResultForSave } from "./db";
import { getLastCompletedGameNumber } from "./game-number";
import { saveScoresForChannel } from "./saveScoresForChannel";

export async function backfillChannelScores(
  channel: TextChannel
): Promise<number> {
  const lastCompletedGameNumber = getLastCompletedGameNumber();
  const wordleResultMessages = await fetchAllWordleResultMessages(channel);
  const wordleResults = await saveWordleResultsFromWordleResultMessages(
    wordleResultMessages
  );
  await saveScoresFromWordleResultMessages(
    wordleResults,
    lastCompletedGameNumber,
    channel.id
  );

  return lastCompletedGameNumber;
}

async function saveWordleResultsFromWordleResultMessages(
  wordleResultMessages: WordleResultMessage[]
): Promise<WordleResultForSave[]> {
  const wordleResults = wordleResultMessages.map((wordleResultMessage) => {
    const message = wordleResultMessage.message;
    return {
      ...wordleResultMessage.extractedWordleResult,
      discordChannelId: message.channelId,
      discordUserId: message.author.id,
      discordUsername: message.member?.displayName || message.author.username,
      createdAt: message.createdAt,
    };
  });
  await saveWordleResults(wordleResults);
  return wordleResults;
}

type WordleResultMessage = {
  extractedWordleResult: ExtractedWordleResult;
  message: Message;
};

async function fetchAllWordleResultMessages(
  channel: TextChannel
): Promise<WordleResultMessage[]> {
  const messagesMap: {
    [userId: string]: { [gameNumber: string]: WordleResultMessage };
  } = {};
  let lastId: string | undefined;

  while (true) {
    const fetchedMessages = await channel.messages.fetch({
      limit: 100,
      ...(lastId && { before: lastId }),
    });

    const discordMessages = Array.from(fetchedMessages.values());
    if (
      discordMessages.length === 0 ||
      discordMessages[0].createdAt < new Date("2021-06-19")
    ) {
      return Object.values(messagesMap).flatMap((messagesMappedByGameNumber) =>
        Object.values(messagesMappedByGameNumber)
      );
    }

    discordMessages.forEach((message) => {
      if (!messagesMap[message.author.id]) {
        messagesMap[message.author.id] = {};
      }

      const extractedWordleResult = extractWordleResult(message.content);
      if (!extractedWordleResult) return;

      // The list is in descending order, so any duplicate results will always be overwritten
      // by the first result posted by the user.
      messagesMap[message.author.id][
        extractedWordleResult.gameNumber.toString()
      ] = {
        extractedWordleResult,
        message,
      };
    });

    lastId = fetchedMessages.lastKey();
  }
}

async function saveScoresFromWordleResultMessages(
  wordleResults: WordleResultForSave[],
  lastCompletedGameNumber: number,
  discordChannelId: string
): Promise<void> {
  const wordleResultsToScore = wordleResults.filter(
    (wordleResult) => wordleResult.gameNumber <= lastCompletedGameNumber
  );
  await saveScoresForChannel(discordChannelId, wordleResultsToScore);
}
