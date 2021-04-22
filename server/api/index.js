const express = require("express");
const path = require("path");
const filewalker = require("../library/walk.js");

const application = express();

application.use(express.static(path.join(__dirname, "public")));

const init = async (client, secret) => {
    const routes = await filewalker.walk(`${__dirname}/routes/`);

    routes.forEach((route) => {
        const time = new Date().getMilliseconds();
        require(route.path)(application, client, secret);
        console.log(
            `[ROUTE] loaded route ${route.name} in ${
                new Date().getMilliseconds() - time
            }ms`
        );
    });

    application.listen(process.env.API_PORT, () => {
        console.log("[PANEL] listening on port " + process.env.API_PORT);
    });
};

module.exports = { init };
