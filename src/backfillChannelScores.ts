import { Message, TextChannel } from "discord.js";
import {
  ExtractedWordleResult,
  extractWordleResult,
} from "./extractWordleResult";
import {
  saveWordleResults,
  NewAllTimeScore,
  saveAllTimeScores,
  NewMonthlyScore,
  saveMonthlyScores,
} from "./db";
import {
  getLastCompletedGameNumber,
  getMonthByGameNumber,
} from "./game-number";

export async function backfillChannelScores(
  channel: TextChannel
): Promise<number> {
  const lastCompletedGameNumber = getLastCompletedGameNumber();
  const wordleResultMessages = await fetchAllWordleResultMessages(channel);
  await Promise.all([
    saveWordleResultsFromWordleResultMessages(wordleResultMessages),
    saveScoresFromWordleResultMessages(
      wordleResultMessages,
      lastCompletedGameNumber
    ),
  ]);

  return lastCompletedGameNumber;
}

async function saveWordleResultsFromWordleResultMessages(
  wordleResultMessages: WordleResultMessage[]
): Promise<void> {
  const wordleResults = wordleResultMessages.map((wordleResultMessage) => ({
    ...wordleResultMessage.extractedWordleResult,
    discordChannelId: wordleResultMessage.message.channelId,
    discordUserId: wordleResultMessage.message.author.id,
    discordUsername: wordleResultMessage.message.author.username,
    createdAt: wordleResultMessage.message.createdAt,
  }));
  await saveWordleResults(wordleResults);
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
  wordleResultMessages: WordleResultMessage[],
  lastCompletedGameNumber: number
): Promise<void> {
  const byGameNumber = wordleResultMessages.reduce(
    (acc, wordleResultMessage) => {
      const gameNumber = wordleResultMessage.extractedWordleResult.gameNumber;
      if (gameNumber > lastCompletedGameNumber) return acc;

      if (!acc[gameNumber]) {
        acc[gameNumber] = [];
      }
      acc[gameNumber].push(wordleResultMessage);
      return acc;
    },
    {} as { [gameNumber: number]: WordleResultMessage[] }
  );

  const allTimeScoresByUserid: {
    [userId: string]: NewAllTimeScore;
  } = {};
  const monthlyScoresMap: {
    [month: string]: { [userId: string]: NewMonthlyScore };
  } = {};
  for (const gameNumber in byGameNumber) {
    let winnerUserIds: string[] = [];
    let winningScore: number | null = null;
    const month = getMonthByGameNumber(parseInt(gameNumber, 10));

    byGameNumber[gameNumber].forEach((wordleResultMessage) => {
      const discordUserId = wordleResultMessage.message.author.id;
      const discordUsername = wordleResultMessage.message.author.username;
      const discordChannelId = wordleResultMessage.message.channelId;
      const score = wordleResultMessage.extractedWordleResult.score;
      if (!allTimeScoresByUserid[discordUserId]) {
        allTimeScoresByUserid[discordUserId] = {
          discordUserId,
          discordUsername,
          discordChannelId,
          totalPlayed: 0,
          totalWins: 0,
          totalTies: 0,
        };
      }
      if (!monthlyScoresMap[month]) {
        monthlyScoresMap[month] = {};
      }
      if (!monthlyScoresMap[month][discordUserId]) {
        monthlyScoresMap[month][discordUserId] = {
          month,
          discordUserId,
          discordUsername,
          discordChannelId,
          totalPlayed: 0,
          totalWins: 0,
          totalTies: 0,
        };
      }

      if (score === winningScore) {
        winnerUserIds.push(discordUserId);
      } else if (
        score !== null &&
        (winningScore === null || score < winningScore)
      ) {
        winningScore = score;
        winnerUserIds = [discordUserId];
      }

      allTimeScoresByUserid[discordUserId].totalPlayed++;
      monthlyScoresMap[month][discordUserId].totalPlayed++;
    });

    if (winnerUserIds.length === 1) {
      allTimeScoresByUserid[winnerUserIds[0]].totalWins++;
      monthlyScoresMap[month][winnerUserIds[0]].totalWins++;
    } else {
      winnerUserIds.forEach((discordUserId) => {
        allTimeScoresByUserid[discordUserId].totalTies++;
        monthlyScoresMap[month][discordUserId].totalTies++;
      });
    }
  }

  await Promise.all([
    saveAllTimeScores(Object.values(allTimeScoresByUserid)),
    saveMonthlyScores(Object.values(monthlyScoresMap).flatMap(Object.values)),
  ]);
}
