const db = require("../../models");
const v = require("../../library/verifier.js");

module.exports = (application) => {
    application.get("/boot/:identifier/:token", async (req, res) => {
        const { identifier, token } = req.params;
        if (identifier && token) {
            const verify = await v.validate(identifier, token);
            if (verify) {
                await db.Client.update(
                    {
                        lastLogin: new Date(),
                    },
                    {
                        where: {
                            identifier: identifier,
                        },
                    }
                );

                const results = await db.Boot.findAll({
                    where: {
                        tracknum: 1,
                    },
                });

                if (results.length > 0) {
                    if (results[0].endTime > new Date()) {
                        res.status(200).json({
                            identifier: results[0].identifier,
                            ip: results[0].ip,
                            port: results[0].port.toString(),
                            host: results[0].host,
                            endTime: results[0].endTime,
                        });
                    } else {
                        await db.Boot.destroy({
                            where: {
                                tracknum: 1,
                            },
                        });

                        res.status(403).json({
                            message: "No booting instructions found",
                        });
                    }
                } else {
                    res.status(403).json({
                        message: "No booting instructions found",
                    });
                }
            } else {
                res.status(401).json({
                    message: "Bot not found or token/id is invalid",
                });
            }
        } else {
            res.status(403).json({
                message: "Missing POST field",
            });
        }
    });
};
