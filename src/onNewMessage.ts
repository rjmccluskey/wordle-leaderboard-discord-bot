import { Message } from "discord.js";
import { extractWordleResult } from "./extractWordleResult";
import { channelIsEnabled, saveWordleResultIfNotExists } from "./db";

export async function onNewMessage(message: Message): Promise<void> {
  try {
    if (message.author.bot) {
      console.log(`Ignoring message on channel ${message.channelId} from bot`);
      return;
    }
    if (!(await channelIsEnabled(message.channelId))) {
      console.log(
        `Ignoring message on channel ${message.channelId} because leaderboard is not enabled`
      );
      return;
    }

    const extractedResult = extractWordleResult(message.content);
    if (!extractedResult) {
      console.log(
        `Ignoring message on channel ${message.channelId} because it is not a wordle result`
      );
      return;
    }

    const wordleResult = await saveWordleResultIfNotExists({
      ...extractedResult,
      discordChannelId: message.channelId,
      discordUserId: message.author.id,
      discordUsername: message.author.username,
    });
    if (!wordleResult) {
      console.log(
        `Ignoring message on channel ${message.channelId} because it is a duplicate wordle result`
      );
      return;
    }

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
