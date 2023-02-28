import { Message } from "discord.js";
import { extractWordleResult } from "./extractWordleResult";

export async function onNewMessage(message: Message): Promise<void> {
  const extractedResult = extractWordleResult(message.content);
  console.log(extractedResult);
}
