import { Message } from "discord.js";
import { extractWordleResult } from "./extractWordleResult";
import { channelHasLeaderboard } from "./channelHasLeaderboard";

export async function onNewMessage(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!(await channelHasLeaderboard(message.channelId))) return;

  const extractedResult = extractWordleResult(message.content);
  console.log(extractedResult);
}
