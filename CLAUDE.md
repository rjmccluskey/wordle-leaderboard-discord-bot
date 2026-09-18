# CLAUDE.md

Discord bot that scrapes Wordle result messages from channels and maintains monthly + all-time leaderboards. TypeScript, discord.js v14, Prisma + MongoDB.

## Commands

- `npm run dev` — ts-node-dev with `dotenv/config`, respawns on change
- `npm start` / `npm run build` — run / compile (`build` runs `prisma generate` first)
- `npm run commands:deploy` — register slash commands with Discord (required after changing any `SlashCommandBuilder` definition)
- `npm run prisma:gen` — after editing `prisma/schema.prisma`
- `npm run prettier:fix` — formatting (default prettier config; no linter)
- No tests.

Env (`.env`, loaded via `-r dotenv/config`): `CLIENT_TOKEN`, `CLIENT_ID`, `DATABASE_URL`, optional `NODE_ENV=development`.

## Architecture

Two entry paths, both from `src/index.ts`:

1. **Message events** → `onNewMessage.ts`: skips bots and channels where the leaderboard isn't enabled, runs `extractWordleResult` on the content, saves the result if it isn't a duplicate, and reacts with a random emoji chosen by score.
2. **Daily cron** (croner, 00:05 America/Los_Angeles) → `saveAndAnnounceLatestScores.ts`: for each enabled channel, aggregates results since `lastGameNumber` into score records (`saveScoresForChannel`), advances `lastGameNumber`, announces the winner, then posts leaderboard embeds.

Slash commands live in `src/commands/` and are registered in the `commands` map in `src/commands/index.ts` (add new ones there, then redeploy). `/wl-add` creates the leaderboard and backfills by paging the channel's full message history back to 2021-06-19; `/wl-show` replies ephemerally with current embeds.

`src/db/` wraps Prisma — one file per model, all re-exported from `src/db/index.ts`. Code outside `src/db` should import from `./db`, not `@prisma/client`. `helpers.ts` holds `upsertMany` (Mongo has no native upsertMany) and `rankOrderedScores`, which groups an ordered score list into tie buckets — leaderboards are `T[][]`, one array per place.

## Domain notes

- **Game numbers**, not dates, are the unit of time. `game-number.ts` derives them from a hardcoded seed (game 627 = 2023-03-08) in America/Los_Angeles. Everything month-related (`MonthlyScore.month`, `"yyyy-MM"`) is computed from a game number.
- **Scoring**: lowest score wins the day; a single winner gets `totalWins`, multiple get `totalTies`. `score` is `null` for a failed (`X/6`) game and never wins.
- `extractWordleResult.ts` is one regex against pasted Wordle share text; it tolerates comma-separated game numbers and trailing text. Changing it affects both live capture and backfill.
- Announcements are suppressed when rankings haven't moved (`rankedScoresAreEqual`), except on the last game of a month.
- `cache.ts` is an in-memory map of enabled channel IDs, written by `channelIsEnabled`/`enableChannel`. It never invalidates, so a leaderboard disabled directly in the DB stays live until restart.
