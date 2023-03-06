import { getChannelIsEnabled, setChannelIsEnabled } from "../cache";
import { client, ChannelLeaderboard } from "./client";

export async function getChannelLeaderboardByChannelId(
  discordChannelId: string
): Promise<ChannelLeaderboard | null> {
  return client.channelLeaderboard.findUnique({
    where: { discordChannelId },
  });
}

export async function createChannelLeaderboard({
  discordChannelId,
  enabled = false,
}: {
  discordChannelId: string;
  enabled?: boolean;
}): Promise<ChannelLeaderboard> {
  return client.channelLeaderboard.create({
    data: {
      discordChannelId,
      enabled,
    },
  });
}

export async function channelIsEnabled(channelId: string): Promise<boolean> {
  let enabledFromCache = getChannelIsEnabled(channelId);
  if (enabledFromCache !== undefined) {
    return enabledFromCache;
  }

  const existingLeaderboard = await getChannelLeaderboardByChannelId(channelId);
  if (existingLeaderboard) {
    const enabled = existingLeaderboard.enabled;
    setChannelIsEnabled(channelId, enabled);
    return enabled;
  }

  setChannelIsEnabled(channelId, false);
  return false;
}

export async function enableChannel(channelId: string): Promise<void> {
  await client.channelLeaderboard.update({
    where: { discordChannelId: channelId },
    data: { enabled: true },
  });
  setChannelIsEnabled(channelId, true);
}
