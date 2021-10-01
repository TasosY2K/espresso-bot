const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");
const db = require("../../models");
const ip = require("../../library/ip.js");
const aes = require("../../library/aes.js");
const v = require("../../library/verifier.js");

module.exports = (application) => {
    application.post("/client/register", async (req, res) => {
        const identifier = nanoid();
        const token = nanoid();
        const ipAddress = req.ip;
        let ipInfo = await ip.info(ipAddress);
        ipInfo = ipInfo.data;

        let sessionEnd = new Date();
        sessionEnd.setTime(
            sessionEnd.getTime() + process.env.SESSION_DURATION * 60 * 1000
        );

        let options = {};

        options.identifier = identifier;
        options.token = bcrypt.hashSync(token);

        options.sessionKey = nanoid(32);
        options.sessionEnd = sessionEnd;

        options.lastLogin = new Date();

        options.ipAddress = ipAddress;
        options.country = ipInfo.country;
        options.countryCode = ipInfo.countryCode;
        options.region = ipInfo.regionName;
        options.regionCode = ipInfo.region;
        options.city = ipInfo.city;
        options.lat = ipInfo.lat;
        options.lon = ipInfo.lon;
        options.isp = ipInfo.isp;

        db.Client.create(options).then(() => {
            res.status(200).json({
                message: "Registered OK",
                identifier: identifier,
                token: token,
            });
        });
    });

    application.get("/client/check/:identifier/:token", async (req, res) => {
        const { identifier, token } = req.params;
        if (identifier && token) {
            const verify = await v.validate(identifier, token);
            if (verify) {
                //Client found and token matches
                res.sendStatus(200);
            } else {
                //Client not found or token/id is invalid
                res.sendStatus(401);
            }
        } else {
            //Missing POST field
            res.sendStatus(403);
        }
    });

    application.post("/update/details/:identifier/:token", async (req, res) => {
        const { identifier, token } = req.params;
        const postdata = req.body;
        if (identifier && token && postdata) {
            const verify = await v.validate(identifier, token);
            if (verify) {
                const ipAddress = req.ip;
                let ipInfo = await ip.info(ipAddress);
                ipInfo = ipInfo.data;

                let options = {};

                options.ipAddress = ipAddress;
                options.country = ipInfo.country;
                options.countryCode = ipInfo.countryCode;
                options.region = ipInfo.regionName;
                options.regionCode = ipInfo.region;
                options.city = ipInfo.city;
                options.lat = ipInfo.lat;
                options.lon = ipInfo.lon;
                options.isp = ipInfo.isp;

                const clientData = await db.Client.findAll({
                    where: {
                        identifier: identifier,
                    },
                });

                options.hostname = aes.decrypt(
                    clientData[0].sessionKey,
                    postdata.hostname
                );
                options.platform = aes.decrypt(
                    clientData[0].sessionKey,
                    postdata.platform
                );
                options.arch = aes.decrypt(
                    clientData[0].sessionKey,
                    postdata.arch
                );

                db.Client.update(options, {
                    where: {
                        identifier: identifier,
                    },
                }).then(() => {
                    //Update OK
                    res.sendStatus(200);
                });
            } else {
                //Client not found or token/id is invalid
                res.sendStatus(401);
            }
        } else {
            //Missing token/id or not enough POST fields
            res.sendStatus(403);
        }
    });
};
