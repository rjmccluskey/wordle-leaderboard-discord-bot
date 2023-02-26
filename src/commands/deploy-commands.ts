import { REST, Routes } from "discord.js";
import { commands } from "./";

const token = process.env.CLIENT_TOKEN;
if (token === undefined) {
  throw new Error("CLIENT_TOKEN is not defined");
}

const clientId = process.env.CLIENT_ID;
if (clientId === undefined) {
  throw new Error("CLIENT_ID is not defined");
}

const rest = new REST({ version: "10" }).setToken(token);

const jsonCommands = [];
for (const command in commands) {
  jsonCommands.push(commands[command].data.toJSON());
}

(async () => {
  try {
    console.log(
      `Started refreshing ${jsonCommands.length} application (/) commands.`
    );

    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: jsonCommands,
    });

    console.log(
      `Successfully reloaded ${(data as any).length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
