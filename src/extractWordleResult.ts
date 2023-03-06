export type ExtractedWordleResult = {
  gameNumber: number;
  score: number | null;
  raw: string;
};

export function extractWordleResult(
  messageContent: string
): ExtractedWordleResult | null {
  const matches = messageContent.match(
    /(Wordle\s(\d*)\s([1-6X])\/6\*?(?:\r?\n)*((?:[⬛🟨🟩⬜]*(\r?\n)){0,5}([⬛🟨🟩⬜]*)))/
  );
  if (!matches) return null;

  return {
    gameNumber: Number(matches[2]),
    score: matches[3] === "X" ? null : Number(matches[3]),
    raw: matches[1],
  };
}
