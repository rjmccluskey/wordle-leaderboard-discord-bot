import { PrismaClient } from "@prisma/client";
import { client } from "./client";

export async function upsertMany<T extends { id?: string }>(
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
          data: record,
        })
      )
  );
}
