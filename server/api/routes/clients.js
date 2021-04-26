const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");
const db = require("../../models");
const ip = require("../../library/ip.js");
const v = require("../../library/verifier.js");

module.exports = (application) => {
    application.post("/client/register", async (req, res) => {
        const identifier = nanoid();
        const token = nanoid();
        const ipAddress = "78.87.194.58";
        let ipInfo = await ip.info(ipAddress);
        ipInfo = ipInfo.data;

        let options = {};

        options.identifier = identifier;
        options.token = bcrypt.hashSync(token);

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
                res.status(200).json({
                    message: "Client found and token matches",
                });
            } else {
                res.status(401).json({
                    message: "Client not found or token/id is invalid",
                });
            }
        } else {
            res.status(403).json({
                message: "Missing POST field",
            });
        }
    });

    application.post("/update/details/:identifier/:token", async (req, res) => {
        const { identifier, token } = req.params;
        const postdata = req.body;
        if (identifier && token) {
            const verify = await v.validate(identifier, token);
            if (verify) {
                const ipAddress = "78.87.194.58";
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

                db.Client.update(options, {
                    where: {
                        identifier: identifier,
                    },
                }).then(() => {
                    res.status(200).json({
                        message: "Update OK",
                    });
                });
            } else {
                res.status(401).json({
                    message: "Client not found or token/id is invalid",
                });
            }
        } else {
            res.status(403).json({
                message: "Missing token/id or not enough POST fields",
            });
        }
    });
};
