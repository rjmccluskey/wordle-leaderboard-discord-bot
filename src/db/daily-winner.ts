import { client, DailyWinner } from "./client";
import { Optional } from "utility-types";

export type DailyWinnerForSave = Optional<Omit<DailyWinner, "id">, "createdAt">;

export async function saveDailyWinners(
  data: DailyWinnerForSave[]
): Promise<void> {
  if (data.length === 0) {
    return;
  }
  await client.dailyWinner.createMany({ data });
}
