import {
  getChannelLeaderboards,
  getRankedAllTimeScoresForChannel,
  getRankedMonthlyScoresForChannel,
  getWordleResultsForChannel,
  setLastGameNumber,
} from "./db";
import {
  getLastCompletedGameNumber,
  getMonthByGameNumber,
} from "./game-number";
import { saveScoresForChannel } from "./saveScoresForChannel";
import { announceScoresForChannel } from "./announceScoresForChannel";
import { announceWinnerForChannel } from "./announceWinnerForChannel";

export async function saveAndAnnounceLatestScores() {
  try {
    const channelLeaderboards = await getChannelLeaderboards();
    for (const { discordChannelId, lastGameNumber } of channelLeaderboards) {
      try {
        await saveAndAnnounceChannelScores(discordChannelId, lastGameNumber);
      } catch (e) {
        console.error(e);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function saveAndAnnounceChannelScores(
  discordChannelId: string,
  lastGameNumber: number
) {
  console.log(`Saving scores for channel ${discordChannelId}...`);

  const minGameNumber = lastGameNumber + 1;
  const maxGameNumber = getLastCompletedGameNumber();
  const [latestResults, lastAllTimeScores, lastMonthlyScores] =
    await Promise.all([
      getWordleResultsForChannel({
        discordChannelId,
        minGameNumber,
        maxGameNumber,
      }),
      getRankedAllTimeScoresForChannel(discordChannelId),
      getRankedMonthlyScoresForChannel(
        discordChannelId,
        getMonthByGameNumber(minGameNumber)
      ),
    ]);

  await saveScoresForChannel(discordChannelId, latestResults);
  await setLastGameNumber(discordChannelId, maxGameNumber);

  console.log(`Done saving scores for channel ${discordChannelId}.`);

  console.log(`Announcing scores for channel ${discordChannelId}...`);
  await announceWinnerForChannel(discordChannelId);
  await announceScoresForChannel(discordChannelId, maxGameNumber, {
    lastAllTimeScores,
    lastMonthlyScores,
  });
}
