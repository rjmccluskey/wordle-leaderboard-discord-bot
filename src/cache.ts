type Cache = {
  enabledChannels: { [channelId: string]: boolean | undefined };
};

const cache: Cache = {
  enabledChannels: {},
};

export function setChannelIsEnabled(channelId: string, isEnabled: boolean) {
  cache.enabledChannels[channelId] = isEnabled;
}

export function getChannelIsEnabled(channelId: string): boolean | undefined {
  return cache.enabledChannels[channelId];
}
