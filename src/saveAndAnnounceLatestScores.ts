import {
  getChannelLeaderboards,
  getWordleResultsForChannel,
  setLastGameNumber,
} from "./db";
import { getLastCompletedGameNumber } from "./game-number";
import { saveScoresForChannel } from "./saveScoresForChannel";

export async function saveAndAnnounceLatestScores() {
  const channelLeaderboards = await getChannelLeaderboards();
  for (const { discordChannelId, lastGameNumber } of channelLeaderboards) {
    console.log(`Saving scores for channel ${discordChannelId}...`);

    const minGameNumber =
      lastGameNumber === null ? lastGameNumber : lastGameNumber + 1;
    const maxGameNumber = getLastCompletedGameNumber();
    const latestResults = await getWordleResultsForChannel({
      discordChannelId,
      minGameNumber,
      maxGameNumber,
    });

    await saveScoresForChannel(discordChannelId, latestResults);
    await setLastGameNumber(discordChannelId, maxGameNumber);

    console.log(`Done saving scores for channel ${discordChannelId}.`);
  }
}
