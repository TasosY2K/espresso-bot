const path = require("path");
const { Client, Collection } = require("discord.js");

const api = require("./api");
const filewalker = require("./library/walk.js");

const dotenv = require("dotenv");
dotenv.config();

const db = require("./models");
db.sequelize.sync();

init = async (
    settings = {
        token: process.env.BOT_TOKEN,
        fallbackPrefix: process.env.BOT_PREFIX,
        blacklistedUsers: [],
        blacklistedGuilds: [],
        sharding: false,
    }
) => {
    const client = new Client();

    client.commands = new Collection();
    client.settings = settings;
    client.logger = require("./library/logger.js");

    const commands = await filewalker.walk(path.join(__dirname, "commands"));
    const events = await filewalker.walk(path.join(__dirname, "events"));

    events.forEach((event) => {
        const time = new Date().getMilliseconds();
        client.on(
            event.name.split(".")[0],
            require(event.path).bind(null, client)
        );
        console.log(
            `[EVENT] loaded event ${event.name} in ${
                new Date().getMilliseconds() - time
            }ms`
        );
    });

    commands.forEach((command) => {
        const time = new Date().getMilliseconds();
        client.commands.set(command.name.split(".")[0], require(command.path));
        console.log(
            `[COMMAND] loaded command ${command.name} in ${
                new Date().getMilliseconds() - time
            }ms`
        );
    });

    await api.init();
    await client.login(settings.token);
};

init();
