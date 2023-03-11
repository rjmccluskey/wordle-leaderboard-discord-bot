import { PrismaClient } from "@prisma/client";

const globalWithPrisma = global as typeof globalThis & {
  prismaClient: PrismaClient;
};

export const client: PrismaClient =
  globalWithPrisma.prismaClient || new PrismaClient();

if (process.env.NODE_ENV === "development") {
  // Setting the client on global prevents multiple instances caused by hot reloading in development
  globalWithPrisma.prismaClient = client;
}

// Export all the generated types
export type {
  AllTimeScore,
  ChannelLeaderboard,
  MonthlyScore,
  WordleResult,
} from "@prisma/client";
