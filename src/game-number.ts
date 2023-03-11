import { differenceInCalendarDays, addDays } from "date-fns";
import { toDate, formatInTimeZone } from "date-fns-tz";

const seedGameNumber = 627;
const seedDateString = "2023-03-08";
const timeZone = "America/Los_Angeles";

export function getGameNumberByDate(date: Date): number {
  let targetDateString = formatInTimeZone(date, timeZone, "yyyy-MM-dd");

  const seedDate = toDate(seedDateString, { timeZone });
  const targetDate = toDate(targetDateString, { timeZone });

  const daysSinceSeed = differenceInCalendarDays(targetDate, seedDate);

  const gameNumber = seedGameNumber + daysSinceSeed;
  if (gameNumber < 1) {
    throw new Error("Date is before wordle was created");
  }

  return gameNumber;
}

export function getLastCompletedGameNumber(): number {
  return getGameNumberByDate(new Date()) - 1;
}

export function getDateByGameNumber(gameNumber: number): Date {
  const seedDate = toDate(seedDateString, { timeZone });
  const daysSinceSeed = gameNumber - seedGameNumber;
  return addDays(seedDate, daysSinceSeed);
}

const monthByGameNumberCache: { [gameNumber: number]: string } = {};

export function getMonthByGameNumber(gameNumber: number): string {
  if (!monthByGameNumberCache[gameNumber]) {
    const date = getDateByGameNumber(gameNumber);
    monthByGameNumberCache[gameNumber] = formatInTimeZone(
      date,
      timeZone,
      "yyyy-MM"
    );
  }
  return monthByGameNumberCache[gameNumber];
}
