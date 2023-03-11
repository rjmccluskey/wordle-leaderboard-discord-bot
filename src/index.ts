import { Events, GatewayIntentBits } from "discord.js";
import cron from "node-cron";
import { handleSlashCommands } from "./commands";
import { onNewMessage } from "./onNewMessage";
import { saveAndAnnounceLatestScores } from "./saveAndAnnounceLatestScores";
import { client } from "./client";

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, onNewMessage);
client.on(Events.InteractionCreate, handleSlashCommands);

client.login(process.env.CLIENT_TOKEN).catch((error) => console.error(error));

// Run every day at 12:05am
// The extra 5 minutes hopefully helps if the bot is first added right before midnight and is still backfilling.
cron.schedule("5 0 * * *", saveAndAnnounceLatestScores, {
  timezone: "America/Los_Angeles",
  scheduled: process.env.NODE_ENV === "production",
});
