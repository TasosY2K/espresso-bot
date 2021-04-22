const bcrypt = require("bcryptjs");
const db = require("../models");

exports.validate = async (identifier, token) => {
    let result;
    if (identifier && token) {
        await db.Client.findAll({
            where: {
                identifier: identifier,
            },
        }).then((results) => {
            if (results.length > 0) {
                if (bcrypt.compareSync(token, results[0].token)) {
                    result = true;
                } else {
                    result = false;
                }
            } else {
                result = false;
            }
        });
    } else {
        result = false;
    }
    return result;
};
