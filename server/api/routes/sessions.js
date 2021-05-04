const { nanoid } = require("nanoid");

const aes = require("../../library/aes");
const v = require("../../library/verifier.js");
const db = require("../../models");

module.exports = (application) => {
    application.get("/session/key/:identifier/:token", async (req, res) => {
        const { identifier, token } = req.params;
        if (identifier && token) {
            const verify = await v.validate(identifier, token);
            if (verify) {

                const results = await db.Client.findAll({
                    where: {
                        identifier: identifier
                    }
                });

                if (results[0].sessionEnd > new Date()) {
                    res.status(200).json({
                        key: results[0].sessionKey
                    });
                } else {
                    const sessionKey = nanoid(32);

                    let sessionEnd = new Date();
                    sessionEnd.setTime(sessionEnd.getTime() + process.env.SESSION_DURATION * 60 * 1000);

                    await db.Client.update(
                        {
                            sessionKey: sessionKey,
                            sessionEnd: sessionEnd,
                        },
                        {
                            where: {
                                identifier: identifier,
                            },
                        }
                    );

                    res.status(200).json({
                        key: sessionKey
                    });
                }

                
            } else {
                //Client not found or token/id is invalid
                res.status(401);
            }
        } else {
            //Client not found or token/id is invalid
            res.status(403);
        }
    });
};