const db = require("../models");

exports.run = async (client, message, args) => {
    if (args.length == 2) {
        const results = await db.Client.findAll({
            where: {
                id: args[0],
            },
        });

        if (results.length > 0) {
            await db.Client.update(
                {
                    tag: args[1],
                },
                {
                    where: {
                        id: args[0],
                    },
                }
            );

            message.channel.send("Tag updated");
        } else {
            message.channel.send("Invalid ID");
        }
    } else {
        message.channel.send("Invalid arguments");
    }
};
