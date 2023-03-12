import { TextChannel } from "discord.js";
import { client } from "./client";

export async function getChannel(
  discordChannelId: string
): Promise<TextChannel> {
  const channel = await client.channels.cache.get(discordChannelId);
  if (!channel) {
    throw new Error(`Channel ${discordChannelId} not found`);
  }

  return channel as TextChannel;
}
