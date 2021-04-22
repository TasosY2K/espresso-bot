const db = require("../models");
const ip = require("../library/ip.js");
const { nanoid } = require("nanoid");

exports.run = (client, message, args) => {
    if (args.length == 1) {
        if (args[0] == "stop") {
            db.Boot.findAll({
                where: {
                    id: 1,
                },
            }).then((results) => {
                if (results.length > 0 && results[0].ip != null) {
                    db.Boot.update(
                        {
                            identifier: null,
                            ip: null,
                            port: null,
                            duration: null,
                        },
                        {
                            where: {
                                id: 1,
                            },
                        }
                    ).then(() => {
                        message.channel.send("Boot instructions removed");
                    });
                } else {
                    message.channel.send("No boot instructions set");
                }
            });
        } else if (args[0] == "status") {
            db.Boot.findAll({
                where: {
                    id: 1,
                },
            }).then((results) => {
                if (results.length > 0 && results[0].ip != null) {
                    message.channel.send(
                        `\`\`\`ID: ${results[0].identifier}\nIP: ${results[0].ip}\nPORT: ${results[0].port}\nDURATION: ${results[0].duration} minutes\`\`\``
                    );
                } else {
                    message.channel.send("No boot instructions set");
                }
            });
        } else {
            message.channel.send("Invalid argument");
        }
    } else if (args.length == 3) {
        if (ip.validate(args[0])) {
            if (parseInt(args[1]) > 0 && parseInt(args[1]) < 65535) {
                if (parseInt(args[2]) > 0 && parseInt(args[2]) < 24) {
                    db.Boot.findAll({
                        where: {
                            id: 1,
                        },
                    }).then((results) => {
                        uniqueid = nanoid();
                        if (results.length > 0) {
                            db.Boot.update(
                                {
                                    identifier: uniqueid,
                                    ip: args[0],
                                    port: args[1],
                                    duration: args[2],
                                },
                                {
                                    where: {
                                        id: 1,
                                    },
                                }
                            ).then(() => {
                                setTimeout(() => {
                                    db.Boot.findAll({
                                        where: {
                                            id: 1,
                                        },
                                    }).then((results) => {
                                        if (
                                            results.length > 0 &&
                                            results[0].identifier == uniqueid
                                        ) {
                                            console.log(0);
                                            db.Boot.update(
                                                {
                                                    identifier: null,
                                                    ip: null,
                                                    port: null,
                                                    duration: null,
                                                },
                                                {
                                                    where: {
                                                        id: 1,
                                                    },
                                                }
                                            );
                                        }
                                    });
                                }, args[2] * 60000);

                                message.channel.send(
                                    "Boot instructions updated"
                                );
                            });
                        } else {
                            db.Boot.create({
                                identifier: uniqueid,
                                ip: args[0],
                                port: args[1],
                                duration: args[2],
                            }).then(() => {
                                setTimeout(() => {
                                    db.Boot.findAll({
                                        where: {
                                            id: 1,
                                        },
                                    }).then((results) => {
                                        if (
                                            results.length > 0 &&
                                            results[0].identifier == uniqueid
                                        ) {
                                            db.Boot.update(
                                                {
                                                    identifier: null,
                                                    ip: null,
                                                    port: null,
                                                    duration: null,
                                                },
                                                {
                                                    where: {
                                                        id: 1,
                                                    },
                                                }
                                            );
                                        }
                                    });
                                }, args[2] * 60000);

                                message.channel.send(
                                    "Boot instructions deployed"
                                );
                            });
                        }
                    });
                } else {
                    message.channel.send("Duration invalid or too big");
                }
            } else {
                message.channel.send("Invalid port range");
            }
        } else {
            message.channel.send("Invalid IP address");
        }
    } else {
        message.channel.send("Invalid argument");
    }
};
