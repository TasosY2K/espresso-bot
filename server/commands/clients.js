const moment = require("moment");
const Discord = require("discord.js");
const paginationEmbed = require("discord.js-pagination");
const db = require("../models");
const Op = db.Sequelize.Op;

exports.run = (client, message, args) => {
    if (args.length == 0) {
        db.Client.findAll().then((results) => {
            if (results.length > 0) {
                const clientsPerPage = 3;
                let pages = [];
                let fields = [];

                for (const [index, element] of results.reverse().entries()) {
                    let expDate = new Date();
                    expDate.setTime(expDate.getTime() - 5 * 60 * 1000);
                    const formattedDate =
                        element.updatedAt > expDate
                            ? "🟢 Online"
                            : "🔴 Offline";

                    fields.push({
                        name: !element.tag ? "No tag" : element.tag,
                        value: `
                            **ID**: ${element.id}
                            **Status**: ${formattedDate}
                            **Last connection**: \n${moment(
                                element.updatedAt
                            ).format("YYYY-MM-DD HH:mm:ss")}
                            **IP Address**: ${element.ipAddress}
                            **Country**: ${element.country}
                        `,
                        inline: true,
                    });

                    if (
                        index % clientsPerPage == 2 ||
                        index == results.length - 1
                    ) {
                        const embed = new Discord.MessageEmbed()
                            .setColor("#0099ff")
                            .addFields(fields);

                        pages.push(embed);
                        fields = [];
                    }
                }

                paginationEmbed(message, pages);
            } else {
                message.channel.send("No clients connected");
            }
        });
    } else if (args.length == 1) {
        db.Client.findAll({
            where: {
                [Op.or]: [
                    {
                        id: args[0],
                    },
                    {
                        tag: args[0],
                    },
                ],
            },
        }).then(async (results) => {
            if (results.length > 0) {
                const element = results[0];

                let expDate = new Date();
                expDate.setTime(expDate.getTime() - 5 * 60 * 1000);
                const formattedDate =
                    element.updatedAt > expDate ? "🟢 Online" : "🔴 Offline";

                const embed = new Discord.MessageEmbed()
                    .setColor("#0099ff")
                    .addFields({
                        name: !element.tag ? "No tag found" : element.tag,
                        value: `
                            **ID**: ${element.id}
                            **Status**: ${formattedDate}
                            **IP Address**: ${element.ipAddress}
                            **Country**: ${element.country}
                            **Region**: ${element.region}
                            **City**: ${element.city}
                            **Location**: https://www.google.com/maps/search/?api=1&query=${element.lat},${element.lon}
                            **ISP**: ${element.isp}
                        `,
                    })
                    .setThumbnail(
                        `https://www.countryflags.io/${element.countryCode}/flat/64.png`
                    )
                    .setFooter(
                        `Last connection: ${moment(element.updatedAt).format(
                            "YYYY-MM-DD HH:mm:ss"
                        )}`
                    );

                message.channel.send(embed);
            } else {
                message.channel.send("Client not found");
            }
        });
    }
};
