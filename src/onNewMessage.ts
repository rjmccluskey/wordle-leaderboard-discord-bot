import { DiscordAPIError, Message } from "discord.js";
import { extractWordleResult } from "./extractWordleResult";
import {
  channelIsEnabled,
  saveWordleResultIfNotExists,
  WordleResult,
} from "./db";
import { random } from "lodash";

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
      discordUsername: message.member?.displayName || message.author.username,
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

    await sendReaction(message, wordleResult);
  } catch (error) {
    console.error(error);
  }
}

async function sendReaction(
  message: Message,
  wordleResult: WordleResult,
  totalTries: number = 0
): Promise<void> {
  const emoji = getReactionByScore(wordleResult.score);
  try {
    await message.react(emoji);
  } catch (e) {
    if (e instanceof DiscordAPIError && e.code === 10014) {
      console.error(`Unknown emoji for Discord message reaction: ${emoji}.`);
      if (totalTries < 3) {
        await sendReaction(message, wordleResult, ++totalTries);
      }
      return;
    }

    throw e;
  }
}

function getReactionByScore(score: number | null): string {
  const reactions = reactionsByScore[score || "X"];
  return getRandomValueFromArray(reactions);
}

const reactionsByScore: { [score: number | string]: string[] } = {
  1: ["🍀", "🍞"],
  // prettier-ignore
  2: ["🔥", "😍", "🤩", "🥳", "😲", "🤤", "🤑", "😻", "✌️", "🫰", "🫦", "☄️", "💥", "🚀", "💸"],
  // prettier-ignore
  3: ["👏", "😋", "😎", "🤗", "🫡", "🙌", "🤘", "👌", "🤙", "💪", "✨", "🍻", "🥂"],
  4: ["👍", "😀", "😌", "😸", "🤝", "🍺"],
  5: ["😅", "🫠", "😯", "👀"],
  6: ["😬", "🤪", "😱", "😓", "🫣", "😑", "😮", "😮‍💨", "🙀", "🤏", "🙏"],
  // prettier-ignore
  X: ["😵", "🙃", "😖", "😩", "😢", "😭", "🫢", "😵‍💫", "🤡", "💩", "☠️", "😿", "🙅‍", "🤦‍", "🪦", "⚰️"],
};

function getRandomValueFromArray<T>(array: T[]): T {
  return array[random(0, array.length - 1)];
}
