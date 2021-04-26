const { MessageMentions } = require("discord.js");

module.exports = async (client, message) => {
    const prefix = client.settings.fallbackPrefix;

    if (message.author.bot || message.content.indexOf(prefix) !== 0) return;

    if (!client.settings.allowedUsers.includes(message.author.id)) {
        return message.channel.send("Fuck you, you're not in the whitelist");
    }

    console.log(
        `[MESSAGE] message recieved in ${message.guild} from ${message.author.id}`
    );

    const args = message.content
        .slice(prefix.length)
        .trim()
        .replace(MessageMentions.CHANNELS_PATTERN, "")
        .replace(MessageMentions.EVERYONE_PATTERN, "")
        .replace(MessageMentions.ROLES_PATTERN, "")
        .replace(MessageMentions.USERS_PATTERN, "")
        .split(/ +/g);

    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command);
    if (!cmd) return;

    cmd.run(client, message, args);
};
