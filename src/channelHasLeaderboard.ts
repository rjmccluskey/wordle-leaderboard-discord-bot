import { getChannelIsEnabled, setChannelIsEnabled } from "./cache";
import { client } from "./db";

export async function channelHasLeaderboard(
  channelId: string
): Promise<boolean> {
  let enabledFromCache = getChannelIsEnabled(channelId);
  if (enabledFromCache !== undefined) {
    return enabledFromCache;
  }

  const existingLeaderboard = await client.channelLeaderboard.findUnique({
    where: { discordChannelId: channelId },
  });
  if (existingLeaderboard) {
    const enabled = existingLeaderboard.enabled;
    setChannelIsEnabled(channelId, enabled);
    return enabled;
  }

  setChannelIsEnabled(channelId, false);
  return false;
}
