const db = require("../models");
const ip = require("../library/ip.js");
const { nanoid } = require("nanoid");

exports.run = async (client, message, args) => {
    if (args.length == 1) {
        if (args[0] == "stop") {
            const results = await db.Boot.findAll({
                where: {
                    tracknum: 1,
                },
            });

            if (results.length > 0) {
                await db.Boot.destroy({
                    where: {
                        tracknum: 1,
                    },
                });

                message.channel.send("Boot instructions removed");
            } else {
                message.channel.send("No boot instructions set");
            }
        } else if (args[0] == "status") {
            const results = await db.Boot.findAll({
                where: {
                    tracknum: 1,
                },
            });

            if (results.length > 0) {
                if (results[0].endTime > new Date()) {
                    message.channel.send(
                        `\`\`\`ID: ${results[0].identifier}\nIP: ${results[0].ip}\nPORT: ${results[0].port}\nSTARTED AT: ${results[0].createdAt.toLocaleString()}\nENDING AT: ${results[0].endTime.toLocaleString()}\nDURATION: ${results[0].duration} minutes\`\`\``
                    );
                } else {
                    await db.Boot.destroy({
                        where: {
                            tracknum: 1,
                        },
                    });

                    message.channel.send("No boot instructions set");
                }
            } else {
                message.channel.send("No boot instructions set");
            }
        } else {
            message.channel.send("Invalid argument");
        }
    } else if (args.length == 3) {
        if (!ip.validate(args[0]))
            return message.channel.send("Invalid IP address");
        if (parseInt(args[1]) <= 0 || parseInt(args[1]) > 65535)
            return message.channel.send("Invalid port range");
        if (parseInt(args[2]) <= 0 || parseInt(args[2]) > 24)
            return message.channel.send("Duration invalid or too big");

        const results = await db.Boot.findAll({
            where: {
                tracknum: 1,
            },
        });

        uniqueid = nanoid();

        if (results.length > 0) {
            let startTime = new Date();
            let endTime = new Date();

            endTime.setTime(endTime.getTime() + args[2] * 60 * 1000);

            await db.Boot.update(
                {
                    identifier: uniqueid,
                    ip: args[0],
                    port: args[1],
                    duration: args[2],
                    startTime: startTime,
                    endTime: endTime,
                },
                {
                    where: {
                        tracknum: 1,
                    },
                }
            );

            setTimeout(async () => {
                const results = await db.Boot.findAll({
                    where: {
                        tracknum: 1,
                    },
                });

                if (results.length > 0 && results[0].identifier == uniqueid) {
                    db.Boot.destroy({
                        where: {
                            tracknum: 1,
                        },
                    });
                }
            }, args[2] * 60000);

            message.channel.send("Boot instructions updated");
        } else {
            let startTime = new Date();
            let endTime = new Date();

            endTime.setTime(endTime.getTime() + args[2] * 60 * 1000);

            await db.Boot.create({
                tracknum: 1,
                identifier: uniqueid,
                ip: args[0],
                port: args[1],
                duration: args[2],
                startTime: startTime,
                endTime: endTime,
            });

            setTimeout(async () => {
                const results = await db.Boot.findAll({
                    where: {
                        tracknum: 1,
                    },
                });

                if (results.length > 0 && results[0].identifier == uniqueid) {
                    db.Boot.destroy({
                        where: {
                            tracknum: 1,
                        },
                    });
                }
            }, args[2] * 60000);

            message.channel.send("Boot instructions deployed");
        }
    } else {
        message.channel.send("Invalid argument");
    }
};
