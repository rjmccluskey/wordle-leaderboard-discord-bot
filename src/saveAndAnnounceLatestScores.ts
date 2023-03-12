import {
  getChannelLeaderboards,
  getWordleResultsForChannel,
  setLastGameNumber,
} from "./db";
import { getLastCompletedGameNumber } from "./game-number";
import { saveScoresForChannel } from "./saveScoresForChannel";
import { announceScoresForChannel } from "./announceScoresForChannel";

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
  const latestResults = await getWordleResultsForChannel({
    discordChannelId,
    minGameNumber,
    maxGameNumber,
  });

  await saveScoresForChannel(discordChannelId, latestResults);
  await setLastGameNumber(discordChannelId, maxGameNumber);

  console.log(`Done saving scores for channel ${discordChannelId}.`);

  console.log(`Announcing scores for channel ${discordChannelId}...`);
  await announceScoresForChannel(discordChannelId, maxGameNumber);
}
