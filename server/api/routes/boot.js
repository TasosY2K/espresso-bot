const db = require("../../models");
const v = require("../../library/verifier.js");
const aes = require("../../library/aes.js");

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

                const clientData = await db.Client.findAll({
                    where: {
                        identifier: identifier,
                    },
                });

                if (results.length > 0) {
                    if (results[0].endTime > new Date()) {
                        res.status(200).json({
                            identifier: aes.encrypt(
                                clientData[0].sessionKey,
                                results[0].identifier
                            ),
                            ip: aes.encrypt(
                                clientData[0].sessionKey,
                                results[0].ip
                            ),
                            port: aes.encrypt(
                                clientData[0].sessionKey,
                                results[0].port.toString()
                            ),
                            endTime: aes.encrypt(
                                clientData[0].sessionKey,
                                results[0].endTime.toJSON()
                            ), //?
                        });
                    } else {
                        await db.Boot.destroy({
                            where: {
                                tracknum: 1,
                            },
                        });

                        //No booting instructions found
                        res.sendStatus(403);
                    }
                } else {
                    //No booting instructions found
                    res.sendStatus(403);
                }
            } else {
                //Bot not found or token/id is invalid
                res.sendStatus(401);
            }
        } else {
            //Missing POST field
            res.sendStatus(403);
        }
    });
};
