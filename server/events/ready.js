require("dotenv").config();

module.exports = (client) => {
    console.log(`[READY] ready for ${client.guilds.cache.size} guilds`);
    console.log(
        `[INVITE] https://discord.com/oauth2/authorize?client_id=${process.env.BOT_ID}&scope=bot`
    );
    client.user.setActivity(`${client.settings.fallbackPrefix}help`);
};
