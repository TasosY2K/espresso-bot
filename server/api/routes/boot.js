const db = require("../../models");
const v = require("../../library/verifier.js");

module.exports = (application) => {
    application.get("/boot/:identifier/:token", async (req, res) => {
        const { identifier, token } = req.params;
        if (identifier && token) {
            const verify = await v.validate(identifier, token);
            if (verify) {
                db.Client.findAll({
                    where: {
                        id: 1,
                    },
                }).then((results) => {
                    if (results.length > 0) {
                        res.status(200).json({
                            identifier: results[0].identifier,
                            ip: results[0].ip,
                            port: results[0].port,
                            host: results[0].host,
                            duration: results[0].duration,
                        });
                    } else {
                        res.status(403).json({
                            message: "No booting instructions found",
                        });
                    }
                });
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
