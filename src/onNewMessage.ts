import { Message } from "discord.js";
import { extractWordleResult } from "./extractWordleResult";
import { channelIsEnabled, saveWordleResultIfNotExists } from "./db";

export async function onNewMessage(message: Message): Promise<void> {
  try {
    if (message.author.bot) return;
    if (!(await channelIsEnabled(message.channelId))) return;

    const extractedResult = extractWordleResult(message.content);
    if (!extractedResult) return;

    const wordleResult = await saveWordleResultIfNotExists({
      ...extractedResult,
      discordChannelId: message.channelId,
      discordUserId: message.author.id,
      discordUsername: message.author.username,
    });
    if (!wordleResult) return;

    console.log(
      `New wordle result posted on channel ${wordleResult.discordChannelId} by user ${wordleResult.discordUserId}`
    );

    await message.react(
      wordleResult.score ? reactionByScore[wordleResult.score] : "😵"
    );
  } catch (error) {
    console.error(error);
  }
}

const reactionByScore: { [score: number]: string } = {
  1: "🤯",
  2: "🔥",
  3: "👏",
  4: "👍",
  5: "😅",
  6: "😬",
};
