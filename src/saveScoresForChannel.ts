import {
  AllTimeScoreForSave,
  DailyWinnerForSave,
  getAllTimeScoresForChannel,
  getMonthlyScoresForChannel,
  MonthlyScoreForSave,
  saveAllTimeScores,
  saveDailyWinners,
  saveMonthlyScores,
  WordleResultForSave,
} from "./db";
import { getMonthByGameNumber } from "./game-number";
import { keyBy } from "lodash";

export async function saveScoresForChannel(
  discordChannelId: string,
  wordleResults: WordleResultForSave[]
) {
  let minGameNumber: number | null = null;
  let maxGameNumber: number | null = null;
  const byGameNumber = wordleResults.reduce((acc, wordleResult) => {
    const gameNumber = wordleResult.gameNumber;

    if (minGameNumber === null || gameNumber < minGameNumber) {
      minGameNumber = gameNumber;
    }
    if (maxGameNumber === null || gameNumber > maxGameNumber) {
      maxGameNumber = gameNumber;
    }

    if (!acc[gameNumber]) {
      acc[gameNumber] = [];
    }
    acc[gameNumber].push(wordleResult);
    return acc;
  }, {} as { [gameNumber: number]: WordleResultForSave[] });

  if (minGameNumber === null || maxGameNumber === null) return;

  const [existingAllTimeScores, existingMonthlyScores] = await Promise.all([
    getAllTimeScoresForChannel(discordChannelId),
    getMonthlyScoresForChannel({
      discordChannelId,
      minMonth: getMonthByGameNumber(minGameNumber),
      maxMonth: getMonthByGameNumber(maxGameNumber),
    }),
  ]);

  const allTimeScoresByUserid: { [userId: string]: AllTimeScoreForSave } =
    keyBy(existingAllTimeScores, "discordUserId");
  const monthlyScoresMap = existingMonthlyScores.reduce((acc, monthlyScore) => {
    if (!acc[monthlyScore.month]) {
      acc[monthlyScore.month] = {};
    }
    acc[monthlyScore.month][monthlyScore.discordUserId] = monthlyScore;
    return acc;
  }, {} as { [month: string]: { [userId: string]: MonthlyScoreForSave } });
  const dailyWinners: DailyWinnerForSave[] = [];

  for (const gameNumber in byGameNumber) {
    let winnerUserIds: string[] = [];
    let winningScore: number | null = null;
    const gameNumberInt = parseInt(gameNumber, 10);
    const month = getMonthByGameNumber(gameNumberInt);

    byGameNumber[gameNumber].forEach((wordleResult) => {
      const discordUserId = wordleResult.discordUserId;
      const discordUsername = wordleResult.discordUsername;
      const score = wordleResult.score;
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
      // Update the username in case it changed
      allTimeScoresByUserid[discordUserId].discordUsername = discordUsername;

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
      // Update the username in case it changed
      monthlyScoresMap[month][discordUserId].discordUsername = discordUsername;

      allTimeScoresByUserid[discordUserId].totalPlayed++;
      monthlyScoresMap[month][discordUserId].totalPlayed++;

      if (score === null) {
        return;
      } else if (score === winningScore) {
        winnerUserIds.push(discordUserId);
      } else if (winningScore === null || score < winningScore) {
        winningScore = score;
        winnerUserIds = [discordUserId];
      }
    });

    if (winningScore === null) {
      continue;
    }

    if (winnerUserIds.length === 1) {
      allTimeScoresByUserid[winnerUserIds[0]].totalWins++;
      monthlyScoresMap[month][winnerUserIds[0]].totalWins++;
      dailyWinners.push({
        discordChannelId: discordChannelId,
        gameNumber: gameNumberInt,
        discordUserId: winnerUserIds[0],
        discordUsername:
          allTimeScoresByUserid[winnerUserIds[0]].discordUsername,
        score: winningScore,
      });
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
    saveDailyWinners(dailyWinners),
  ]);
}
