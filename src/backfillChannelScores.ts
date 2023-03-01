import { Message, TextChannel } from "discord.js";
import {
  ExtractedWordleResult,
  extractWordleResult,
} from "./extractWordleResult";

export async function backfillChannelScores(channel: TextChannel) {
  const wordleResultMessages = await fetchAllWordleResultMessages(channel);
  console.log(wordleResultMessages);
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
