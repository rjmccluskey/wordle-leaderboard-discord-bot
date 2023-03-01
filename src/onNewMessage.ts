import { Message } from "discord.js";
import { extractWordleResult } from "./extractWordleResult";
import { channelIsEnabled } from "./db";

export async function onNewMessage(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!(await channelIsEnabled(message.channelId))) return;

  const extractedResult = extractWordleResult(message.content);
  console.log(extractedResult);
}
