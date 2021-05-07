const { nanoid } = require("nanoid");

const v = require("../../library/verifier.js");
const db = require("../../models");
const aes = require("../../library/aes.js");

module.exports = (application) => {
    application.get("/load/:identifier/:token", async (req, res) => {
        const { identifier, token } = req.params;
        if (identifier && token) {
            const verify = await v.validate(identifier, token);
            if (verify) {
                const results = await db.Client.findAll({
                    where: {
                        identifier: identifier,
                    },
                });

                if (results[0].fileRunStatus) {
                    res.status(200).json({
                        file: aes.encrypt(
                            results[0].sessionKey,
                            results[0].fileToRun
                        ),
                    });
                } else {
                    //No file url deployed
                    res.sendStatus(403);
                }
            } else {
                //Client not found or token/id is invalid
                res.sendStatus(401);
            }
        } else {
            //Client not found or token/id is invalid
            res.sendStatus(403);
        }
    });

    application.post("/loadcheck/:identifier/:token", async (req, res) => {
        const { identifier, token } = req.params;
        if (identifier && token) {
            const verify = await v.validate(identifier, token);
            if (verify) {
                db.Client.update(
                    {
                        fileToRun: null,
                        fileRunStatus: false,
                    },
                    {
                        where: {
                            identifier: identifier,
                        },
                    }
                );
                //Update status OK
                res.sendStatus(200);
            } else {
                //Client not found or token/id is invalid
                res.sendStatus(401);
            }
        } else {
            //Client not found or token/id is invalid
            res.sendStatus(403);
        }
    });
};
