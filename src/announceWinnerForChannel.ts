import { getLastCompletedGameNumber } from "./game-number";
import { getWinningResultsForChannel } from "./db";
import { bold } from "discord.js";
import { getChannel } from "./getChannel";

export async function announceWinnerForChannel(
  discordChannelId: string
): Promise<void> {
  const lastGameNumber = getLastCompletedGameNumber();
  const [winningResults, channel] = await Promise.all([
    getWinningResultsForChannel(discordChannelId, lastGameNumber),
    getChannel(discordChannelId),
  ]);

  let winnersString: string;
  if (winningResults.length === 0) {
    winnersString = "No one 😢";
  } else if (winningResults.length === 1) {
    winnersString = bold(
      `${winningResults[0].discordUsername.toUpperCase()}!!!`
    );
  } else {
    winnersString = `${winningResults.length} way tie:\n${winningResults
      .map((result) => result.discordUsername.toUpperCase())
      .join(", ")}`;
  }

  await channel.send(
    `
${bold(`Wordle ${lastGameNumber}`)}

...and the winner is... 🥁🥁🥁

${bold(winnersString)}

Score: ${winningResults[0]?.score ?? "X"}`
  );
}
