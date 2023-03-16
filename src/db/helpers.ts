import { PrismaClient } from "@prisma/client";
import { client } from "./client";
import { omit } from "lodash";

export async function upsertMany<T extends { id?: string; updatedAt?: Date }>(
  entity: keyof Omit<
    PrismaClient,
    | "$on"
    | "$connect"
    | "$disconnect"
    | "$use"
    | "$transaction"
    | "$runCommandRaw"
  >,
  records: T[]
): Promise<void> {
  const newRecords = records.filter((record) => !record.id);
  if (newRecords.length) {
    await (client[entity] as any).createMany({
      data: newRecords,
    });
  }
  await Promise.all(
    records
      .filter((record) => record.id)
      .map((record) =>
        (client[entity] as any).update({
          where: { id: record.id },
          data: omit(record, ["id", "updatedAt"]),
        })
      )
  );
}

export function rankOrderedScores<
  T extends { totalWins: number; totalTies: number; totalPlayed: number }
>(orderedScores: T[]): T[][] {
  return orderedScores.reduce((acc, score) => {
    if (acc.length === 0) {
      acc.push([score]);
      return acc;
    }

    const current = acc[acc.length - 1];
    if (
      current[0].totalWins === score.totalWins &&
      current[0].totalTies === score.totalTies &&
      current[0].totalPlayed === score.totalPlayed
    ) {
      current.push(score);
      return acc;
    }

    acc.push([score]);
    return acc;
  }, [] as T[][]);
}
