import { Client, Events, GatewayIntentBits } from "discord.js";
import { handleSlashCommands } from "./commands";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  console.log(message.content);
});

client.on(Events.InteractionCreate, handleSlashCommands);

client.login(process.env.CLIENT_TOKEN);
