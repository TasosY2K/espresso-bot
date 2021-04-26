const path = require("path");
const { Client, Collection } = require("discord.js");

const api = require("./api");
const filewalker = require("./library/walk.js");

const allowedUsers = require("../users.json");

const dotenv = require("dotenv");
dotenv.config();

const db = require("./models");
const Op = db.Sequelize.Op;

db.sequelize.sync();

setInterval(() => {
    db.Boot.destroy({
        where: {
            endTime: {
                [Op.lt]: new Date(),
            },
        },
    });
}, 60000);

init = async (
    settings = {
        token: process.env.BOT_TOKEN,
        fallbackPrefix: process.env.BOT_PREFIX,
        version: process.env.npm_package_version,
        allowedUsers: allowedUsers.users,
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
